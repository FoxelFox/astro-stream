import {Line} from "../../shared/node/2D/line";
import {device} from "./gpu";
import {Mat3} from "wgpu-matrix";

export class LinePass {

	lines: Line[] = []
	linesNeedUpdate: boolean = true

	vertexBuffer: GPUBuffer
	matrixBuffer: GPUBuffer
	indirectBuffer: GPUBuffer

	constructor() {

	}

	update(camera: Mat3) {
		if (this.linesNeedUpdate) {
			this.updateBuffers();
			this.linesNeedUpdate = false;
		}


		// render
	}

	updateBuffers() {
		let length = 0;
		for (const line of this.lines) {
			length += line.vertices.length;
		}

		const vertices = new Float32Array(length)
		const matrices = new Float32Array(9 * this.lines.length);
		const indirect = new Uint32Array(this.lines.length * 4);
		let vOffset = 0;
		let mOffset = 0;
		let i = 0;
		for (const line of this.lines) {
			vertices.set(line.vertices, vOffset);
			matrices.set(line.transform, mOffset);
			vOffset += line.vertices.length;
			mOffset += line.transform.length;

			// vertexCount
			indirect[i * 4] = line.vertices.length / 2;

			// instanceCount (each draw is one object)
			indirect[i * 4 + 1] = 1;

			// firstVertex (all objects use the same vertex data from the start)
			indirect[i * 4 + 2] = 0;

			// firstInstance (used as object_id to index matrixBuffer)
			indirect[i * 4 + 3] = i;

			i++;
		}

		// vertex buffer
		if (!this.vertexBuffer || this.vertexBuffer.size !== vertices.byteLength) {
			if (this.vertexBuffer) {
				this.vertexBuffer.destroy();
			}

			this.vertexBuffer = device.createBuffer({
				label: 'Vertex Buffer for Line Strip',
				size: vertices.byteLength,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
			});
		}

		device.queue.writeBuffer(this.vertexBuffer, 0, vertices)

		// matrix buffer
		if (!this.matrixBuffer || this.matrixBuffer.size !== matrices.byteLength) {
			if (this.matrixBuffer) {
				this.matrixBuffer.destroy();
			}

			this.matrixBuffer = device.createBuffer({
				label: 'Matrix Buffer for Line Strip',
				size: matrices.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
			});
		}
		device.queue.writeBuffer(this.matrixBuffer, 0, matrices);

		// indirect buffer
		if (!this.indirectBuffer || this.indirectBuffer.size !== indirect.byteLength) {
			if (this.indirectBuffer) {
				this.indirectBuffer.destroy();
			}
			this.indirectBuffer = device.createBuffer({
				label: 'Indirect Draw Commands Buffer',
				size: indirect.byteLength,
				usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
			});
		}
		device.queue.writeBuffer(this.indirectBuffer, 0, indirect);

	}

	add(node: Line) {
		this.lines.push(node);
		this.linesNeedUpdate = true;
	}

	remove(node: Line) {
		const i = this.lines.indexOf(node);
		this.lines.splice(i, 1);
		this.linesNeedUpdate = true;
	}


}

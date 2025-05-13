import {Line} from "../../shared/node/2D/line";
import {device} from "./gpu";
import {Mat3} from "wgpu-matrix";

export class LinePass {

	lines: Line[] = []
	linesNeedUpdate: boolean = true

	vertexBuffer: GPUBuffer
	matrixBuffer: GPUBuffer

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
		let vOffset = 0;
		let mOffset = 0;
		for (const line of this.lines) {
			vertices.set(line.vertices, vOffset);
			matrices.set(line.transform, mOffset);
			vOffset += line.vertices.length;
			mOffset += line.transform.length;
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

import {Line} from "../../../shared/node/2D/line";
import {context, device} from "../gpu";
import {Mat3} from "wgpu-matrix";
import lineShader from "./line.wgsl" with { type: "text" };

export class LinePass {

	lines: Line[] = []
	linesNeedUpdate: boolean = true

	vertexBuffer: GPUBuffer
	matrixBuffer: GPUBuffer
	vertexToObjectIDBuffer: GPUBuffer

	pipeline: GPURenderPipeline
	layout: GPUPipelineLayout

	constructor() {

		const shader = device.createShaderModule({
			label: 'Line Strip Shader Module',
			code: lineShader,
		})

		this.layout = device.createPipelineLayout({
			bindGroupLayouts: [
				device.createBindGroupLayout({
					entries: [{
						binding: 0,
						visibility: GPUShaderStage.VERTEX,
						buffer: { type: "read-only-storage" }
					}]
				})
			]
		});

		this.pipeline = device.createRenderPipeline({
			label: 'Line Strip Render Pipeline',
			layout: this.layout,
			vertex: {
				module: shader
			}
		})
	}

	update(camera: Mat3) {
		if (this.linesNeedUpdate) {
			this.updateBuffers();
			this.linesNeedUpdate = false;
		}


		this.render();
	}




	render() {

		const commandEncoder = device.createCommandEncoder({ label: 'Command Encoder' });
		const textureView = context.getCurrentTexture().createView();

		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [{
				view: textureView,
				clearValue: { r: 0.05, g: 0.05, b: 0.1, a: 1.0 }, // Dark blue-ish background
				loadOp: 'clear',
				storeOp: 'store'
			}]
		};

		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
		// passEncoder.draw()
	}

	updateBuffers() {
		let length = 0;
		for (const line of this.lines) {
			length += line.vertices.length;
		}

		const vertices = new Float32Array(length)
		const matrices = new Float32Array(9 * this.lines.length);
		const vertexToObjectID = new Uint32Array(length);
		let vOffset = 0;
		let mOffset = 0;
		let i = 0;
		for (const line of this.lines) {
			vertices.set(line.vertices, vOffset);
			matrices.set(line.transform, mOffset);
			vertexToObjectID.fill(i, vOffset, line.vertices.length);
			vOffset += line.vertices.length;
			mOffset += line.transform.length;
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

		// vertexToObjectID buffer
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
		if (!this.vertexToObjectIDBuffer || this.vertexToObjectIDBuffer.size !== vertexToObjectID.byteLength) {
			if (this.vertexToObjectIDBuffer) {
				this.vertexToObjectIDBuffer.destroy();
			}
			this.vertexToObjectIDBuffer = device.createBuffer({
				label: 'Vertex to ObjectID Buffer',
				size: vertexToObjectID.byteLength,
				usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
			});
		}
		device.queue.writeBuffer(this.vertexToObjectIDBuffer, 0, vertexToObjectID);

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

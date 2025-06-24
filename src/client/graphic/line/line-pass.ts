import {Line} from "../../../shared/node/2D/line";
import {context, device} from "../gpu";
import {mat4, Mat4} from "wgpu-matrix";
import vertexShader from "./line.vertex.wgsl" with {type: "text"};
import fragmentShader from "./line.fragment.wgsl" with {type: "text"};
import {Camera} from "../camera";

export class LinePass {

	lines: Line[] = []
	linesNeedUpdate: boolean = true

	vertexBuffer: GPUBuffer
	colorBuffer: GPUBuffer
	matrixBuffer: GPUBuffer
	cameraUniformBuffer: GPUBuffer
	vertexToMatrixBuffer: GPUBuffer

	uniformBindGroup: GPUBindGroup;

	pipeline: GPURenderPipeline
	vertexCount: number

	update(camera: Camera) {

		let dirty = false;
		for (const line of this.lines) {
			if (line.dirty) {
				dirty = true;
				break;
			}
		}

		if (this.linesNeedUpdate || dirty) {
			this.updateBuffers(camera, true);
			this.linesNeedUpdate = false;
		} else {
			this.updateBuffers(camera);
		}

		this.render(camera);
	}

	init() {
		this.pipeline = device.createRenderPipeline({
			label: 'Line List Render Pipeline',
			layout: 'auto',
			vertex: {
				module: device.createShaderModule({
					label: 'Line List Vertex Shader',
					code: vertexShader
				}),
				buffers: [{
					arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT,
					attributes: [{
						shaderLocation: 0,
						offset: 0,
						format: 'float32x2'
					}]
				}, {
					arrayStride: Float32Array.BYTES_PER_ELEMENT,
					attributes: [{
						shaderLocation: 1,
						offset: 0,
						format: 'uint32'
					}]
				}, {
					arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
					attributes: [{
						shaderLocation: 2,
						offset: 0,
						format: 'float32x4'
					}]
				}]
			},
			fragment: {
				module: device.createShaderModule({
					label: 'Line List Fragment Shader',
					code: fragmentShader,
				}),
				targets: [{
					format: navigator.gpu.getPreferredCanvasFormat(),
					blend: {
						color: {
							srcFactor: 'src-alpha',
							dstFactor: 'one',
							operation: 'add',
						},
						alpha: {
							srcFactor: 'zero',
							dstFactor: 'one',
							operation: 'add',
						},
					}
				}]
			},
			primitive: {
				topology: 'line-list'
			},
			multisample: {
				count: 4,
			}
		});
	}

	updateBuffers(camera: Camera, fullUpdate?: boolean) {
		this.vertexCount = 0;
		for (const line of this.lines) {
			this.vertexCount += line.vertices.length / 2;
		}

		const vertices = new Float32Array(this.vertexCount * 2)
		const colors = new Float32Array(this.vertexCount * 4)
		const matrices = new Float32Array(16 * this.lines.length);
		const vertexToObjectID = new Uint32Array(this.vertexCount);
		let vOffset = 0;
		let mOffset = 0;
		let cOffset = 0;
		let i = 0;
		for (const line of this.lines) {
			matrices.set(line.getGlobalTransform(), mOffset);

			if (fullUpdate) {
				vertices.set(line.vertices, vOffset);

				for (let c = 0; c < line.vertices.length; c += 2) {
					colors.set(line.color, cOffset);
					cOffset += line.color.length;
				}
				vertexToObjectID.fill(i, vOffset / 2, vOffset / 2 + line.vertices.length / 2);
			}

			vOffset += line.vertices.length;
			mOffset += line.transform.length;
			i++;
		}

		if (fullUpdate) {
			// vertex buffer
			if (!this.vertexBuffer || this.vertexBuffer.size !== vertices.byteLength) {
				if (this.vertexBuffer) {
					this.vertexBuffer.destroy();
				}

				this.vertexBuffer = device.createBuffer({
					label: 'Vertex Buffer for Lines',
					size: vertices.byteLength,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				});
			}

			device.queue.writeBuffer(this.vertexBuffer, 0, vertices)

			// indirect buffer
			if (!this.vertexToMatrixBuffer || this.vertexToMatrixBuffer.size !== vertexToObjectID.byteLength) {
				if (this.vertexToMatrixBuffer) {
					this.vertexToMatrixBuffer.destroy();
				}
				this.vertexToMatrixBuffer = device.createBuffer({
					label: 'Vertex to ObjectID Buffer',
					size: vertexToObjectID.byteLength,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				});
			}
			device.queue.writeBuffer(this.vertexToMatrixBuffer, 0, vertexToObjectID);

			// color buffer
			if (!this.colorBuffer || this.colorBuffer.size !== colors.byteLength) {
				if (this.colorBuffer) {
					this.colorBuffer.destroy();
				}

				this.colorBuffer = device.createBuffer({
					label: 'Color Buffer for Lines',
					size: colors.byteLength,
					usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
				});
			}

			device.queue.writeBuffer(this.colorBuffer, 0, colors)
		}


		let recreateUniform = false;
		const vp = new Float32Array(32);
		//vp.set(camera.projection, 0);
		vp.set(camera.getViewProjection(), 0);

		vp.set(mat4.inverse(camera.target.transform), 16);
		if (!this.cameraUniformBuffer) {
			this.cameraUniformBuffer = device.createBuffer({
				size: 32 * Float32Array.BYTES_PER_ELEMENT,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
			});
			recreateUniform = true;
		}
		device.queue.writeBuffer(this.cameraUniformBuffer, 0, vp);

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
			recreateUniform = true;
		}
		device.queue.writeBuffer(this.matrixBuffer, 0, matrices);

		if (recreateUniform) {
			this.uniformBindGroup = device.createBindGroup({
				layout: this.pipeline.getBindGroupLayout(0),
				entries: [{
					binding: 0,
					resource: {buffer: this.cameraUniformBuffer}
				}, {
					binding: 1,
					resource: {buffer: this.matrixBuffer}
				}]
			});
		}
	}

	render(camera: Camera) {

		const commandEncoder = device.createCommandEncoder({label: 'Command Encoder'});
		const textureView = context.getCurrentTexture().createView();

		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [{
				view: camera.multisampleTexture.createView(),
				clearValue: {r: 0.05, g: 0.05, b: 0.1, a: 1.0},
				loadOp: 'clear',
				storeOp: 'store',
				resolveTarget: textureView
			}],
		};

		const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
		passEncoder.setPipeline(this.pipeline);
		passEncoder.setBindGroup(0, this.uniformBindGroup);
		passEncoder.setVertexBuffer(0, this.vertexBuffer);
		passEncoder.setVertexBuffer(1, this.vertexToMatrixBuffer);
		passEncoder.setVertexBuffer(2, this.colorBuffer);
		passEncoder.draw(this.vertexCount);
		passEncoder.end();

		device.queue.submit([commandEncoder.finish()]);
	}

	add(node: Line) {
		this.lines.push(node);
		this.linesNeedUpdate = true;
	}

	remove(id: number) {
		const i = this.lines.findIndex(c => c.id === id);
		if (i === -1) {
			return;
		}
		this.lines.splice(i, 1);
		this.linesNeedUpdate = true;
	}
}
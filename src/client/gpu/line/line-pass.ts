import {Line} from "../../../shared/node/2D/line";
import {context, device, GPU} from "../gpu";
import {Mat3, Mat4, mat4} from "wgpu-matrix";
import vertexShader from "./line.vertex.wgsl" with { type: "text" };
import fragmentShader from "./line.fragment.wgsl" with { type: "text" };

export class LinePass {

	lines: Line[] = []
	linesNeedUpdate: boolean = true

	vertexBuffer: GPUBuffer
	matrixBuffer: GPUBuffer
	cameraUniformBuffer: GPUBuffer
	vertexToMatrixBuffer: GPUBuffer

	uniformBindGroup: GPUBindGroup;

	pipeline: GPURenderPipeline
	vertexCount: number
	


	update(camera: Mat4) {
		if (this.linesNeedUpdate) {
			this.updateBuffers(camera, true);
			this.linesNeedUpdate = false;
		} else {
			this.updateBuffers(camera);
		}




		this.render();
	}

	init() {
		this.pipeline = device.createRenderPipeline({
			label: 'Line List Render Pipeline',
			layout: 'auto',
			vertex: {
				//entryPoint: 'main',
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
				}]
			},
			fragment: {
				//entryPoint: 'main',
				module: device.createShaderModule({
					label: 'Line List Fragment Shader',
					code: fragmentShader,
				}),
				targets: [{
					format: navigator.gpu.getPreferredCanvasFormat()
				}]
			},
			primitive: {
				topology: 'line-list'
			}
		});


	}

	updateBuffers(camera: Mat4, fullUpdate?: boolean) {
		this.vertexCount = 0;
		for (const line of this.lines) {
			this.vertexCount += line.vertices.length / 2;
		}

		const vertices = new Float32Array(this.vertexCount * 2)
		const matrices = new Float32Array(16 * this.lines.length);
		const vertexToObjectID = new Uint32Array(this.vertexCount);
		let vOffset = 0;
		let mOffset = 0;
		let i = 0;
		for (const line of this.lines) {
			matrices.set(line.getGlobalTransform(), mOffset);

			if (fullUpdate) {
				vertices.set(line.vertices, vOffset);
				vertexToObjectID.fill(i, vOffset /2, vOffset /2 + line.vertices.length /2);
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
					label: 'Vertex Buffer for Line Strip',
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
		}


		let recreateUniform = false;
		if (!this.cameraUniformBuffer) {
			this.cameraUniformBuffer = device.createBuffer({
				size: 16 * Float32Array.BYTES_PER_ELEMENT,
				usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
			});
			recreateUniform = true;
		}
		device.queue.writeBuffer(this.cameraUniformBuffer, 0, camera);

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

		passEncoder.setPipeline(this.pipeline);
		passEncoder.setBindGroup(0, this.uniformBindGroup);
		passEncoder.setVertexBuffer(0, this.vertexBuffer);
		passEncoder.setVertexBuffer(1, this.vertexToMatrixBuffer);
		passEncoder.draw(this.vertexCount);
		passEncoder.end();

		device.queue.submit([commandEncoder.finish()]);


		// vertices [1,0.5,1,0]
		// ptr to matrix [0,0,0,1,1,1,2,2,2,2,2]

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

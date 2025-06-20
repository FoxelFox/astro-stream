import {EventSystem, Topic} from "../../../shared/event-system";
import {inject} from "../../../shared/injector";
import {context, device} from "../gpu";

import shader from "./particle.wgsl" with {type: "text"};
import {Camera} from "../camera";
import {mat4} from "wgpu-matrix";
import {quad} from "./quad";

export class Particle {

	/*
	particleInstanceByteSize =
		3 * 4 + // position
		1 * 4 + // lifetime
		4 * 4 + // color
		3 * 4 + // velocity
		1 * 4 + // padding
		0;
	*/
	particleInstanceByteSize =
		2 * 4 + // position
		2 * 4 + // velocity
		0;

	numParticles = 1024 * 10;
	computePipeline: GPUComputePipeline
	pipeline: GPURenderPipeline
	particleBindGroups: GPUBindGroup[]
	particleBuffers: GPUBuffer[]
	uniformBindGroup: GPUBindGroup;
	cameraUniformBuffer: GPUBuffer
	quad: GPUBuffer
	t = 0;
	rollingOffset = 0;

	constructor() {
		const eventSystem = inject(EventSystem);
		eventSystem.listen(Topic.Update, data => {

			if (!data.collisions.length) {
				return;
			}

			const buffer = new Float32Array(data.collisions.length * this.particleInstanceByteSize * 10);
			let offset = 0;
			for (const collision of data.collisions) {
				for (let i = 0; i < 10; i++) {
					const instance = [
						collision.x,
						collision.y,
						Math.random() - 0.5,
						Math.random() - 0.5
					];
					buffer.set(instance, offset);
					offset += instance.length;
				}
			}

			this.rollingOffset += buffer.byteLength;

			if (this.rollingOffset + buffer.byteLength > this.particleBuffers[0].size ) {
				this.rollingOffset = 0;
			}

			device.queue.writeBuffer(this.particleBuffers[this.t % 2], this.rollingOffset, buffer);
		});

	}

	init() {

		this.quad = quad(0.1);

		this.computePipeline = device.createComputePipeline({
			label: 'Particle Compute Pipeline',
			layout: 'auto',
			compute: {
				module: device.createShaderModule({
					code: shader
				}),
				entryPoint: 'compute_main',
			}
		});

		this.pipeline = device.createRenderPipeline({
			label: 'Particle Render Pipeline',
			layout: 'auto',
			vertex: {
				module: device.createShaderModule({
					code: shader
				}),
				entryPoint: 'vertex_main',
				buffers: [{
					// particle quad
					arrayStride: 2 * 4,
					attributes: [{
						shaderLocation: 0,
						format: "float32x2",
						offset: 0
					}]
				}, {
					arrayStride: 4 * 4,
					stepMode: "instance",
					attributes: [{
						// position
						shaderLocation: 1,
						offset: 0,
						format: "float32x2"
					}, {
						// velocity
						shaderLocation: 2,
						offset: 2 * 4,
						format: "float32x2"
					}]
				}]
			},
			fragment: {
				module: device.createShaderModule({
					code: shader
				}),
				entryPoint: 'fragment_main',
				targets: [{
					format: navigator.gpu.getPreferredCanvasFormat(),

				}],
			},
			primitive: {
				topology: "triangle-list"
			},
			multisample: {
				count: 4,
			}
		})

		this.particleBuffers = new Array(2);
		this.particleBindGroups = new Array(2);

		for (let i = 0; i < 2; ++i) {
			this.particleBuffers[i] = device.createBuffer({
				size: this.numParticles * this.particleInstanceByteSize,
				usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
			});
		}

		for (let i = 0; i < 2; ++i) {
			this.particleBindGroups[i] = device.createBindGroup({
				layout: this.computePipeline.getBindGroupLayout(0),
				entries: [{
					binding: 0,
					resource: {
						buffer: this.particleBuffers[i],
						offset: 0,
						size: this.particleInstanceByteSize * this.numParticles,
					},
				}, {
					binding: 1,
					resource: {
						buffer: this.particleBuffers[(i + 1) % 2],
						offset: 0,
						size: this.particleInstanceByteSize * this.numParticles,
					},
				}],
			});
		}
	}

	updateUniforms(camera: Camera) {
		const vp = new Float32Array(32);
		let recreateUniform = false;
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

		if (recreateUniform) {
			this.uniformBindGroup = device.createBindGroup({
				layout: this.pipeline.getBindGroupLayout(1),
				entries: [{
					binding: 0,
					resource: {buffer: this.cameraUniformBuffer}
				}]
			});
		}
	}

	render(camera: Camera) {
		this.updateUniforms(camera);

		const textureView = context.getCurrentTexture().createView();

		const renderPassDescriptor: GPURenderPassDescriptor = {
			colorAttachments: [{
				view: camera.multisampleTexture.createView(),
				loadOp: 'load',
				storeOp: 'store',
				resolveTarget: textureView
			}],
		};

		const commandEncoder = device.createCommandEncoder();
		{
			const passEncoder = commandEncoder.beginComputePass();
			passEncoder.setPipeline(this.computePipeline);
			passEncoder.setBindGroup(0, this.particleBindGroups[this.t % 2]);
			passEncoder.dispatchWorkgroups(Math.ceil(this.numParticles / 64));
			passEncoder.end();
		}

		{
			const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
			passEncoder.setPipeline(this.pipeline);
			passEncoder.setBindGroup(1, this.uniformBindGroup);
			passEncoder.setVertexBuffer(0, this.quad);
			passEncoder.setVertexBuffer(1, this.particleBuffers[(this.t + 1) % 2]);
			passEncoder.draw(6, this.numParticles, 0, 0);
			passEncoder.end()
		}

		this.t++;
		device.queue.submit([commandEncoder.finish()]);
	}
}
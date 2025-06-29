import {EventSystem, Topic} from "../../../shared/event-system";
import {inject} from "../../../shared/injector";
import {context, device} from "../gpu";

import shader from "./particle.wgsl" with {type: "text"};
import compute from "./compute.wgsl" with {type: "text"};
import {Camera} from "../camera";
import {mat4} from "wgpu-matrix";
import {quad} from "./quad";
import {gameContext} from "../../main";
import {Player} from "../../../shared/astro/player";
import {Item} from "../../../shared/astro/item";
import {Bullet} from "../../../shared/astro/bullet";

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
		4 * 4 + // color
		0;

	numParticles = 1024 * 16;
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

			let instances = []

			const bullets = gameContext.game.getChildren(Bullet);
			for (let bullet of bullets) {

				instances = instances.concat([
					// position
					mat4.getTranslation(bullet.transform)[0],
					mat4.getTranslation(bullet.transform)[1],

					// velocity
					(Math.random() - 0.5) * 0.1,
					(Math.random() - 0.5) * 0.1,

					// color
					bullet.color[0],
					bullet.color[1],
					bullet.color[2],

					// live time and alpha
					1.0
				])

			}


			const items = gameContext.game.getChildren(Item);
			for (let item of items) {
				instances = instances.concat([
					// position
					mat4.getTranslation(item.transform)[0],
					mat4.getTranslation(item.transform)[1],

					// velocity
					(Math.random() - 0.5) * 0.1,
					(Math.random() - 0.5) * 0.1,

					// color
					item.color[0],
					item.color[1],
					item.color[2],

					// live time and alpha
					1.0
				])
			}

			const players = gameContext.game.getChildren(Player);

			for (let player of players) {
				const damageParticles = Math.round( Math.random() * 2 * (1 - (player.health/ player.maxHealth)));

				for (let i = 0; i < damageParticles; i++) {
					instances = instances.concat([
						// position
						mat4.getTranslation(player.transform)[0],
						mat4.getTranslation(player.transform)[1],

						// velocity
						(Math.random() - 0.5) * 0.5,
						(Math.random() - 0.5) * 0.5,

						// color
						1.0 + (Math.random() - 0.5) * 0.5, // r
						0.2 + (Math.random() - 0.5) * 0.5, // g
						0.1 + (Math.random() - 0.5) * 0.5, // b

						// live time and alpha
						2.0
					])
				}
			}

			for (const collision of data.collisions) {
				for (let i = 0; i < 10; i++) {
					instances = instances.concat([
						// position
						collision.x,
						collision.y,

						// velocity
						(Math.random() - 0.5) * collision.f * 25,
						(Math.random() - 0.5) * collision.f * 25,

						// color
						1.0 + (Math.random() - 0.5) * 0.75, // r
						0.8 + (Math.random() - 0.5) * 0.75, // g
						0.4 + (Math.random() - 0.5) * 0.75, // b

						// live time and alpha
						2.0
					]);
				}
			}


			if (instances.length) {
				const buffer = new Float32Array(instances);



				if (this.rollingOffset + buffer.byteLength > this.particleBuffers[0].size ) {
					this.rollingOffset = 0;
					console.log('overdraw');
				}

				device.queue.writeBuffer(this.particleBuffers[this.t % 2], this.rollingOffset, buffer);
				this.rollingOffset += buffer.byteLength;

			}
		});

	}

	init() {

		this.quad = quad(0.25);

		this.computePipeline = device.createComputePipeline({
			label: 'Particle Compute Pipeline',
			layout: 'auto',
			compute: {
				module: device.createShaderModule({
					code: compute
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
					arrayStride: 8 * 4,
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
					}, {
						// color
						shaderLocation: 3,
						offset: 4 * 4,
						format: "float32x4"
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
					},
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
				label: 'Compute bind group particles',
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
				label: 'Camera Uniform',
				layout: this.pipeline.getBindGroupLayout(0),
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
		this.t++;
		{
			const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
			passEncoder.setPipeline(this.pipeline);
			passEncoder.setBindGroup(0, this.uniformBindGroup);
			passEncoder.setVertexBuffer(0, this.quad);
			passEncoder.setVertexBuffer(1, this.particleBuffers[this.t % 2]);
			passEncoder.draw(6, this.numParticles, 0, 0);
			passEncoder.end()
		}


		device.queue.submit([commandEncoder.finish()]);
	}
}
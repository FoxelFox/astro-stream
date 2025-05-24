import {Node2D} from "./node-2d";
import {Mat4, mat4} from "wgpu-matrix";
import {inject} from "../../injector";
import {EventSystem, Topic} from "../../event-system";
import {canvas, context, device} from "../../../client/gpu/gpu";


export class Camera extends Node2D {
	cam: Mat4 = mat4.ortho(-64, 64, -64, 64, 0,1);


	eventSystem = inject(EventSystem);
	multisampleTexture: GPUTexture;

	constructor() {
		super();

		this.eventSystem.listen(Topic.CanvasResize, params => {
			this.createMatrix(params);
		});

		this.createMatrix({
			width: canvas.width,
			height: canvas.height
		});
	}

	createMatrix(params: {width: number, height: number}) {
		const ar = params.width / params.height;
		const z = 64;
		this.cam = mat4.ortho(-ar * z, +ar * z, -1 * z, 1 * z, 0, 1);

		const canvasTexture = context.getCurrentTexture();

		if (!this.multisampleTexture ||
			this.multisampleTexture.width !== canvasTexture.width ||
			this.multisampleTexture.height !== canvasTexture.height) {

			// If we have an existing multisample texture destroy it.
			if (this.multisampleTexture) {
				this.multisampleTexture.destroy();
			}

			// Create a new multisample texture that matches our
			// canvas's size
			this.multisampleTexture = device.createTexture({
				format: canvasTexture.format,
				usage: GPUTextureUsage.RENDER_ATTACHMENT,
				size: [canvasTexture.width, canvasTexture.height],
				sampleCount: 4,
			});

			console.log(canvasTexture.width);
		}
	}
}
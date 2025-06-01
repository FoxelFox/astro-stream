import {Mat4, mat4} from "wgpu-matrix";
import {inject} from "../../shared/injector";
import {EventSystem, Topic} from "../../shared/event-system";
import {canvas, context, device} from "./gpu";
import {Node2D} from "../../shared/node/2D/node-2d";
import {Math} from "planck";


export class Camera {
	projection: Mat4 = mat4.ortho(-64, 64, -64, 64, 0,1);
	view: Mat4 = mat4.identity();


	eventSystem = inject(EventSystem);
	multisampleTexture: GPUTexture;

	constructor(public target: Node2D) {

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
		this.projection = mat4.ortho(-ar * z, +ar * z, -1 * z, 1 * z, 0, 1);

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
		}
	}

	getViewProjection(): Float32Array {
		if (this.target) {

			const target = mat4.setTranslation(mat4.identity(), mat4.getTranslation(this.target.transform));
			return mat4.multiply(this.projection, mat4.inverse(target));
		} else {
			return this.projection;
		}

	}
}
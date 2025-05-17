import {Node2D} from "./node-2d";
import {Mat4, mat4} from "wgpu-matrix";
import {inject} from "../../injector";
import {EventSystem, Topic} from "../../event-system";
import {canvas} from "../../../client/gpu/gpu";


export class Camera extends Node2D {
	cam: Mat4 = mat4.ortho(-8, 8, -8, 8, 0,1);


	eventSystem = inject(EventSystem);

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
		const z = 8;
		this.cam = mat4.ortho(-ar * z, +ar * z, -1 * z, 1 * z, 0, 1);
	}
}
import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {Control} from "../control";
import {Topic} from "../event-system";
import {mat3, vec2} from "wgpu-matrix";
import {isServer} from "./astro";


export class Player extends Node2D {

	keys: Control = {}

	constructor(public userid: string) {
		super();
		const w = 0.75;
		const h = 1;
		const polys = new Line(
			new Float32Array([
				0.0, h,
				w, -h,
				w, -h,
				-w, -h,
				-w, -h,
				0.0, h,
			]),
			new Float32Array([1.0,1.0,1.0,1.0])
		)
		this.addChild(polys);


		this.eventSystem.listen(Topic.PlayerControlEvent, data => {
			if (data.userid === this.userid) {
				this.keys = data.control;
			}
		});
	}

	update() {
		super.update();
		if (isServer) {
			if (this.keys.forward) {
				this.transform = mat3.translate(this.transform, vec2.fromValues(1,0));
			}
		}
	}

}
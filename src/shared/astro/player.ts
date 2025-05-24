import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {Control} from "../control";
import {Topic} from "../event-system";
import {mat3, mat4, vec2, vec3} from "wgpu-matrix";
import {Astro, isServer} from "./astro";


export class Player extends Node2D {

	keys: Control = {}
	userid: string

	constructor() {
		super();
		const w = 0.75;
		const h = 1;
		const polys = new Line();
		polys.vertices = new Float32Array([
			0.0, h,
			w, -h,
			w, -h,
			-w, -h,
			-w, -h,
			0.0, h,
		]);
		polys.color = new Float32Array([1.0,1.0,1.0,1.0]);

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
				this.transform = mat4.translate(this.transform, vec3.fromValues(0,1,0));
			}

			if (this.keys.backward) {
				this.transform = mat4.translate(this.transform, vec3.fromValues(0,-1,0));
			}

			if (this.keys.right) {
				this.transform = mat4.translate(this.transform, vec3.fromValues(1,0,0));
			}

			if (this.keys.left) {
				this.transform = mat4.translate(this.transform, vec3.fromValues(-1,0,0));
			}
		}
	}

	serialize(): any {
		const o = super.serialize();
		o.userid = this.userid;
		return o;
	}



}
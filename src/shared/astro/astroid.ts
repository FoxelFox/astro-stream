import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {mat4, vec3} from "wgpu-matrix";
import {isServer, world} from "./astro";
import {Body, Math, Polygon} from "planck";

export class Astroid extends Line {

	body: Body

	constructor() {
		super();

		if (isServer) {

			const w = Math.random() * 5 + 0.1;
			const h = Math.random() * 5 + 0.1;

			this.vertices = new Float32Array([
				0.0, h,
				w, -h,
				w, -h,
				-w, -h,
				-w, -h,
				0.0, h,
			]);

			this.body = world.createBody({
				type: "dynamic",
				position: {
					x: (Math.random() - 0.5) * 80,
					y: (Math.random() - 0.5) * 80
				},
				allowSleep: false
			});

			this.body.createFixture({
				density: 2,
				restitution: 0.6,
				shape: new Polygon([
					{x: 0.0, y: h},
					{x: -w, y: -h},
					{x: w, y: -h}
				])
			})

			this.color = new Float32Array([1.0, 1.0, 1.0, 1.0]);
		}
	}

	update() {
		super.update();
		if (isServer) {
			this.transform = mat4.setTranslation(this.transform, vec3.fromValues(this.body.getTransform().p.x, this.body.getTransform().p.y))
			const a = this.body.getAngle()

			// (mat4.rotate?)
			this.transform[0] = Math.cos(-a);
			this.transform[1] = -Math.sin(-a);
			this.transform[4] = Math.sin(-a);
			this.transform[5] = Math.cos(-a);
		}
	}

	destroy() {
		super.destroy();
		world.queueUpdate(() => {
			world.destroyBody(this.body);
		})
	}
}
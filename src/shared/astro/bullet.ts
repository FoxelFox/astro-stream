import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {mat4, vec3} from "wgpu-matrix";
import {isServer, world} from "./astro";
import {Body, Math, Polygon} from "planck";


export class Bullet extends Node2D {

	body: Body

	constructor() {
		super();

		const w = 0.5;
		const h = 0.5;
		const polys = new Line();
		polys.vertices = new Float32Array([
			0.0, h,
			w, -h,
			w, -h,
			-w, -h,
			-w, -h,
			0.0, h,
		]);

		if (isServer) {
			this.body = world.createBody({
				type: "dynamic",
				position: {
					x: 0 ,
					y: 0
				},
				allowSleep: false
			});

			const fixture = this.body.createFixture({
				density: 0.1,
				restitution: 0.1,
				shape: new Polygon([
					{x: 0.0, y: h},
					{x: -w,y: -h},
					{x: w, y: -h}
				])
			})

			this.body.setBullet(true);

			this.body.setUserData(this);
		}

		polys.color = new Float32Array([1.0,0.0,0.0,1.0]);

		this.addChild(polys);
	}

	update() {
		super.update();
		if (isServer) {
			this.transform = mat4.setTranslation(this.transform, vec3.fromValues(this.body.getTransform().p.x ,this.body.getTransform().p.y))
			const a = this.body.getAngle()

			this.transform[0] =  Math.cos(-a);
			this.transform[1] = -Math.sin(-a);
			this.transform[4] =  Math.sin(-a);
			this.transform[5] =  Math.cos(-a);
		}
	}

	destroy() {
		super.destroy();
		world.destroyBody(this.body);
	}


}
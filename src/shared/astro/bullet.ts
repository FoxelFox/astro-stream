import {Line} from "../node/2D/line";
import {isServer, world} from "./astro";
import {Body, Polygon} from "planck";


export class Bullet extends Line {

	body: Body
	damageMultiplier = 5;

	constructor() {
		super();

		const w = 0.5;
		const h = 0.5;

		this.vertices = new Float32Array([
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
					x: 0,
					y: 0
				},
				allowSleep: false
			});

			this.body.createFixture({
				density: 1,
				restitution: 0.0,
				shape: new Polygon([
					{x: 0.0, y: h},
					{x: -w, y: -h},
					{x: w, y: -h}
				])
			})

			this.body.setBullet(true);

			this.body.setUserData(this);
		}

		this.color = new Float32Array([1.0, 0.0, 0.0, 1.0]);
	}

	update() {
		super.update();
		if (isServer) {
			this.applyTransform(this.body.getTransform().p, this.body.getAngle());
		}
	}

	destroy() {
		super.destroy();
		world.queueUpdate(() => {
			world.destroyBody(this.body);
		});
	}
}
import {Line} from "../node/2D/line";
import {isServer, world} from "./astro";
import {Body, Math, Polygon} from "planck";
import {Player} from "./player";


export class Item extends Line {

	body: Body
	lastUser: Player;
	damageMultiplier = 0;

	constructor(
		x: number = (Math.random() - 0.5) * 350,
		y: number = (Math.random() - 0.5) * 350
	) {
		super();

		const w = 0.5;
		const h = 0.5;

		this.vertices = new Float32Array([
			w, h,
			w, -h,
			w, -h,
			-w, -h,
			-w, -h,
			-w, h,
			-w, h,
			w, h
		]);

		if (isServer) {
			this.body = world.createBody({
				type: "dynamic",
				position: {
					x,
					y
				}
			});

			this.body.createFixture({
				density: 0.1,
				restitution: 0.0,
				shape: new Polygon([
					{x: w, y: h},
					{x: w, y: -h},
					{x: -w, y: -h},
					{x: -w, y: h}
				])
			})


			this.body.setUserData(this);
		}

		this.color = new Float32Array([0.3, 1.0, 0.1, 1.0]);
	}

	update() {
		super.update();
		if (isServer) {
			if (this.lastUser) {
				this.lastUser.heal(25);
				this.destroy();
			}
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
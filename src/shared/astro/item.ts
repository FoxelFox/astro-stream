import {Line} from "../node/2D/line";
import {isServer, world} from "./astro";
import {Body, Math, Polygon} from "planck";
import {Player} from "./player";
import {Poly} from "../node/2D/poly";


export class Item extends Poly {

	body: Body
	lastUser: Player;
	damageMultiplier = 0;
	lifetime: number = 60 * 60;

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
			-w, -h,
			-w, -h,
			-w, h,
			w, h
		]);

		if (isServer) {
			this.body = world.createBody({
				type: "dynamic",
				linearDamping: 0.001,
				position: {
					x,
					y
				}
			});

			this.body.createFixture({
				density: 0.1,
				restitution: 0.1,
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
				this.lastUser.heal(10);
				this.lastUser.xp += 10;
				return this.destroy();
			}

			const pos = this.body.getPosition();
			if (Math.abs(pos.x) > 200 || Math.abs(pos.y) > 200) {
				return this.destroy();
			}

			this.lifetime--;

			if (this.lifetime <= 0) {
				return this.destroy();
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
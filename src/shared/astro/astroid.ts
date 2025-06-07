import {Line} from "../node/2D/line";
import {isServer, world} from "./astro";
import {Body, Math, Polygon, Vec2} from "planck";
import {Topic} from "../event-system";

export class Astroid extends Line {

	body: Body
	health: number;


	constructor(
		public level: number = 3,
		x: number = (Math.random() - 0.5) * 350,
		y: number = (Math.random() - 0.5) * 350
	) {
		super();
		this.health = 10 * this.level;

		if (isServer) {

			const w =  this.level;
			const h = this.level;

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
					x,
					y
				},
				angle: Math.PI * Math.random(),
				allowSleep: false
			});

			this.body.createFixture({
				density: 1,
				restitution: 0.6,
				shape: new Polygon([
					{x: 0.0, y: h},
					{x: -w, y: -h},
					{x: w, y: -h}
				])
			})

			this.body.setUserData(this);

			switch (this.level) {
				case 1: this.color = new Float32Array([1.0, 0.0, 1.0, 1.0]); break;
				case 2: this.color = new Float32Array([1.0, 1.0, 0.0, 1.0]); break;
				case 3: this.color = new Float32Array([0.0, 1.0, 1.0, 1.0]); break;
			}

		}
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
		})
	}

	takeHit(damage: number) {
		world.queueUpdate(() => {

			this.health -= damage;

			if (this.health <= 0) {
				if (isServer && this.level > 1) {
					for (let i = 0; i < this.level; i++) {

						const newAstro = new Astroid(
							this.level - 1,
							this.body.getPosition().x + (Math.random() - 0.5) * 10,
							this.body.getPosition().y + (Math.random() - 0.5) * 10
						)

						newAstro.body.setLinearVelocity(this.body.getLinearVelocity().clone());
						newAstro.body.setAngularVelocity((Math.random() - 0.5) * 0.01);

						this.parent.addChild(newAstro);
						this.eventSystem.publish(Topic.AstroidSpawn, {id: newAstro.id, json: newAstro.serialize()})
					}
				}
				world.destroyBody(this.body);
				this.destroy();
			}
		});

	}
}
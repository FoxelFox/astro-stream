import {Line} from "../node/2D/line";
import {isServer, world} from "./astro";
import {Body, Math, Polygon} from "planck";
import {Topic} from "../event-system";
import {Item} from "./item";

export class Astroid extends Line {

	body: Body
	health: number;
	damageMultiplier = 1;

	constructor(
		public level: number = 3,
		x: number = (Math.random() - 0.5) * 350,
		y: number = (Math.random() - 0.5) * 350
	) {
		super();
		this.health = 50 * this.level;

		if (isServer) {

			const w = this.level *2;
			const h = this.level *2;

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


			this.color = new Float32Array([1.0, 1.0, 1.0, 1.0]);
		}
	}

	update() {
		super.update();
		if (isServer) {
			this.applyTransform(this.body.getTransform().p, this.body.getAngle());

			const pos = this.body.getPosition();
			if (Math.abs(pos.x) > 200 || Math.abs(pos.y) > 200) {
				this.health = 0;
			}

			if (this.health <= 0) {
				if (isServer && this.level > 1) {
					for (let i = 0; i < 3; i++) {

						const newAstro = new Astroid(
							this.level - 1,
							this.body.getPosition().x + (Math.random() - 0.5) * 4 * this.level,
							this.body.getPosition().y + (Math.random() - 0.5) * 4 * this.level
						)

						newAstro.body.setLinearVelocity(this.body.getLinearVelocity().clone());
						newAstro.body.setAngularVelocity(this.body.getAngularVelocity() + (Math.random() -0.5) * 0.005);
						newAstro.applyTransform(newAstro.body.getPosition(), this.body.getAngle());

						this.parent.addChild(newAstro);
						this.eventSystem.publish(Topic.AstroidSpawn, {id: newAstro.id, json: newAstro.serialize()})
					}
				}
				world.destroyBody(this.body);
				this.destroy();
			}
		}
	}

	destroy() {
		super.destroy();

		if (this.level === 1) {
			const item = new Item(
				this.body.getPosition().x,
				this.body.getPosition().y
			)

			item.body.setLinearVelocity(this.body.getLinearVelocity().clone().mul(0.25));
			item.body.setAngularVelocity(this.body.getAngularVelocity() + (Math.random() -0.5) * 0.005);
			item.applyTransform(item.body.getPosition(), this.body.getAngle());

			this.parent.addChild(item);
			this.eventSystem.publish(Topic.ItemSpawn, {id: item.id, json: item.serialize()})

			world.queueUpdate(() => {
				world.destroyBody(this.body);
			})
		}
	}

	takeHit(damage: number) {
		this.health -= damage;
	}
}
import {Line} from "../node/2D/line";
import {Control} from "../control";
import {Topic} from "../event-system";
import {mat4, vec2} from "wgpu-matrix";
import {isServer, world} from "./astro";
import {Body, Math, Polygon, Vec2} from "planck";
import {Bullet} from "./bullet";
import {Node} from "../node/node";
import {Item} from "./item";
import {Poly} from "../node/2D/poly";


export class Player extends Poly {

	keys: Control = {}
	userid: string
	body: Body
	speed: number
	actionFlipFlop = false;
	cooldown = 60;
	health = 100;
	xp = 0;
	force = 0.00015;


	constructor() {
		super();
		const w = 0.75;
		const h = 1;

		this.vertices = new Float32Array([
			0.0, h,
			-w, -h,
			w, -h,
		]);

		if (isServer) {
			this.body = world.createBody({
				type: "dynamic",
				position: {x: 0, y: 0},
				allowSleep: false,
				angularDamping: 0.01,
				linearDamping: 0.002
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
		}

		this.eventSystem.listen(Topic.PlayerControlEvent, data => {
			if (data.userid === this.userid) {
				this.keys = data.control;
			}
		});
	}

	update() {
		super.update();
		if (isServer) {
			this.applyTransform(this.body.getTransform().p, this.body.getAngle());

			if (this.keys.forward) {
				const rad = this.body.getAngle();
				const cosTheta = Math.cos(rad)
				const sinTheta = Math.sin(rad)

				this.body.applyForceToCenter({x: -this.force * sinTheta, y: this.force * cosTheta}, true);
			}

			if (this.keys.backward) {

			}

			const actual = this.body.getAngle();
			const target = this.keys.rotation;

			const shortestAngle = (Math.atan2(Math.sin(target - actual), Math.cos(target - actual)));


			if (this.keys.rotation !== undefined) {

				this.body.applyTorque(0.00005 * shortestAngle, true);
			}


			this.body.setAngle(this.body.getAngle());

			if (this.keys.action && this.actionFlipFlop) {
				this.actionFlipFlop = false;
				if (60 / this.level < this.cooldown) {
					this.cooldown = 0;
				}
			}

			if (this.keys.action && this.cooldown === 0) {
				if (this.cooldown >= (60 / this.level)) {
					this.cooldown = 0;
				}
				const bullet = new Bullet();
				bullet.transform = mat4.copy(this.transform);

				// TODO fix this (mat4.rotate?)
				const a = this.body.getAngle()
				bullet.transform[0] = Math.cos(-a);
				bullet.transform[1] = -Math.sin(-a);
				bullet.transform[4] = Math.sin(-a);
				bullet.transform[5] = Math.cos(-a);

				const rad = this.body.getAngle();
				const cosTheta = Math.cos(rad)
				const sinTheta = Math.sin(rad)

				const spawn = this.body.getPosition().clone();
				spawn.x -= sinTheta * 3;
				spawn.y += cosTheta * 3;
				bullet.body.setPosition(spawn);
				bullet.body.setLinearVelocity(this.body.getLinearVelocity().clone());
				bullet.body.applyLinearImpulse({x: -sinTheta, y: cosTheta}, bullet.body.getPosition(), true);

				this.eventSystem.publish(Topic.BulletSpawn, {id: bullet.id, transform: Array.from(bullet.transform)});

				this.parent.addChild(bullet);
			} else if (!this.keys.action) {
				this.actionFlipFlop = true;
				//this.cooldown = 0;
			}


			this.cooldown++

			if (this.keys.action) {
				if (this.cooldown >= (60 / this.level) || this.cooldown < 0) {
					this.cooldown = 0;
				}
			}


			this.speed = Vec2.lengthOf(this.body.getLinearVelocity());
		}
	}

	isCoolDown() {
		console.log(60 / this.level)
		return (60 / this.level) === this.cooldown;
	}

	serialize(): any {
		const o = super.serialize();
		o.userid = this.userid;
		o.velocity = this.speed;
		return o;
	}

	deserialize(json: any): Node {
		const o = super.deserialize(json) as Player;
		o.userid = json.userid;
		o.speed = json.velocity;
		return o;
	}

	destroy() {
		super.destroy();
		world.queueUpdate(() => {
			world.destroyBody(this.body);
		});
	}

	takeHit(damage: number) {
		this.health -= damage;
		if (this.health <= 0) {
			world.queueUpdate(() => {

				for (let i = 0; i < this.level; ++i) {

					// TODO Duplicate Code
					const item = new Item(
						this.body.getPosition().x + (Math.random() -0.5) * 10,
						this.body.getPosition().y + (Math.random() -0.5) * 10
					)

					item.body.setLinearVelocity(this.body.getLinearVelocity().clone().mul(0.025));
					item.body.setAngularVelocity(this.body.getAngularVelocity() + (Math.random() -0.5) * 0.0005);
					item.applyTransform(item.body.getPosition(), this.body.getAngle());

					this.parent.addChild(item);
					this.eventSystem.publish(Topic.ItemSpawn, {id: item.id, json: item.serialize()})
				}


				this.body.setPosition({x: 0, y: 0});
				this.health = 100;
				this.xp = 0;
				this.body.setAngularVelocity(0);
				this.body.setLinearVelocity({x: 0, y: 0});
			})
		}
	}

	heal(hp: number) {
		this.health = Math.min(this.health + hp, this.maxHealth);
	}

	get level(): number {
		return Math.floor(Math.pow(this.xp / 100, 2 / 3)) + 1;
	}

	private getXpForLevel(level: number): number {
		return Math.ceil(100 * Math.pow(level - 1, 1.5));
	}

	getCurrentLevelXpRange(): { current: number; start: number; end: number } {
		const startXP = this.getXpForLevel(this.level);
		const endXP = this.getXpForLevel(this.level + 1);

		return {
			current: this.xp,
			start: startXP,
			end: endXP,
		};
	}

	get maxHealth() {
		return 100 + (this.level - 1) * 25;
	}

	setColor(userid: number) {
		const palate = [
			[1.000, 0.250, 0.500, 1.0],
			[0.250, 1.000, 0.500, 1.0],
			[1.000, 1.000, 0.250, 1.0],
			[0.750, 1.000, 1.000, 1.0],
			[0.750, 0.250, 1.000, 1.0],
			[0.250, 1.000, 0.250, 1.0],
			[1.000, 0.500, 0.000, 1.0],
			[0.020, 1.000, 1.000, 1.0],
			[1.000, 0.000, 1.000, 1.0],
			[0.500, 1.000, 0.000, 1.0],
			[0.500, 1.000, 1.000, 1.0],
			[1.000, 0.750, 0.000, 1.0],
			[0.750, 0.000, 1.000, 1.0],
			[0.000, 1.000, 0.750, 1.0],
			[1.000, 0.000, 0.000, 1.0],
			[0.000, 1.000, 0.000, 1.0]
		];


		this.color = new Float32Array(palate.at(userid % 16));
	}
}
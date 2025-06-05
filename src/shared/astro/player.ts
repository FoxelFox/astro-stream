import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {Control} from "../control";
import {Topic} from "../event-system";
import {mat4, vec3} from "wgpu-matrix";
import {isServer, world} from "./astro";
import {Body, Math, Polygon, Vec2} from "planck";
import {Bullet} from "./bullet";
import {Node} from "../node/node";


export class Player extends Line {

	keys: Control = {}
	userid: string
	body: Body
	speed: number

	constructor() {
		super();
		const w = 0.75;
		const h = 1;

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
				position: {x: 0, y: 0},
				allowSleep: false,
				angularDamping: 0.001,
				linearDamping: 0.0005
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
		}
		this.color = new Float32Array([1.0, 1.0, 0.0, 1.0]);


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

			const f = 0.00005;

			if (this.keys.forward) {
				const rad = this.body.getAngle();
				const cosTheta = Math.cos(rad)
				const sinTheta = Math.sin(rad)

				this.body.applyForceToCenter({x: -f * sinTheta, y: f * cosTheta}, true);
			}

			if (this.keys.backward) {

			}

			if (this.keys.right) {
				this.body.applyTorque(-0.000005, true);
			}

			if (this.keys.left) {
				this.body.applyTorque(0.000005, true);
			}

			if (this.keys.action) {
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

				const spawn = this.body.getPosition();
				spawn.x -= sinTheta * 3;
				spawn.y += cosTheta * 3;
				bullet.body.setPosition(this.body.getPosition());
				bullet.body.setLinearVelocity(this.body.getLinearVelocity());
				bullet.body.applyLinearImpulse({x: -sinTheta, y: cosTheta}, bullet.body.getPosition(), true);

				this.eventSystem.publish(Topic.BulletSpawn, {id: bullet.id,transform: bullet.transform});

				this.parent.addChild(bullet);
			}

			this.speed = Vec2.lengthOf(this.body.getLinearVelocity());
		}
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
}
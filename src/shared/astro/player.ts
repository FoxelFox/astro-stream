import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {Control} from "../control";
import {Topic} from "../event-system";
import {mat4, vec2, vec3} from "wgpu-matrix";
import {isServer, world} from "./astro";
import {Body, Math, Polygon, Vec3} from "planck";


export class Player extends Node2D {

	keys: Control = {}
	userid: string

	body: Body

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

		if (isServer) {
			this.body = world.createBody({
				type: "dynamic",
				position: {x: 0, y: 0},
				allowSleep: false,
				angularDamping: 0.001,
				linearDamping: 0.0005
			});

			//this.body.setMassData({mass: 1, center: {x:0,y:0},I: 0})

			this.body.createFixture({
				density: 1,
				shape: new Polygon([
					{x: 0.0, y: h},
					{x: -w,y: -h},
					{x: w, y: -h}
				])
			})
		}

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
			this.transform = mat4.setTranslation(this.transform, vec3.fromValues(this.body.getTransform().p.x ,this.body.getTransform().p.y))
			const a = this.body.getAngle()

			this.transform[0] =  Math.cos(-a);
			this.transform[1] = -Math.sin(-a);
			this.transform[4] =  Math.sin(-a);
			this.transform[5] =  Math.cos(-a);


			console.log(this.body.getAngle())


			const force = {x: 0, y: 0};
			const f = 0.00005;

			if (this.keys.forward) {
				const rad = this.body.getAngle();
				const cosTheta = Math.cos(rad)
				const sinTheta = Math.sin(rad)

				this.body.applyForceToCenter({x:-f*sinTheta, y: f*cosTheta}, true);
			}

			if (this.keys.backward) {

			}

			if (this.keys.right) {
				this.body.applyTorque(-0.00001, true);
			}

			if (this.keys.left) {
				this.body.applyTorque(0.00001, true);
			}

		}
	}

	serialize(): any {
		const o = super.serialize();
		o.userid = this.userid;
		return o;
	}



}
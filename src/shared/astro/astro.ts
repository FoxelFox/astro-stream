import {Node} from "../node/node"
import {Player} from "./player";
import {Topic} from "../event-system";
import {Camera} from "../node/2D/camera";
import {mat4, vec3} from "wgpu-matrix";
import {Edge, World} from "planck";
export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

export let world = new World({
	gravity: {x: 0, y: 0},
});

export class Astro extends Node {
	// Game Scene

	camera: Camera;


	constructor() {
		super();

		if (isClient) {
			this.eventSystem.listen(Topic.ReceiveUserId, data => {
				const myPlayer = this.getChildren(Player).find(p => p.userid == data.userid);
				this.camera = new Camera();
				this.addChild(this.camera)
			});

			this.eventSystem.listen(Topic.Update, data => {
				const players = this.getChildren(Player);
				for (let i = 0; i < players.length; ++i) {
					players[i].transform = new Float32Array(data.players[i]);
				}
			})
		}

		this.eventSystem.listen(Topic.PlayerConnected, userid => {
			console.log("Player Connected", userid);
			const newPlayer = new Player();
			newPlayer.userid = userid
			newPlayer.transform =  mat4.translate(newPlayer.transform, vec3.fromValues(Math.random() * 10 - 5, Math.random() * 10 -5))
			this.addChild(newPlayer);
		});

		this.eventSystem.listen(Topic.PlayerDisconnected, userid => {
			console.log("Player Disconnected", userid);
			this.removeChild(this.getChildren(Player).find(c => c.userid === userid));
		});
	}

	init () {
		let platformBottom = world.createBody({
			type: "static",
			position: {x: 0, y: -50},
			angle: 0
		});

		platformBottom.createFixture({
			shape: new Edge({x: -50, y: 0}, {x: +50, y: 0}),
		});

		let platformTop = world.createBody({
			type: "static",
			position: {x: 0, y: 50},
			angle: 0
		});

		platformTop.createFixture({
			shape: new Edge({x: -50, y: 0}, {x: +50, y: 0}),
		});

		let platformLeft = world.createBody({
			type: "static",
			position: {x: -50, y: 0},
			angle: 0
		});

		platformLeft.createFixture({
			shape: new Edge({x: 0, y: -50}, {x: 0, y: 50}),
		});

		let platformRight = world.createBody({
			type: "static",
			position: {x: 50, y: 0},
			angle: 0
		});

		platformRight.createFixture({
			shape: new Edge({x: 0, y: -50}, {x: 0, y: 50}),
		});
	}

	update() {
		if (isServer) {
			world.step(16);
		}
		super.update();
		if (isClient) {
			// update camera
		}

		if (isServer) {
			const transforms = []
			const players = this.getChildren(Player);
			for (const player of players) {
				transforms.push(Array.from(player.transform));
			}
			this.eventSystem.publish(Topic.Update, {players: transforms});
		}
	}
}
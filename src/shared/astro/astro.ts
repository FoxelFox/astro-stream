import {Node} from "../node/node"
import {Player} from "./player";
import {Topic} from "../event-system";
import {mat4, vec3} from "wgpu-matrix";
import {Edge, Settings, World} from "planck";
import {Astroid} from "./astroid";
import {Bullet} from "./bullet";

export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

export let world = new World({
	gravity: {x: 0, y: 0},
});

//Settings.lengthUnitsPerMeter = 1;
Settings.velocityThreshold = 0;

export class Astro extends Node {


	constructor() {
		super();

		if (isClient) {
			this.eventSystem.listen(Topic.Update, data => {
				// TODO this can be generic
				const players = this.getChildren(Player);
				for (let i = 0; i < players.length; ++i) {
					players[i].transform = new Float32Array(data.players[i]);
				}

				const astroids = this.getChildren(Astroid);
				for (let i = 0; i < astroids.length; ++i) {
					astroids[i].transform = new Float32Array(data.astroids[i]);
				}

				const bullets = this.getChildren(Bullet);
				for (let i = 0; i < bullets.length; ++i) {
					bullets[i].transform = new Float32Array(data.bullets[i]);
				}
			});

			this.eventSystem.listen(Topic.BulletSpawn, data => {
				const bullet = new Bullet();
				bullet.id = data.id;
				bullet.transform = new Float32Array(data.transform);
				this.addChild(bullet);
			});
		}

		this.eventSystem.listen(Topic.NodeDestroy, data => {
			this.removeChildByID(data.id);
		});

		this.eventSystem.listen(Topic.PlayerConnected, userid => {
			console.log("Player Connected", userid);
			const newPlayer = new Player();
			newPlayer.userid = userid
			newPlayer.transform =  mat4.translate(newPlayer.transform, vec3.fromValues(Math.random() * 10 - 5, Math.random() * 10 -5))
			this.addChild(newPlayer);
		});

		this.eventSystem.listen(Topic.PlayerDisconnected, userid => {
			console.log("Player Disconnected", userid);
			const player = this.getChildren(Player).find(c => c.userid === userid);
			this.removeChild(player);
			player.destroy();
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
			shape: new Edge({x: 0, y: -50}, {x: 0, y: 50})
		});

		let platformBottom2 = world.createBody({
			type: "static",
			position: {x: 0, y: -100},
			angle: 0
		});

		platformBottom2.createFixture({
			shape: new Edge({x: -100, y: 0}, {x: +100, y: 0}),
		});

		let platformTop2 = world.createBody({
			type: "static",
			position: {x: 0, y: 100},
			angle: 0
		});

		platformTop2.createFixture({
			shape: new Edge({x: -100, y: 0}, {x: +100, y: 0}),
		});

		let platformLeft2 = world.createBody({
			type: "static",
			position: {x: -100, y: 0},
			angle: 0
		});

		platformLeft2.createFixture({
			shape: new Edge({x: 0, y: -100}, {x: 0, y: 100}),
		});

		let platformRight2 = world.createBody({
			type: "static",
			position: {x: 100, y: 0},
			angle: 0
		});

		platformRight2.createFixture({
			shape: new Edge({x: 0, y: -100}, {x: 0, y: 100})
		});


		this.generateAstroids();

		world.on('begin-contact', contact => {
			const a = contact.getFixtureA().getBody().getUserData();
			const b = contact.getFixtureB().getBody().getUserData();

			if (a instanceof Bullet) {
				a.destroy();
			}
			if (b instanceof Bullet) {
				b.destroy();
			}
		});
	}

	generateAstroids() {
		for (let i = 0; i < 100; ++i) {
			this.addChild(new Astroid());
		}

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
			// TODO This can be generic
			const playerTransforms = []
			const astroidTransforms = []
			const bulletTransforms = []

			const players = this.getChildren(Player);
			const astroids = this.getChildren(Astroid);
			const bullets = this.getChildren(Bullet);

			for (const player of players) {
				playerTransforms.push(Array.from(player.transform));
			}

			for (const astroid of astroids) {
				astroidTransforms.push(Array.from(astroid.transform));
			}

			for (const bullet of bullets) {
				bulletTransforms.push(Array.from(bullet.transform));
			}


			this.eventSystem.publish(Topic.Update, {
				players: playerTransforms,
				astroids: astroidTransforms,
				bullets: bulletTransforms
			});
		}
	}
}
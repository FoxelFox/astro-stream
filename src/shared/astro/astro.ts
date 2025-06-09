import {Node} from "../node/node"
import {Player} from "./player";
import {Topic} from "../event-system";
import {mat4, vec3} from "wgpu-matrix";
import {Edge, Settings, World} from "planck";
import {Astroid} from "./astroid";
import {Bullet} from "./bullet";
import {Update} from "../proto/generated/update";
import {deserialize} from "./deserialize";
import {Line} from "../node/2D/line";

export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

export let world

//Settings.lengthUnitsPerMeter = 1;
Settings.velocityThreshold = 0;
Settings.linearSleepTolerance = 0.001;
Settings.angularSleepTolerance = 0.01;

export class Astro extends Node {


	constructor() {
		super();

		world = new World({
			gravity: {x: 0, y: 0},
		});

		if (isClient) {
			this.eventSystem.listen(Topic.Update, update => {
				const players = this.getChildren(Player);
				for (let i = 0; i < players.length; ++i) {
					players[i].applyTransform(update.players[i].position, update.players[i].rotation);
					players[i].speed = update.players[i].speed;
					players[i].health = update.players[i].health;
				}

				const astroids = this.getChildren(Astroid);
				for (let i = 0; i < astroids.length; ++i) {
					astroids[i].applyTransform(update.astroids[i].position, update.astroids[i].rotation);
				}

				const bullets = this.getChildren(Bullet);
				for (let i = 0; i < bullets.length; ++i) {
					bullets[i].applyTransform(update.bullets[i].position, update.bullets[i].rotation);
				}


			});

			this.eventSystem.listen(Topic.AstroidSpawn, data => {
				const astroid = deserialize(data.json);
				astroid.parent = this;
				this.addChild(astroid);
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
			newPlayer.transform = mat4.translate(newPlayer.transform, vec3.fromValues(Math.random() * 10 - 5, Math.random() * 10 - 5))
			this.addChild(newPlayer);
		});

		this.eventSystem.listen(Topic.PlayerDisconnected, userid => {
			console.log("Player Disconnected", userid);
			const player = this.getChildren(Player).find(c => c.userid === userid);
			this.removeChild(player);
			player.destroy();
		});
	}

	init() {

		const size = 200;

		let platformBottom = world.createBody({
			type: "static",
			position: {x: 0, y: -size},
			angle: 0
		});

		platformBottom.createFixture({
			shape: new Edge({x: -size, y: 0}, {x: +size, y: 0}),
		});

		let platformTop = world.createBody({
			type: "static",
			position: {x: 0, y: size},
			angle: 0
		});

		platformTop.createFixture({
			shape: new Edge({x: -size, y: 0}, {x: +size, y: 0}),
		});

		let platformLeft = world.createBody({
			type: "static",
			position: {x: -size, y: 0},
			angle: 0
		});

		platformLeft.createFixture({
			shape: new Edge({x: 0, y: -size}, {x: 0, y: size}),
		});

		let platformRight = world.createBody({
			type: "static",
			position: {x: size, y: 0},
			angle: 0
		});

		platformRight.createFixture({
			shape: new Edge({x: 0, y: -size}, {x: 0, y: size})
		});

		let platformBottom2 = world.createBody({
			type: "static",
			position: {x: 0, y: -size * 2},
			angle: 0
		});

		platformBottom2.createFixture({
			shape: new Edge({x: -size * 2, y: 0}, {x: +size * 2, y: 0}),
		});

		let platformTop2 = world.createBody({
			type: "static",
			position: {x: 0, y: size * 2},
			angle: 0
		});

		platformTop2.createFixture({
			shape: new Edge({x: -size * 2, y: 0}, {x: +size * 2, y: 0}),
		});

		let platformLeft2 = world.createBody({
			type: "static",
			position: {x: -size * 2, y: 0},
			angle: 0
		});

		platformLeft2.createFixture({
			shape: new Edge({x: 0, y: -size * 2}, {x: 0, y: size * 2}),
		});

		let platformRight2 = world.createBody({
			type: "static",
			position: {x: size * 2, y: 0},
			angle: 0
		});

		platformRight2.createFixture({
			shape: new Edge({x: 0, y: -size * 2}, {x: 0, y: size * 2})
		});


		this.generateAstroids(10);

		world.on('post-solve', (contact, impulse) => {

			const a = contact.getFixtureA().getBody().getUserData() as { damageMultiplier?: number };
			const b = contact.getFixtureB().getBody().getUserData() as { damageMultiplier?: number };

			if (a instanceof Bullet) {
				a.destroy();
			}
			if (b instanceof Bullet) {
				b.destroy();
			}

			if (a instanceof Astroid) {
				a.takeHit(impulse.normalImpulses[0] * 100 * b?.damageMultiplier || 1);
			}

			if (b instanceof Astroid) {
				b.takeHit(impulse.normalImpulses[0] * 100 * a?.damageMultiplier || 1);
			}

			if (a instanceof Player) {
				a.takeHit(impulse.normalImpulses[0] * 100 * b?.damageMultiplier || 1);
			}

			if (b instanceof Player) {
				b.takeHit(impulse.normalImpulses[0] * 100 * a?.damageMultiplier || 1);
			}
		});


		const line = new Line()
		//line.vertices = new Float32Array([300,0, -300,0])
		const vertices = []
		for (let x = -200; x < 204; x += 4) {
			vertices.push(x, -200, x, 200);
		}

		for (let y = -200; y < 204; y += 4) {
			vertices.push(-200, y, 200, y);
		}

		line.vertices = new Float32Array(vertices);
		line.color = new Float32Array([0.3, 0.3, 0.3, 0.3])

		this.addChild(line)
	}

	generateAstroids(size: number) {
		for (let i = 0; i < size * 2; ++i) {
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
			if (this.getChildren(Astroid).length < 50) {
				this.generateAstroids(1);
			}

			const players = this.getChildren(Player);
			const astroids = this.getChildren(Astroid);
			const bullets = this.getChildren(Bullet);

			const update: Update = {
				players: [],
				astroids: [],
				bullets: []
			}

			for (const player of players) {
				update.players.push({
					position: player.body.getPosition(),
					rotation: player.body.getAngle(),
					speed: player.speed,
					health: player.health
				});
			}

			for (const astroid of astroids) {
				update.astroids.push({
					position: astroid.body.getPosition(),
					rotation: astroid.body.getAngle()
				});
			}

			for (const bullet of bullets) {
				update.bullets.push({
					position: bullet.body.getPosition(),
					rotation: bullet.body.getAngle()
				});
			}

			this.eventSystem.publish(Topic.Update, update);
		}
	}

	destroy() {
		super.destroy();
		Node.idCounter = 0;
	}
}
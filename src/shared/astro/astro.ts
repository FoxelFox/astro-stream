import {Node} from "../node/node"
import {Player} from "./player";
import {Topic} from "../event-system";
import {mat4, vec3} from "wgpu-matrix";
import {Contact, Edge, Settings, Vec2, World} from "planck";
import {Astroid} from "./astroid";
import {Bullet} from "./bullet";
import {Collision, Update} from "../proto/generated/update";
import {deserialize} from "./deserialize";
import {Line} from "../node/2D/line";
import {Item} from "./item";

export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

export let world

//Settings.lengthUnitsPerMeter = 1;
Settings.velocityThreshold = 0;
Settings.linearSleepTolerance = 0.001;
Settings.angularSleepTolerance = 0.01;

export class Astro extends Node {

	collisions: Collision[] = []

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
					players[i].xp = update.players[i].xp;
				}

				const astroids = this.getChildren(Astroid);
				for (let i = 0; i < astroids.length; ++i) {
					astroids[i].applyTransform(update.astroids[i].position, update.astroids[i].rotation);
				}

				const bullets = this.getChildren(Bullet);
				for (let i = 0; i < bullets.length; ++i) {
					bullets[i].applyTransform(update.bullets[i].position, update.bullets[i].rotation);
				}

				const items = this.getChildren(Item);
				for (let i = 0; i < items.length; ++i) {
					items[i].applyTransform(update.items[i].position, update.items[i].rotation);
				}

				this.collisions = update.collisions
			});

			this.eventSystem.listen(Topic.AstroidSpawn, data => {
				const astroid = deserialize(data.json);
				astroid.parent = this;
				this.addChild(astroid);
			});

			this.eventSystem.listen(Topic.ItemSpawn, data => {
				const item = deserialize(data.json);
				item.parent = this;
				this.addChild(item);
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

		this.eventSystem.listen(Topic.PlayerConnected, data => {
			console.log("Player Connected", data.userid);
			const newPlayer = new Player();
			newPlayer.userid = data.userid
			newPlayer.username = data.username;
			newPlayer.transform = mat4.translate(newPlayer.transform, vec3.fromValues(Math.random() * 10 - 5, Math.random() * 10 - 5))
			// @ts-ignore
			newPlayer.setColor(data.userid)
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

		world.on('post-solve', (contact: Contact, impulse) => {

			const a = contact.getFixtureA().getBody().getUserData() as { damageMultiplier?: number };
			const b = contact.getFixtureB().getBody().getUserData() as { damageMultiplier?: number };

			const worldManifold = contact.getWorldManifold(null);

			if (worldManifold) {
				for (let i = 0; i < worldManifold.points.length; i++) {
					const point = worldManifold.points[i];
					const normalImpulse = impulse.normalImpulses[i];

					if (normalImpulse > 0.001) {
						this.collisions.push({
							x: point.x,
							y: point.y,
							f: normalImpulse
						});
					}
				}
			}

			if (a instanceof Bullet) {
				a.destroyOnNextUpdate = true;
			}
			if (b instanceof Bullet) {
				b.destroyOnNextUpdate = true;
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

			if (a instanceof Item) {
				if (b instanceof Player) {
					a.lastUser = b;
				} else {
					//a.destroyOnNextUpdate = true;
				}
			}

			if (b instanceof Item) {
				if (a instanceof Player) {
					b.lastUser = a;
				} else {
					//b.destroyOnNextUpdate = true;
				}
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
			const newAstro =  new Astroid();
			this.addChild(newAstro);

			this.eventSystem.publish(Topic.AstroidSpawn, {id: newAstro.id, json: newAstro.serialize()})
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
			const players = this.getChildren(Player);
			const astroids = this.getChildren(Astroid);
			const bullets = this.getChildren(Bullet);
			const items = this.getChildren(Item);

			// push items to player
			for (const item of items) {
				const ip = item.body.getPosition();
				const force = new Vec2();
				for (const player of players) {
					const pp = player.body.getPosition();
					force.add(Vec2.sub(pp,ip).mul(0.0001 / Math.pow(Vec2.distance(ip, pp), 2)));
				}

				item.body.applyForceToCenter(force);
			}


			const update: Update = {
				players: [],
				astroids: [],
				bullets: [],
				items: [],
				collisions: this.collisions
			}

			let accumulatedLevels = 0;
			for (const player of players) {
				accumulatedLevels += player.level;
				update.players.push({
					position: player.body.getPosition(),
					rotation: player.body.getAngle(),
					speed: parseFloat(Number(player.speed||0).toFixed(8)),
					health: player.health,
					xp: player.xp,
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

			for (const item of items) {
				update.items.push({
					position: item.body.getPosition(),
					rotation: item.body.getAngle()
				});
			}

			if (this.getChildren(Astroid).length < 50 + accumulatedLevels) {
				this.generateAstroids(1);
			}

			this.eventSystem.publish(Topic.Update, update);
			this.collisions.length = 0;
		}
	}

	destroy() {
		super.destroy();
		Node.idCounter = 0;
	}
}
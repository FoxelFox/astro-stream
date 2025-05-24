import {Node} from "../node/node"
import {Player} from "./player";
import {Topic} from "../event-system";
import {Camera} from "../node/2D/camera";
import {Ray} from "@dimforge/rapier2d-deterministic-compat";
import {deserialize} from "./deserialize";

export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

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
			const newPlayer = new Player();
			newPlayer.userid = userid
			this.addChild(newPlayer);
		});

		this.eventSystem.listen(Topic.PlayerDisconnected, userid =>
			1
		);
	}

	init () {
		console.log(Ray)
	}

	update() {
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
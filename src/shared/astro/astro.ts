import {Node} from "../node/node"
import {Player} from "./player";
import {Topic} from "../event-system";
import {Camera} from "../node/2D/camera";
import {Ray} from "@dimforge/rapier2d-deterministic-compat";

export const isClient = typeof window !== 'undefined';
export const isServer = !isClient;

export class Astro extends Node {
	// Game Scene

	camera: Camera;
	players: Player[] = [];

	constructor() {
		super();

		if (isClient) {
			this.eventSystem.listen(Topic.ReceiveUserId, data => {
				const myPlayer = this.getChildren(Player).find(p => p.userid == data.userid);
				this.camera = new Camera();
				this.addChild(this.camera)
			});

			this.eventSystem.listen(Topic.Update, data => {
				for (let i = 0; i < this.players.length; ++i) {
					this.players[i].transform = data.players[i];
				}
			})
		}

		this.eventSystem.listen(Topic.PlayerConnected, userid => {
			const newPlayer = new Player(userid);
			this.players.push(newPlayer);
			this.addChild(newPlayer);
		});

		this.eventSystem.listen(Topic.PlayerDisconnected, userid =>
			1
		);
	}

	async init () {
		console.log(Ray)
	}

	update() {
		super.update();
		if (isClient) {
			// update camera
		}

		if (isServer) {
			const transforms = []
			for (const player of this.players) {
				transforms.push(player.transform);
			}
			this.eventSystem.publish(Topic.Update, {players: transforms});
		}
	}
}
import {Node} from "../node/node"
import {Player} from "./player";
import {EventSystem, Topic} from "../event-system";
import {inject} from "../injector";
import {Camera} from "../node/2D/camera";

export class Astro extends Node {
	// Game Scene
	isClient = typeof window !== 'undefined';

	camera: Camera;

	constructor() {
		super();


		if (this.isClient) {
			this.eventSystem.listen(Topic.ReceiveUserId, userid => {
				const myPlayer = this.getChildren(Player).find(p => p.name);
				this.camera = new Camera();
				this.addChild(this.camera)
			});
		}


		this.eventSystem.listen(Topic.PlayerConnected, userid =>
			this.addChild(new Player(userid))
		);

		this.eventSystem.listen(Topic.PlayerDisconnected, userid =>
			1
		);
	}

	update() {

		if (this.isClient) {
			// update camera
		}

	}
}
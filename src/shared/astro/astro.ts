import {Node} from "../node/node"
import {Player} from "./player";
import {EventSystem, Topic} from "../event-system";
import {inject} from "../injector";

export class Astro extends Node {
	// Game Scene
	isClient = typeof window !== 'undefined';
	eventSystem = inject(EventSystem);

	constructor() {
		super();


		if (this.isClient) {
			this.eventSystem.listen(Topic.ReceiveUserId, userid => {
				const myPlayer = this.getChildren(Player).find(p => p.name);

			});
		}


		this.eventSystem.listen(Topic.PlayerConnected, data =>
			this.children.push(new Player(data.name))
		);

		this.eventSystem.listen(Topic.PlayerDisconnected, data =>
			1
		);
	}

	update() {

	}
}
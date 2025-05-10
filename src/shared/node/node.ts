import {inject} from "../injector";
import {EventSystem, Topic} from "../event-system";

export class Node {

	eventSystem = inject(EventSystem);
	parent?: Node;

	constructor(

		private children: Array<Node> = []
	) {
		this.eventSystem.publish(Topic.NodeCreate, this);
	}

	getChildren<T>(constructor: new (...args: any[]) => T): T[] {
		return this.children.filter(c => c instanceof constructor) as T[];
	}

	addChild(node: Node) {
		node.parent = this;
		this.children.push(node);
	}

	destroy() {
		this.eventSystem.publish(Topic.NodeDestroy, this);
	}
}


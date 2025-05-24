import {inject} from "../injector";
import {EventSystem, Topic} from "../event-system";

export class Node {

	eventSystem = inject(EventSystem);
	parent?: Node;
	children: Array<Node> = [];

	constructor() {
		this.eventSystem.publish(Topic.NodeCreate, this);
	}

	getChildren<T>(constructor: new (...args: any[]) => T): T[] {
		return this.children.filter(c => c instanceof constructor) as T[];
	}

	addChild(node: Node) {
		node.parent = this;
		this.children.push(node);
	}

	removeChild(node: Node) {
		const i = this.children.indexOf(node);
		this.children[i].destroy();
		this.children.splice(i, 1);
	}

	destroy() {
		this.eventSystem.publish(Topic.NodeDestroy, this);
	}

	update() {
		for (const child of this.children) {
			child.update();
		}
	}

	serialize() {
		return {
			type: this.constructor.name,
			children: this.children.map(c => c.serialize())
		}
	}

	deserialize(json: any): Node {
		return this;
	}
}


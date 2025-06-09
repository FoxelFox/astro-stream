import {inject} from "../injector";
import {EventSystem, Topic} from "../event-system";

export class Node {

	static idCounter = 0;
	id: number;
	eventSystem = inject(EventSystem);
	parent?: Node;
	children: Array<Node> = [];

	constructor(id?: number) {
		if (id === undefined) {
			this.id = ++Node.idCounter;
		}
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
		if (i === -1) {
			return;
		}
		this.children.splice(i, 1);
	}

	removeChildByID(id: number): Node {
		const i = this.children.findIndex(c => c.id === id);
		if (i === -1) {
			return;
		}
		const child = this.children[i];
		this.children.splice(i, 1);
		return child;
	}

	destroy() {
		for(const child of this.children) {
			child.destroy();
		}
		this.eventSystem.publish(Topic.NodeDestroy, { id: this.id, type: this.constructor.name });
	}

	update() {
		for (const child of this.children) {
			child.update();
		}
	}

	serialize() {
		return {
			id: this.id,
			type: this.constructor.name,
			children: this.children.map(c => c.serialize())
		}
	}

	deserialize(json: any): Node {
		this.id = json.id;
		return this;
	}
}


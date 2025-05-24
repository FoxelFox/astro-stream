import {Node} from "../node/node";
import {Astro} from "./astro";
import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {Player} from "./player";


export interface Type {
	type: string
	children: Type[]
	[key: string]: any
}

export function deserialize(json: Type): Node {

	let instance;
	switch (json.type) {
		case Astro.name: instance = new Astro(); break;
		case Node.name: instance = new Node(); break;
		case Node2D.name: instance = new Node2D(); break;
		case Line.name: instance = new Line(); break;
		case Player.name: instance = new Player(); break;
	}

	instance = instance.deserialize(json);

	const children = [];
	for (const child of json.children) {
		children.push(deserialize(child));
	}

	for (const child of json.children) {
		const childInstance = deserialize(child);
		childInstance.parent = instance;
		instance.children.push(childInstance);
	}

	return instance;
}
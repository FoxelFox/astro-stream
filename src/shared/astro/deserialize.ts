import {Node} from "../node/node";
import {Astro} from "./astro";
import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";
import {Player} from "./player";
import {Astroid} from "./astroid";
import {Bullet} from "./bullet";


export interface Type {
	type: string
	children: Type[]
	[key: string]: any
}

export function deserialize(json: Type): Node {

	let instance;
	switch (json.type) {
		case 'Astro': instance = new Astro(); break;
		case 'Node': instance = new Node(); break;
		case 'Node2D': instance = new Node2D(); break;
		case 'Line': instance = new Line(); break;
		case 'Player': instance = new Player(); break;
		case 'Astroid': instance = new Astroid(); break;
		case 'Bullet': instance = new Bullet(); break;
	}

	instance = instance.deserialize(json);

	for (const child of json.children) {
		const childInstance = deserialize(child);
		childInstance.parent = instance;
		instance.children.push(childInstance);
	}

	return instance;
}
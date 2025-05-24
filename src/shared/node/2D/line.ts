import {Node2D} from "./node-2d";
import {Node} from "../node";

export class Line extends Node2D {

	vertices: Float32Array
	color: Float32Array

	constructor() {
		super();
	}

	serialize(): any {
		const o = super.serialize();
		o.vertices = Array.from(this.vertices);
		o.color = Array.from(this.color);
		return o;
	}

	deserialize(json: any): Node {
		const o = super.deserialize(json) as Line;
		o.vertices = new Float32Array(json.vertices);
		o.color = new Float32Array(json.color);
		return o;
	}


}
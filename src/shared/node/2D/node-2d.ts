import {Mat3, mat4, Mat4} from "wgpu-matrix";
import {Node} from "../node";

export class Node2D extends Node {

	constructor(public transform: Mat4 = mat4.identity()) {
		super();
	}

	getGlobalTransform() {
		// @ts-ignore
		// TODO FIXME LATER !!!
		return this.transform
	}

	serialize(): any {
		const o = super.serialize();
		o.transform = Array.from(this.transform);
		return o;
	}

	deserialize(json: any): Node {
		const o = super.deserialize(json) as Node2D;
		o.transform = new Float32Array(json.transform);
		return o;
	}
}
import {Mat3, mat4, Mat4, vec3} from "wgpu-matrix";
import {Node} from "../node";
import {Math} from "planck";

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

	applyTransform(position: {x: number, y: number}, rotation: number) {
		this.transform = mat4.setTranslation(this.transform, vec3.fromValues(position.x, position.y));

		// (mat4.rotate?)
		this.transform[0] = Math.cos(-rotation);
		this.transform[1] = -Math.sin(-rotation);
		this.transform[4] = Math.sin(-rotation);
		this.transform[5] = Math.cos(-rotation);
	}
}
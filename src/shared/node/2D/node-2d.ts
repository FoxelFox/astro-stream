import {Mat3, mat4, Mat4} from "wgpu-matrix";
import {Node} from "../node";

export class Node2D extends Node {
	transform: Mat4 = mat4.identity();

	getGlobalTransform() {
		// @ts-ignore
		// TODO FIXME LATER !!!
		return this.parent.transform
	}
}
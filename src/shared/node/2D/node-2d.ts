import {mat3, Mat3} from "wgpu-matrix";
import {Node} from "../node";

export class Node2D extends Node {
	transform: Mat3 = mat3.identity();

	getGlobalTransform() {
		// @ts-ignore
		// TODO FIXME LATER !!!
		return this.parent.parent.transform
	}
}
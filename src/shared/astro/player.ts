import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";

export class Player extends Node2D {

	name: string

	constructor() {
		super();


		const polys = new Line(
			new Float32Array([0.0, 1.0, 0.5, -1.0,-0.5, -1.0]),
			new Float32Array([1.0,1.0,1.0,1.0])
		)
		this.children.push(polys);
	}
}
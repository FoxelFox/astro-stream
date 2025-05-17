import {Node2D} from "../node/2D/node-2d";
import {Line} from "../node/2D/line";


export class Player extends Node2D {


	keys: {[key: string]: boolean} = {}

	constructor(public name: string) {
		super();
		const w = 0.75;
		const h = 1;
		const polys = new Line(
			new Float32Array([
				0.0, h,
				w, -h,
				w, -h,
				-w, -h,
				-w, -h,
				0.0, h,
			]),
			new Float32Array([1.0,1.0,1.0,1.0])
		)
		this.addChild(polys);

	}
}
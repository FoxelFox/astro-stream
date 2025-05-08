import {Node} from "../node/node"
import {Player} from "./player";

export class Astro extends Node {
	// Game Scene

	constructor() {
		super();

		this.children.push(new Player())
	}
}
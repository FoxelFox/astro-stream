import {Player} from "../../shared/astro/player";
import {signal} from "@preact/signals";


export class Context {
	players = signal<Player[]>([]);
}
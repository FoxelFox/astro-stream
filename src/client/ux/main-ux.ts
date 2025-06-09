import {html, LitElement} from "lit";
import {customElement, property} from 'lit/decorators.js';
import {GameContext, spawn} from "../main";
import {Astro} from "../../shared/astro/astro";
import {Bullet} from "../../shared/astro/bullet";
import {Player} from "../../shared/astro/player";
import {Astroid} from "../../shared/astro/astroid";


@customElement("main-ux")
export class MainUx extends LitElement {

	context: GameContext
	@property() isLoggedIn = false;


	@property() players: number
	@property() astroids: number
	@property() health: number

	async startGame() {
		this.isLoggedIn = true;
		this.context = await spawn();

		setInterval(() => {
			this.astroids = this.context.game.getChildren(Astroid).length;
			this.players = this.context.game.getChildren(Player).length;
			// @ts-ignore
			this.health = Math.round(this.context.gpu.camera.target.health);
		},16)
	}

	render() {

		return html`
			${this.isLoggedIn
				? html`
					<div style="padding: 16px">
						<div>🧑‍🚀 ${this.players}</div>
						<div>🪨 ${this.astroids}</div>
						<div>❤️ ${this.health}</div>
					</div>
			`
				: html`
					<div style="display: grid; place-items: center; height: 100vh">
						<button
							@click="${this.startGame}"
							?disabled="${this.isLoggedIn}"
						>
							Start
						</button>
					</div>
			`}
		`
	}
}
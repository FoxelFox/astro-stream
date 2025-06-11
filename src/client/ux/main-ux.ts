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
	@property() matHealth: number
	@property() xp: number
	@property() xpPercent: number
	@property() level: number


	async startGame() {
		this.isLoggedIn = true;
		this.context = await spawn();

		setInterval(() => {
			this.astroids = this.context.game.getChildren(Astroid).length;
			this.players = this.context.game.getChildren(Player).length;
			this.health = Math.round(this.context.gpu.camera.target.health);
			this.matHealth = this.context.gpu.camera.target.maxHealth;
			this.xp = this.context.gpu.camera.target.xp;
			this.level = this.context.gpu.camera.target.level;
			const range = this.context.gpu.camera.target.getCurrentLevelXpRange();
			this.xpPercent = (this.xp - range.start) / (range.end - range.start) * 100;

		},16)
	}

	render() {

		return html`
			
			<style>
				.progress {
					z-index: -1;
					position: absolute;
					width: ${this.xpPercent * 2.14}px;
					height: 28px;
					margin: -1px -7px;
					background-color: rgb(32,128,32);
					border-radius: 1px
				}
			</style>
			${this.isLoggedIn
				? html`
					<div style="padding: 16px; display: flex; justify-content: space-between">
						
						<div>
							<div>🧑‍🚀 ${this.players}</div>
							<div>🪨 ${this.astroids}</div>
							<div>❤️ ${this.health} / ${this.matHealth}</div>
						</div>
						
						<div style="width: 200px; box-shadow:inset 0 0 0 1px gray; padding: 0 8px; height: 30px; justify-items: center; align-content: center; border-radius: 2px">
							<div class="progress"></div>
							<div style="display: flex; width: 100%; justify-content: space-between;flex-direction: row; align-items: center;">
								<div>⭐ ${this.level}</div>
								<div>${this.xp} XP</div>
							</div>
						</div>
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
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
	@property() xpPercent: number = 0
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
			const percent = (this.xp - range.start) / (range.end - range.start) * 100;

			if (isNaN(this.xpPercent)) {
				this.xpPercent = 0;
			} else {
				this.xpPercent = percent;
			}

		},16)
	}

	render() {

		return html`
			
			<style>
				
			</style>
			${this.isLoggedIn
				? html`
					<div style="padding: 16px; display: flex; justify-content: space-between">
						
						<div>
							<div>🧑‍🚀 ${this.players}</div>
							<div>🪨 ${this.astroids}</div>
						</div>

						
						<div style="display: flex; justify-content: space-between"">
							<progress-bar
								style="width: 200px;"
								value="${Math.round(this.health / this.matHealth * 100)}"
								right="${this.health} HP"
								left="❤️"
								color="rgba(153, 51, 40, 0.7)"
							></progress-bar>
							<div style="width: 16px"></div>
							<progress-bar
								style="width: 200px;"
								value="${this.xpPercent}"
								right="${this.xp} XP"
								left="⭐ ${this.level}"
								color="rgba(162, 145, 26, 0.7)"
							></progress-bar>
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
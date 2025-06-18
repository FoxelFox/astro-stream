import {html, LitElement} from "lit";
import {customElement, property} from 'lit/decorators.js';
import {GameContext, spawn} from "../main";
import {Player} from "../../shared/astro/player";
import {Astroid} from "../../shared/astro/astroid";

@customElement("main-ux")
export class MainUx extends LitElement {

	context: GameContext
	@property() isLoggedIn = false;


	@property() playerCount: number
	@property() players: Player[]
	@property() astroids: number
	@property() health: number
	@property() matHealth: number
	@property() xp: number
	@property() xpPercent: number = 0
	@property() level: number
	@property() username: string = localStorage.getItem('username') || ''


	async startGame() {
		localStorage.setItem('username', this.username);
		this.isLoggedIn = true;
		this.context = await spawn(this.username);

		setInterval(() => {
			this.astroids = this.context.game.getChildren(Astroid).length;
			this.players = this.context.game.getChildren(Player);
			this.playerCount = this.players.length;
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
				input {
					padding: 6px 12px;
					background: rgb(31, 32, 35);
					border: 1px solid rgb(60, 63, 68);
					border-radius: 8px;
					color: rgb(247, 248, 248);
					height: 36px;
					appearance: none;
					transition: border 0.15s ease 0s;
					font-size: 18px;
				}
				input:focus{
					outline: none;
					box-shadow: none;
					border-color: rgb(100, 153, 255);
				}
				
				button {
					display: inline-block;
					outline: 0;
					cursor: pointer;
					background: rgb(31, 32, 35);;
					border: 1px solid rgb(60, 63, 68);
					color: rgb(247, 248, 248);;
					border-radius: 8px;
					padding: 14px 24px 16px;
					font-size: 18px;
					font-weight: 700;
					line-height: 1;
					transition: transform 200ms,background 200ms;
				}
				button:hover {
					filter: contrast(0.9);
				}
				button:focus {
					border-color: rgb(100, 153, 255);
				}
			</style>
			${this.isLoggedIn
				? html`
					<div style="padding: 16px; display: flex; justify-content: space-between">
						
						<div style="display: flex; gap: 8px">
							<leader-board .players="${this.players}"> </leader-board>
							<div>
								<div>🧑‍🚀 ${this.playerCount}</div>
								<div>🪨 ${this.astroids}</div>
							</div>
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
						<form @submit="${this.startGame}">
							<input  placeholder="Name" id="username" .value="${this.username}" @change="${this.change}">
							
							<button
								@click="${this.startGame}"
								?disabled="${this.isLoggedIn}"
							>
								Start
							</button>
						</form>
						
					</div>
			`}
		`
	}

	change(ev: any) {
		const {id, value} = ev.target;
		this[id] = value;
	}
}
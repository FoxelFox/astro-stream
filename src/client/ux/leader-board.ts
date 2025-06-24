import {customElement, property} from "lit/decorators.js";
import {html, LitElement} from "lit";
import {Player} from "../../shared/astro/player";

@customElement("leader-board")
export class LeaderBoard extends LitElement {

	@property() self: string
	@property() players: Player[];

	render() {
		return html`
			<style>
				.box {
					background-color: rgba(64, 64, 64, 0.1);
					backdrop-filter: blur(8px);
					padding: 16px;
					border-radius: 16px;
					border: 1px gray solid;
				}

				.list-item {
					display: flex;
					justify-content: space-between;
					gap: 8px;
				}

				.username {
					width: 150px;
					max-width: 150px;
					overflow: hidden;
					text-overflow: ellipsis;
					white-space: nowrap;
				}
				.player-icon {
					height: 16px;
					width: 16px;
					border-radius: 50%;
				}

				h3 {
					margin: 0 0 8px;
				}
			</style>
			<div class="box">
				<h3>Leaderboard</h3>
				${this.players?.sort((a, b) => b.xp - a.xp).slice(0,9).map(player => html`
					<div class="list-item" style="margin-bottom: 4px">
						<span class="list-item">
							<div 
								class="player-icon"
								style="background-color: rgb(${this.getPlayerColor(player)})"
							></div>
							<div class="username">${player.username}</div>
						</span>
						
						<div>${player.level}</div>
					</div>

				`)}
			</div>
		`
	}

	getPlayerColor(player: Player) {
		return [player.color[0] * 255, player.color[1] * 255, player.color[2] * 255].join(', ')
	}
}
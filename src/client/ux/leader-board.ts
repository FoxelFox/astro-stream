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
					gap: 16px;
				}

				.username {
					width: 150px;
					max-width: 150px;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				h3 {
					margin: 0 0 8px;
				}
			</style>
			<div class="box">
				<h3>Leaderboard</h3>
				${this.players?.sort((a, b) => b.xp - a.xp).slice(0,9).map(player => html`
					<div class="list-item">
						<div class="username">${player.username}</div>
						<div>${player.xp}</div>
					</div>

				`)}
			</div>
		`
	}
}
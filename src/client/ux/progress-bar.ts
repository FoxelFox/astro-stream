import {css, html, LitElement} from "lit";
import {customElement, property} from 'lit/decorators.js';

@customElement("progress-bar")
export class MainUx extends LitElement {



	@property() value: number;
	@property() left: string;
	@property() right: string;
	@property() color: string;


	render() {
		return html`
			<style>
				.base {
					box-shadow:inset 0 0 0 1px gray;
					background-color: rgba(64, 64, 64, 0.1);
					width: 100%;
					height: 34px;
					overflow: hidden;
					border-radius: 20px;
				}
				.bar {
					width: ${this.value}%;
					transition: width 350ms ease-in-out;
					background-color: ${this.color};
					height: 34px;
					line-height: 34px;
					position: relative;
					top: -34px;
					z-index: -1;
					border-radius: 20px;
				}
				.text {
					height: 26px;
					padding: 4px 8px;
					display: flex;
					justify-content: space-between;
					align-items: center;
				}
			</style>
			
			<div class="base">
				<div class="text">
					<div>${this.left}</div>
					<div>${this.right}</div>
				</div>
				<div class="bar"></div>
			</div>
		`
	}
}
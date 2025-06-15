import {Control} from "../shared/control";
import {inject} from "../shared/injector";
import {EventSystem, Topic} from "../shared/event-system";


export class Input {

	control = new Control();
	eventSystem = inject(EventSystem);

	mapping = {
		KeyW: 'forward',
		KeyS: 'backward',
		KeyA: 'left',
		KeyD: 'right',
		Space: 'action',
	}

	constructor() {


		const handle = (ev: KeyboardEvent, isPressed: boolean) => {
			if (ev.repeat === false) {
				if (this.mapping[ev.code]) {
					this.control[this.mapping[ev.code]] = isPressed;
					this.eventSystem.publish(Topic.ClientControlEvent, this.control);
				}
			}
		}

		const handleMouseMove = (ev: MouseEvent) => {

			const x = ev.clientX - window.innerWidth / 2;
			const y = window.innerHeight / 2 - ev.clientY;

			this.control.rotation = this.keepInRange(Math.atan2(y, x) + Math.PI / 2);
			this.control.mx = x;
			this.control.my = y;
			this.eventSystem.publish(Topic.ClientControlEvent, this.control);
		}


		const handleClick = (ev: MouseEvent, isDown) => {

			switch (ev.button) {
				case 0:
					this.control.action = isDown;
					break;
				case 2:
					this.control.forward = isDown;
					break;
			}

			this.eventSystem.publish(Topic.ClientControlEvent, this.control);
		}

		document.addEventListener('keyup', ev => handle(ev, false));
		document.addEventListener('keydown', ev => handle(ev, true));
		document.addEventListener('mousemove', ev => handleMouseMove(ev));
		document.addEventListener('mousedown', ev => handleClick(ev, true));
		document.addEventListener('mouseup', ev => handleClick(ev, false));
		document.addEventListener('contextmenu', event => {
			event.preventDefault();
		});
	}

	clampRadToPi(rad) {
		const pi = Math.PI;
		return ((rad % pi) + pi) % pi - pi / 2;
	}

	keepInRange(angle) {
		let twoPi = 2 * Math.PI;
		return ((angle % twoPi) + twoPi) % twoPi - Math.PI;
	}

}
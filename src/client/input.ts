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

		const handleMouse = (ev: MouseEvent) => {

			const x = ev.clientX - document.body.clientWidth / 2;
			const y = document.body.clientHeight / 2 - ev.clientY;



			this.control.rotation = this.keepInRange(Math.atan2(y, x) + Math.PI / 2);
			this.eventSystem.publish(Topic.ClientControlEvent, this.control);
		}

		document.addEventListener('keyup', ev => handle(ev, false));
		document.addEventListener('keydown', ev => handle(ev, true));
		document.addEventListener('mousemove', ev => handleMouse(ev));
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
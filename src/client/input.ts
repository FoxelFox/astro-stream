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

		document.addEventListener('keyup', ev => handle(ev, false));
		document.addEventListener('keydown', ev => handle(ev, true));
	}

}
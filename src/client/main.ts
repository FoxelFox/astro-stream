import {Astro} from "../shared/astro/astro";
import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";

const socket = new WebSocket(`ws://${location.hostname}:3001`);

const game = new Astro();
const eventSystem = inject(EventSystem);

socket.onopen = (ev) => {
	console.log('connected')
}

socket.onmessage = (ev) => {
	console.log(ev)
	const data = JSON.parse(ev.data);
	eventSystem.publish(data.topic, data.message);
}

import {Astro} from "../shared/astro/astro";
import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";
import {GPU} from "./gpu/gpu";

const socket = new WebSocket(`ws://${location.hostname}:3001`);

socket.onopen = (ev) => {
	console.log('connected')
}

socket.onmessage = (ev) => {
	console.log(ev)
	const data = JSON.parse(ev.data);
	eventSystem.publish(data.topic, data.message);
}

const gpu = new GPU();
const game = new Astro();
const eventSystem = inject(EventSystem);

await gpu.init();
await game.init();




function loop() {
	gpu.update();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
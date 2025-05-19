import {Astro} from "../shared/astro/astro";
import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";
import {GPU} from "./gpu/gpu";
import {Input} from "./input";

const socket = new WebSocket(`ws://${location.hostname}:3001`);

socket.onopen = (ev) => {
	console.log('connected')
}

socket.onmessage = (ev) => {
	const data = JSON.parse(ev.data);
	eventSystem.publish(data.topic, data.message);
}


const gpu = new GPU();
const game = new Astro();
const input = new Input();
const eventSystem = inject(EventSystem);

await gpu.init();
await game.init();

const networkEvents = [Topic.ClientControlEvent];
for (const topic of networkEvents) {
	eventSystem.listen(topic, (data) => {
		socket.send(JSON.stringify({topic, message: data}));
	});
}

function loop() {
	gpu.update();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
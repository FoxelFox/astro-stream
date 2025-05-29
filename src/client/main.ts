import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";
import {GPU} from "./gpu/gpu";
import {Input} from "./input";
import {deserialize} from "../shared/astro/deserialize";

const url = location.hostname === 'localhost' ? 'ws://localhost:3001' : `wss://ws.${location.hostname}`;
let game;

const eventSystem = inject(EventSystem);
eventSystem.listen(Topic.Sync, async data => {
	game = deserialize(data)

	const networkEvents = [Topic.ClientControlEvent];
	for (const topic of networkEvents) {
		eventSystem.listen(topic, (data) => {
			socket.send(JSON.stringify({topic, message: data}));
		});
	}
});

const gpu = new GPU();
await gpu.init();
const input = new Input();

const socket = new WebSocket(url);

socket.onopen = (ev) => {
	console.log('connected')
}

socket.onmessage = (ev) => {
	const data = JSON.parse(ev.data);
	eventSystem.publish(data.topic, data.message);
}

function loop() {
	gpu.update();

	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
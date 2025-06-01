import "./ui/index"

import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";
import {GPU} from "./graphic/gpu";
import {Input} from "./input";
import {deserialize} from "../shared/astro/deserialize";
import {Node} from "../shared/node/node";


const url = location.hostname === 'localhost' ? 'ws://localhost:3001' : `wss://ws.${location.hostname}`;
let game;

const eventSystem = inject(EventSystem);
const gpu = new GPU();
await gpu.init();


export async function spawn() {

	const {Sound} = await import("./audio/sound")
	const sound = new Sound();

	eventSystem.listen(Topic.Sync, async data => {

		game = deserialize(data.game)
		Node.idCounter = data.idCounter;
		gpu.astro = game;


		sound.astro = game;

		const networkEvents = [Topic.ClientControlEvent];
		for (const topic of networkEvents) {
			eventSystem.listen(topic, (data) => {
				socket.send(JSON.stringify({topic, message: data}));
			});
		}
	});

	const input = new Input();
	//import {Sound} from "./audio/sound";

	//const sound = new Sound();
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
		sound.update();

		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}


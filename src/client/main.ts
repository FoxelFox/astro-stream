
import "./ux/main-ux"
import "./ux/progress-bar"
import "./ux/leader-board"

import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";
import {GPU} from "./graphic/gpu";
import {Input} from "./input";
import {deserialize} from "../shared/astro/deserialize";
import {Node} from "../shared/node/node";
import {Astro} from "../shared/astro/astro";
import {Sound} from "./audio/sound";
import {Update, UpdateEvent} from "../shared/proto/generated/update";
import {theWindow} from "tone/build/esm/core/context/AudioContext";
import {Player} from "../shared/astro/player";
import {Camera} from "./graphic/camera";


const url = location.hostname === 'localhost' ? 'ws://localhost:3001' : `wss://ws.${location.hostname}`;

export interface GameContext {
	game?: Astro,
	sound?: Sound,
	gpu?: GPU
}

export const gameContext: GameContext = {}


const eventSystem = inject(EventSystem);
gameContext.gpu = new GPU();
await gameContext.gpu.init();



export function spawn(username: string): Promise<GameContext> {
	return new Promise(async (resolve) => {
		const {Sound} = await import("./audio/sound")
		gameContext.sound = new Sound();

		eventSystem.listen(Topic.Sync, async data => {

			gameContext.game = deserialize(data.game) as Astro;
			Node.idCounter = data.idCounter;
			gameContext.gpu.astro = gameContext.game;
			gameContext.sound.astro = gameContext.game;

			const networkEvents = [Topic.ClientControlEvent];
			for (const topic of networkEvents) {
				eventSystem.listen(topic, (data) => {
					socket.send(JSON.stringify({topic, message: data}));
				});
			}

			eventSystem.listen(Topic.ReceiveUserId, data => {
				const myPlayer = gameContext.game.getChildren(Player).find(p => p.userid == data.userid);
				myPlayer.username = username;
			});

			resolve(gameContext);
		});

		const input = new Input();
		//import {Sound} from "./audio/sound";

		//const sound = new Sound();
		const socket = new WebSocket(url);

		socket.onopen = (ev) => {
			console.log('connected')
			socket.send(JSON.stringify({topic: Topic.SetUserName, message: username}))
		}

		socket.onmessage = async (ev) => {
			if (typeof ev.data  === 'string') {
				const data = JSON.parse(ev.data);
				eventSystem.publish(data.topic, data.message);
			} else {
				const ui8 = new Uint8Array(await ev.data.arrayBuffer());
				const decoded = UpdateEvent.decode(ui8);
				eventSystem.publish(decoded.topic, decoded.message);
				loop();
			}
		}



		function loop() {
			gameContext.gpu.update();
			gameContext.sound.update();

			//requestAnimationFrame(loop);
		}

		//requestAnimationFrame(loop);
	})


}


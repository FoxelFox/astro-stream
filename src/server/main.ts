import {ServerWebSocket} from "bun";
import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";
import * as path from "node:path";
import {Astro} from "../shared/astro/astro";
import {Node} from "../shared/node/node";
import {UpdateEvent} from "../shared/proto/generated/update";

const publicDir = path.resolve(import.meta.dir, '../../dist');
let idCounter = 0;

class Backend {

	eventSystem = inject(EventSystem);
	game = new Astro();
	interval: Timer;

	connections: {[id: string]: ServerWebSocket<unknown>} = {};

	userConnected(ws: ServerWebSocket<unknown>, username: string): string {

		// continue game if first user is connected
		if (!Object.keys(this.connections).length) {
			this.interval = setInterval(() => {
				this.game.update();
			}, 1000/60);
		}

		const userid = (++idCounter).toString();
		this.connections[userid] = ws;
		this.eventSystem.publish(Topic.PlayerConnected, {userid, username});
		ws.send(JSON.stringify({
			topic: Topic.Sync,
			message: {
				idCounter: Node.idCounter,
				game: this.game.serialize()
			}
		}));
		ws.send(JSON.stringify({topic: Topic.ReceiveUserId, message: {userid: userid}}));
		return userid;
	}

	userDisconnected(ws: ServerWebSocket<unknown>) {
		for (const userid in backend.connections) {
			if (backend.connections[userid] === ws) {
				delete backend.connections[userid];
				this.eventSystem.publish(Topic.PlayerDisconnected, userid);
			}
		}

		// pause game if no user is connected
		if (!Object.keys(this.connections).length) {
			clearInterval(this.interval);
		}
	}

	result = () => {
		return Response.json({blub: "test"});
	};

	websocket = () => {

	};

	router = {
		'/api/charts': this.result,
		'/websocket': this.websocket
	}

	main() {
		this.game.init();
	}
}


const backend = new Backend();
backend.main();

Bun.serve({
	async fetch(req) {

		let requestedPath = new URL(req.url).pathname;

		let p = requestedPath.split('/');
		if (p[1] === "api") {
			return backend.router[requestedPath]();
		}


		if (requestedPath === "/") {
			requestedPath = "/index.html";
		}
		const safeSuffix = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');
		const filePath = path.join(publicDir, safeSuffix);

		const file = Bun.file(filePath);

		if (await file.exists()) {
			return new Response(
				Bun.gzipSync(await file.arrayBuffer()),
				{
					headers: {
						'Content-Type': file.type,
						'Content-Encoding': 'gzip'
					}
				}
			);
		} else {
			return new Response("404!")
		}

	},
});

const webSocketServer = Bun.serve({
	port: 3001,
	async fetch(req, server) {
		// upgrade the request to a WebSocket
		if (server.upgrade(req)) {
			return; // do not return a Response
		}
		return new Response("Upgrade failed", { status: 500 });
	},
	websocket: {
		open(ws) {
			ws.subscribe('update');
			ws.subscribe('userid');
		},
		message(ws, ev: string) {
			const e: {topic: Topic, message: any} = JSON.parse(ev);

			switch (e.topic) {
				case Topic.ClientControlEvent:
					eventSystem.publish(Topic.PlayerControlEvent, {
						userid: ws.data as string,
						control: e.message
					});
					break;
				case Topic.SetUserName:
					ws.data = backend.userConnected(ws, e.message as string);
					break;
			}
		},
		close(ws, code: number, reason: string) {
			ws.unsubscribe('update');
			backend.userDisconnected(ws);
		}
	}
});

const eventSystem = inject(EventSystem);

const networkEvents = [
	Topic.PlayerConnected,
	Topic.PlayerDisconnected,
	Topic.BulletSpawn,
	Topic.AstroidSpawn,
	Topic.ItemSpawn,
	Topic.NodeDestroy,
	Topic.SetUserName
];
for (const topic of networkEvents) {
	eventSystem.listen(topic, (data) => {
		webSocketServer.publish('update', JSON.stringify({topic, message: data}),true);
	});
}

eventSystem.listen(Topic.Update, data => {

	try {
		webSocketServer.publish('update', UpdateEvent.encode({topic: Topic.Update, message: data}).finish());
	} catch (e) {
		console.log(e)
	}

});
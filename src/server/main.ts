import {ServerWebSocket} from "bun";
import {EventSystem, Topic} from "../shared/event-system";
import {inject} from "../shared/injector";
import * as path from "node:path";
import {Astro} from "../shared/astro/astro";

const publicDir = path.resolve(import.meta.dir, '../../dist');

class Backend {

	eventSystem = inject(EventSystem);
	game = new Astro();

	connections: {[id: string]: ServerWebSocket<unknown>} = {};

	userConnected(ws: ServerWebSocket<unknown>): string {
		for (let userid = Date.now().toString(); this.connections[userid] === undefined;) {
			this.connections[userid] = ws;
			this.eventSystem.publish(Topic.PlayerConnected, userid);
			ws.send(JSON.stringify({topic: Topic.ReceiveUserId, message: {userid: userid}}));
			return userid;
		}
	}

	userDisconnected(ws: ServerWebSocket<unknown>) {
		for (const userid in backend.connections) {
			if (backend.connections[userid] === ws) {
				delete backend.connections[userid];
				this.eventSystem.publish(Topic.PlayerDisconnected, userid);
			}
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

	async main() {
		await this.game.init();

		setInterval(() => {
			this.game.update();
		}, 1000/60);
	}
}


const backend = new Backend();

backend.main().then(() => {
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

				ws.data = backend.userConnected(ws);

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
				}
			},
			close(ws, code: number, reason: string) {
				ws.unsubscribe('update');
				backend.userDisconnected(ws);
			}
		}
	});

	const eventSystem = inject(EventSystem);

	const networkEvents = [Topic.Update, Topic.PlayerConnected, Topic.PlayerDisconnected];
	for (const topic of networkEvents) {
		eventSystem.listen(topic, (data) => {
			webSocketServer.publish('update', JSON.stringify({topic, message: data}),true);
		});
	}
});
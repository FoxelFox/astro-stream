import { ServerWebSocket } from "bun";
import {EventSystem} from "../shared/event-system";
import {inject} from "../shared/injector";
import * as path from "node:path";

const publicDir = path.resolve(import.meta.dir, '../../dist');

console.log(publicDir)
class Backend {

	eventSystem = new EventSystem();

	connections: ServerWebSocket[] = []

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

	}
}


const backed = new Backend();

backed.main().then(() => {
	Bun.serve({
		async fetch(req) {

			let requestedPath = new URL(req.url).pathname;

			let p = requestedPath.split('/');
			if (p[1] === "api") {
				return backed.router[requestedPath]();
			}


			if (requestedPath === "/") {
				requestedPath = "/index.html";
			}
			const safeSuffix = path.normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');
			const filePath = path.join(publicDir, safeSuffix);

			const file = Bun.file(filePath);

			if (await file.exists()) {
				return new Response(file);
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
				console.log('new client', ws)
				ws.subscribe('update');
			},
			message(ws, message) {
				console.log(message)
			},
			close(ws, code: number, reason: string) {
				ws.unsubscribe('update');
			}
		}
	});

	const eventSystem = inject(EventSystem);

	eventSystem.listen("update", (data) => {
		webSocketServer.publish("update", JSON.stringify(data));
	});

	//backed.market.watch();

	console.log("Online")
});
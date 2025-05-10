export enum Topic {
	Update = 'update',
	NodeDestroy = 'node-destroy',
	NodeCreate = 'node-created',
	ReceiveUserId = 'receive-userid',
	PlayerConnected = 'player-connected',
	PlayerDisconnected = 'player-disconnected'
}


export class EventSystem {
	topics: {[key: string]: ((data: any) => void)[]}  = {};

	listen(topic: Topic, listener: (message: any) => void) {
		this.topics[topic] ??= [];
		this.topics[topic].push(listener);
	}

	publish(topic: Topic, message: any) {
		console.log('Event System publish', topic, message);
		this.topics[topic] ??= [];

		for (const listener of this.topics[topic]) {
			listener(message);
		}
	}
}
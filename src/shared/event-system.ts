export class EventSystem {
	topics: {[key: string]: ((data: any) => void)[]} = {}

	listen(topic: string, listener: (message: any) => void) {
		this.topics[topic] ??= [];
		this.topics[topic].push(listener);
	}

	publish(topic: string, message: any) {
		this.topics[topic] ??= [];

		for (const listener of this.topics[topic]) {
			listener(message);
		}
	}
}
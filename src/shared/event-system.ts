import {Node} from "./node/node";

export enum Topic {
	Update,
	NodeDestroy,
	NodeCreate,
	ReceiveUserId,
	PlayerConnected,
	PlayerDisconnected,
	CanvasResize
}

export interface TopicDataMap {
	[Topic.Update]: any
	[Topic.NodeDestroy]: Node
	[Topic.NodeCreate]: Node
	[Topic.ReceiveUserId]: string;
	[Topic.PlayerConnected]: string;
	[Topic.PlayerDisconnected]: string;
	[Topic.CanvasResize]: { width: number; height: number };
}


type Listener<T extends Topic> = (data: TopicDataMap[T]) => void;

export class EventSystem {

	private topics: { [K in Topic]?: Listener<K>[] } = {};

	listen<T extends Topic>(topic: T, listener: Listener<T>) {
		(this.topics[topic] ??= []).push(listener);
	}

	publish<T extends Topic>(topic: T, message: TopicDataMap[T]) {
		this.topics[topic] ??= [];

		for (const listener of this.topics[topic]) {
			listener(message);
		}
	}
}
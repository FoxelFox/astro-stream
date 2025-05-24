import {Node} from "./node/node";
import {Control} from "./control";
import {Type} from "./astro/deserialize";

export enum Topic {
	Sync,
	Update,
	NodeDestroy,
	NodeCreate,
	ReceiveUserId,
	PlayerConnected,
	PlayerDisconnected,
	CanvasResize,
	ClientControlEvent,
	PlayerControlEvent
}

export interface TopicDataMap {
	[Topic.Sync]: Type
	[Topic.Update]: { players: Float32Array[] }
	[Topic.NodeDestroy]: Node
	[Topic.NodeCreate]: Node
	[Topic.ReceiveUserId]: {userid: string}
	[Topic.PlayerConnected]: string
	[Topic.PlayerDisconnected]: string
	[Topic.CanvasResize]: { width: number; height: number }
	[Topic.ClientControlEvent]: Control
	[Topic.PlayerControlEvent]: {userid: string, control: Control}
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
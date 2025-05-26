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
	PlayerControlEvent,
	BulletSpawn
}

export interface TopicDataMap {
	[Topic.Sync]: Type
	[Topic.Update]: { players: Float32Array[], astroids: Float32Array[], bullets: Float32Array[]} // TODO refactor this!
	[Topic.NodeDestroy]: Node
	[Topic.NodeCreate]: Node
	[Topic.ReceiveUserId]: {userid: string}
	[Topic.PlayerConnected]: string
	[Topic.PlayerDisconnected]: string
	[Topic.CanvasResize]: { width: number; height: number }
	[Topic.ClientControlEvent]: Control
	[Topic.PlayerControlEvent]: {userid: string, control: Control}
	[Topic.BulletSpawn]: {transform: Float32Array}
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
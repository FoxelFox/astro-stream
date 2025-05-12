import {EventSystem, Topic} from "../../shared/event-system";
import {inject} from "../../shared/injector";
import {Line} from "../../shared/node/2D/line";
import {Node} from "../../shared/node/node";
import {LinePass} from "./line-pass";

export class GPU {

	eventSystem = inject(EventSystem);
	lines = new LinePass();
	device: GPUDevice;
	canvas: HTMLCanvasElement;

	constructor() {
		this.eventSystem.listen(Topic.NodeCreate, (node: Node) => {
			switch (node.constructor) {
				case Line: this.lines.add(node as Line); return;
			}
		});

		this.eventSystem.listen(Topic.NodeDestroy, (node: Node) => {
			switch (node.constructor) {
				case Line: this.lines.remove(node as Line); return;
			}
		});

	}

	async init() {
		this.canvas = document.getElementsByTagName('canvas')[0];

		try {
			if (navigator.gpu) {
				const adapter = await navigator.gpu.requestAdapter({powerPreference: 'high-performance'});
				this.device = await adapter.requestDevice();
			}
		} finally {
			document.body.textContent = this.device ? 'benchmark started' : 'No GPU available 😔';
		}
	}

	update() {
		// update buffers

		this.lines.update();


		// draw calls
	}


}
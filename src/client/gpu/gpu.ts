import {EventSystem, Topic} from "../../shared/event-system";
import {inject} from "../../shared/injector";
import {Line} from "../../shared/node/2D/line";
import {Node} from "../../shared/node/node";
import {LinePass} from "./line/line-pass";
import {Camera} from "../../shared/node/2D/camera";

export let device: GPUDevice
export let context: GPUCanvasContext

	export class GPU {

	eventSystem = inject(EventSystem);
	lines: LinePass = new LinePass();
	canvas: HTMLCanvasElement;
	camera: Camera;

	constructor() {
		this.eventSystem.listen(Topic.NodeCreate, (node: Node) => {
			switch (node.constructor) {
				case Line: this.lines.add(node as Line); return;
				case Camera: this.camera = node as Camera;
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
				device = await adapter.requestDevice();
			}
		} finally {
			if (!device) {
				document.body.textContent = 'No GPU available 😔';
			}
		}

		context = this.canvas.getContext('webgpu');
		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
		context.configure({
			device,
			format: presentationFormat,
			alphaMode: 'opaque'
		});

	}

	update() {
		// update buffers

		this.lines.update(this.camera.transform);


		// draw calls
	}


}
import {EventSystem, Topic} from "../../shared/event-system";
import {inject} from "../../shared/injector";
import {Line} from "../../shared/node/2D/line";
import {LinePass} from "./line/line-pass";
import {Camera} from "../../shared/node/2D/camera";

export let device: GPUDevice
export let context: GPUCanvasContext
export let canvas: HTMLCanvasElement

	export class GPU {

	eventSystem = inject(EventSystem);
	lines: LinePass = new LinePass();
	camera: Camera;

	constructor() {
		this.eventSystem.listen(Topic.NodeCreate, node => {
			switch (node.constructor) {
				case Camera: this.camera = node as Camera;
			}

			if (node instanceof Line) {
				this.lines.add(node as Line);
			}
		});

		this.eventSystem.listen(Topic.NodeDestroy, data => {
			this.lines.remove(data.id);
		});

	}

	async init() {
		canvas = document.getElementsByTagName('canvas')[0];
		this.setCanvasSize();
		window.addEventListener("resize", this.setCanvasSize);

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

		context = canvas.getContext('webgpu');
		const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
		context.configure({
			device,
			format: presentationFormat,
			alphaMode: 'premultiplied'
		});

		this.lines.init();
	}

	setCanvasSize = () => {
		canvas.width = window.innerWidth * devicePixelRatio;
		canvas.height = window.innerHeight * devicePixelRatio;

		this.eventSystem.publish(
			Topic.CanvasResize, {
				width: canvas.width,
				height: canvas.height
			}
		);
	}

	update() {
		if (this.camera) {
			this.lines.update(this.camera);
		}
	}


}
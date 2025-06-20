import {EventSystem, Topic} from "../../shared/event-system";
import {inject} from "../../shared/injector";
import {Line} from "../../shared/node/2D/line";
import {LinePass} from "./line/line-pass";
import {Camera} from "./camera";
import {Player} from "../../shared/astro/player";
import {Astro} from "../../shared/astro/astro";
import {Poly} from "../../shared/node/2D/poly";
import {PolyPass} from "./poly/poly-pass";
import {Particle} from "./particle/particle";

export let device: GPUDevice
export let context: GPUCanvasContext
export let canvas: HTMLCanvasElement

export class GPU {

	eventSystem = inject(EventSystem);
	lines: LinePass = new LinePass();
	polys: PolyPass = new PolyPass();
	particles: Particle = new Particle();
	camera: Camera;
	astro: Astro;

	constructor() {

		this.eventSystem.listen(Topic.ReceiveUserId, data => {
			const myPlayer = this.astro.getChildren(Player).find(p => p.userid == data.userid);
			this.camera = new Camera(myPlayer);
		});

		this.eventSystem.listen(Topic.NodeCreate, node => {
			if (node instanceof Line) {
				this.lines.add(node as Line);
			}
			if (node instanceof Poly) {
				this.polys.add(node as Poly);
			}
		});

		this.eventSystem.listen(Topic.NodeDestroy, data => {
			this.lines.remove(data.id);
			this.polys.remove(data.id);
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
				document.body.innerHTML = '' +
					'<div style="padding: 0 16px">' +
						'<h1>No GPU available 😔</h1>' +
						'<p>You need a WebGPU compatible browser</p>' +
						'<a style="color: brown" href="https://caniuse.com/webgpu">https://caniuse.com/webgpu</a>' +
					'</div> ';
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
		this.polys.init();
		this.particles.init();
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
			this.polys.update(this.camera);
			this.particles.render(this.camera);
		}
	}

}
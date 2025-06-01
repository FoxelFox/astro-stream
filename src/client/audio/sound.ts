import * as Tone from "tone";
import {EventSystem, Topic} from "../../shared/event-system";
import {inject} from "../../shared/injector";
import {Player} from "../../shared/astro/player";
import {Astro} from "../../shared/astro/astro";
import {Synth, ToneAudioNode} from "tone";
import {Vec2} from "planck";
import {mat4, vec3} from "wgpu-matrix";

await Tone.start();

export class Sound {

	eventSystem = inject(EventSystem);
	astro: Astro;
	player: Player;
	synth
	phaser

	constructor() {
		this.phaser = new Tone.Phaser({
			"frequency" : 80,
			"octaves" : 2,
			"baseFrequency" : 100
		}).toMaster();
		this.synth = new Tone.FMSynth({volume: -10}).connect(this.phaser);
		this.synth.triggerAttack("A4", "128n");

		this.eventSystem.listen(Topic.BulletSpawn, data => {
			this.synth.triggerAttack("C4", "8n");
		})

		this.eventSystem.listen(Topic.ReceiveUserId, data => {
			this.player = this.astro.getChildren(Player).find(p => p.userid == data.userid);
		});
	}

	update() {
		if (this.player && this.player.speed) {
			this.synth.setNote(100 * this.player.speed + 80);
			this.phaser.baseFrequency = this.player.speed * 1000 + 100
		}

	}

}
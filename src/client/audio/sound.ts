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
	masterVolume
	engineSound
	filter
	lfo

	constructor() {
		// Master Volume, um Clipping zu vermeiden und globale Kontrolle zu haben
		this.masterVolume = new Tone.Volume(-10).toDestination(); // Start bei -10dB

		this.engineSound = new Tone.Oscillator({
			type: 'sawtooth', // 'sawtooth' oder 'pwm' für einen aggressiveren Sound
			frequency: 40,    // Startfrequenz
		});

		this.filter = new Tone.Filter({
			type: 'lowpass',
			frequency: 1500,
			Q: 1
		});

		this.lfo = new Tone.LFO({
			frequency: 2,     // Wobble-Geschwindigkeit in Hz
			min: 200,
			max: 1500,
			amplitude: 1      // Volle Modulationstiefe initial
		});

		this.engineSound.start();
		this.lfo.start();

		// Audio-Graph verbinden
		this.engineSound.chain(this.filter, this.masterVolume);
		this.lfo.connect(this.filter.frequency); // LFO moduliert die Cutoff-Frequenz des Filters

		this.eventSystem.listen(Topic.BulletSpawn, data => {
			//this.synth.triggerAttack("C4", "8n");
		})

		this.eventSystem.listen(Topic.ReceiveUserId, data => {
			this.player = this.astro.getChildren(Player).find(p => p.userid == data.userid);
		});
	}

	// Hilfsfunktion für Skalierung (ersetzt fehlerhaftes Tone. अबScale)
	scaleValue(value, inMin, inMax, outMin, outMax) {
		return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
	}

	update() {
		const speed = (this.player && this.player.speed ? this.player.speed : 0.00001) *1000;
		const intensity = 0.8; // 0-1



		// 1. Motortonhöhe (Oszillator-Frequenz)
		const enginePitch = this.scaleValue(speed, 0, 100, 40, 100 + intensity * 100);
		this.engineSound.frequency.rampTo(enginePitch, 0.05);

		// 2. Wobble-Rate (LFO-Frequenz)
		const wobbleRate = this.scaleValue(speed, 0, 100, 0.5 + intensity*2, 10 + intensity * 10);
		this.lfo.frequency.rampTo(wobbleRate, 0.05);

		// 3. Wobble-Tiefe & Charakter (LFO Min/Max für Filter-Cutoff)
		const filterCenterFreq = this.scaleValue(speed, 0, 50, 100, 100 + intensity * 50 * speed);
		const wobbleDepthAmount = this.scaleValue(intensity, 0, 1, 50, 100 + speed * 10);

		let lfoMinFreq = Math.max(50, filterCenterFreq - wobbleDepthAmount / 2);
		let lfoMaxFreq = Math.min(8000, filterCenterFreq + wobbleDepthAmount / 2);

		if (lfoMinFreq >= lfoMaxFreq) {
			lfoMaxFreq = lfoMinFreq + 50;
		}
		this.lfo.min = lfoMinFreq;
		this.lfo.max = lfoMaxFreq;

		// 4. Filter-Resonanz (Q)
		const filterQValue = this.scaleValue(intensity, 0, 1, 1, 10 + speed * 0.5);
		this.filter.Q.rampTo(filterQValue, 0.05);


	}

}
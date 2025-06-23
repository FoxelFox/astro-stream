import * as Tone from "tone";
import {EventSystem, Topic} from "../../shared/event-system";
import {inject} from "../../shared/injector";
import {Player} from "../../shared/astro/player";
import {Astro} from "../../shared/astro/astro";

await Tone.start();

export class Sound {

	eventSystem = inject(EventSystem);
	astro: Astro;
	player: Player;
	masterVolume
	engineSound
	filter
	lfo
	ricochetSynth: Tone.Synth
	bulletSynth: Tone.Synth
	explosionSynth: {
		boom: Tone.Synth,
		debris: Tone.NoiseSynth
	}

	constructor() {
		// Master Volume, um Clipping zu vermeiden und globale Kontrolle zu haben
		this.masterVolume = new Tone.Volume(-20).toDestination(); // Start bei -10dB

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

		let noise = new Tone.Noise({type: "brown"})

		this.engineSound.start();
		this.lfo.start();
		noise.start();

		// Audio-Graph verbinden
		this.engineSound.chain(this.filter, this.masterVolume);
		this.lfo.connect(this.filter.frequency); // LFO moduliert die Cutoff-Frequenz des Filters

		this.eventSystem.listen(Topic.BulletSpawn, data => {
			if (!this.bulletSynth) {
				this.bulletSynth = new Tone.Synth({
					oscillator: { type: 'triangle' },
					envelope: { attack: 0.02, decay: 0.5, sustain: 0, release: 0.2 },
					volume: -20
				}).toDestination();

				// The LFO creates the "wobble" effect on the pitch.
				const lfo = new Tone.LFO({
					frequency: "1hz",
					type: "sine",
					min: -100, // Cents to detune down
					max: 100   // Cents to detune up
				}).start();

				lfo.connect(this.bulletSynth.detune);
			}

			try {
				this.bulletSynth.triggerAttackRelease('F3', '0.5n');
			} catch (e) {
				// ignore
			}
		});

		this.eventSystem.listen(Topic.NodeDestroy, data => {

			switch (data.type) {
				case 'Bullet': this.playRicochetSound(); break;
				case 'Astroid': this.playExplosionSound(); break;
			}

		});

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
		const intensity = 0.1; // 0-1

		// 1. Motortonhöhe (Oszillator-Frequenz)
		const enginePitch = this.scaleValue(speed, 0, 100, 40, 100 + intensity * 100);
		this.engineSound.frequency.rampTo(enginePitch, 0.05);

		// 2. Wobble-Rate (LFO-Frequenz)
		const wobbleRate = this.scaleValue(speed, 0, 100, 0.5 + intensity*2, 10 + intensity * 10);
		this.lfo.frequency.rampTo(wobbleRate, 0.05);

		// 3. Wobble-Tiefe & Charakter (LFO Min/Max für Filter-Cutoff)
		const filterCenterFreq = this.scaleValue(speed, 0, 50, 100, 100 + intensity * 50 * speed);
		const wobbleDepthAmount = this.scaleValue(intensity, 0, 1, 50, 50 + speed * 100);

		let lfoMinFreq = Math.max(50, filterCenterFreq - wobbleDepthAmount / 2);
		let lfoMaxFreq = Math.min(16000, filterCenterFreq + wobbleDepthAmount / 2);

		if (lfoMinFreq >= lfoMaxFreq) {
			lfoMaxFreq = lfoMinFreq + 50;
		}
		this.lfo.min = lfoMinFreq;
		this.lfo.max = lfoMaxFreq;

		// 4. Filter-Resonanz (Q)
		const filterQValue = this.scaleValue(intensity, 0, 1, 1, 10 + speed * 0.25);
		this.filter.Q.rampTo(filterQValue, 0.05);


	}

	playDestroySound() {
		const noise = new Tone.NoiseSynth({
			noise: { type: "white" },
			envelope: { attack: 0.005, decay: 0.3, sustain: 0 }
		}).toDestination();
		const crusher = new Tone.BitCrusher(4).toDestination();
		noise.connect(crusher);
		noise.triggerAttackRelease("0.2");
		setTimeout(() => {
			noise.dispose();
			crusher.dispose();
		}, 500);
	}

	playBlobSound() {
		const synth = new Tone.MembraneSynth({
			volume: -30,
			pitchDecay: 0.01,
			octaves: 6,
			oscillator: { type: 'triangle' },
			envelope: { attack: 0.01, decay: 0.5, sustain: 0.01, release: 0.4 }
		}).toDestination();
		const vibrato = new Tone.Vibrato({
			maxDelay: 0.005,
			frequency: 5,
			depth: 0.1,
			type: 'sine'
		}).toDestination();
		synth.connect(vibrato);
		synth.triggerAttackRelease('C2', '8n');
		setTimeout(() => {
			synth.dispose();
			vibrato.dispose();
		}, 1000);
	}

	playRicochetSound() {
		if (!this.ricochetSynth) {
			this.ricochetSynth = new Tone.Synth({
				oscillator: { type: 'square' },
				envelope: { attack: 0.005, decay: 0.2, sustain: 0, release: 0.1 },
				volume: -40
			}).toDestination();
		}

		try {
			const now = Tone.now();
			this.ricochetSynth.triggerAttack('G5', now);
			this.ricochetSynth.frequency.linearRampTo('E6', now + 0.05);
			this.ricochetSynth.frequency.linearRampTo('A4', now + 0.1);
		} catch (e) {
			// fuck it
		}
	}

	playExplosionSound() {

		if (!this.explosionSynth) {
			this.explosionSynth = {
				boom: new Tone.MembraneSynth({
					pitchDecay: 0.05,
					octaves: 2,
					volume: -30,
					oscillator: { type: "sine" },
					envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
				}).toDestination(),
				debris: new Tone.NoiseSynth({
					noise: { type: "brown" },
					volume: -30,
					envelope: { attack: 0.05, decay: 0.5, sustain: 0 }
				}).toDestination()
			};

			const dist = new Tone.Distortion(0.18).toDestination();
			this.explosionSynth.boom.connect(dist);

			const filter = new Tone.AutoFilter("16n.").toDestination().start();
			this.explosionSynth.debris.connect(filter);
		}

		try {
			const now = Tone.now();
			this.explosionSynth.boom.triggerAttackRelease("256n", "8n", now);
			this.explosionSynth.debris.triggerAttackRelease("8n", now + 0.1);
		} catch (e) {
			// ignore it
		}
	}
}
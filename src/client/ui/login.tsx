import {useCallback, useEffect, useRef, useState} from "preact/hooks";
import {GameContext, spawn} from "../main";
import {signal} from "@preact/signals";
import {GPU} from "../graphic/gpu";

export function Counter() {
	const [value, setValue] = useState(0);
	const [isLoggedIn, setLoggedIn] = useState(false);
	const speed = signal(0);

	const astro = useRef<GameContext>(null);

	const start = useCallback(async () => {
		astro.current = await spawn();
		setLoggedIn(true);
	}, [setLoggedIn]);

	useEffect(() => {
		if (astro.current != null) {


			const game = astro.current;

			setInterval(() => {
				// @ts-ignore
				speed.value = game.gpu.camera.target.speed;
			}, 16)

		}

	},[astro.current])

	return (

		<>
			<div>Counter: {value}</div>
			<button onClick={() => setValue(value + 1)}>Increment</button>
			<button onClick={() => setValue(value - 1)}>Decrement</button>
			<button disabled={isLoggedIn} onClick={start}>Start</button>
			<div>{speed}</div>
		</>
	)
}
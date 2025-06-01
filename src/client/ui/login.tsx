import {useCallback, useState} from "preact/hooks";
import {spawn} from "../main";

export function Counter() {
	const [value, setValue] = useState(0);
	const [isLoggedIn, setLoggedIn] = useState(false);

	const start = useCallback(() => {
		spawn();
		setLoggedIn(true);
	}, [setLoggedIn]);

	return (
		<>
			<div>Counter: {value}</div>
			<button onClick={() => setValue(value + 1)}>Increment</button>
			<button onClick={() => setValue(value - 1)}>Decrement</button>
			<button disabled={isLoggedIn} onClick={start}>Start</button>
		</>
	)
}
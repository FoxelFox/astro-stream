const socket = new WebSocket(`ws://${location.hostname}:3001`);

socket.addEventListener("message", event => {
	const update = JSON.parse(event.data);

	console.log(update)

});

socket.onopen = (ev) => {
	console.log('connected', ev)
}

socket.onmessage = (ev) => {
	console.log('message', ev)
}

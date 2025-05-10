import {EventSystem, Topic} from "../../shared/event-system";
import {inject} from "../../shared/injector";
import {Line} from "../../shared/node/2D/line";
import {Node} from "../../shared/node/node";

export class GPU {

	eventSystem = inject(EventSystem);

	lines: Line[] = [];
	linesNeedUpdate: boolean = true;

	constructor() {
		this.eventSystem.listen(Topic.NodeCreate, (node: Node) => {
			switch (node.constructor) {
				case Line: this.addLine(node as Line); return;
			}
		});

		this.eventSystem.listen(Topic.NodeDestroy, (node: Node) => {
			switch (node.constructor) {
				case Line: this.removedLine(node as Line); return;
			}
		});
	}

	update() {
		// update buffers

		if (this.linesNeedUpdate) {
			// update Line buffers
		}


		// draw calls
	}

	addLine(node: Line) {
		this.lines.push(node);
		this.linesNeedUpdate = true;
	}

	removedLine(node: Line) {
		const i = this.lines.indexOf(node);
		this.lines.splice(i, 1);
		this.linesNeedUpdate = true;
	}
}
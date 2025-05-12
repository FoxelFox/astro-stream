import {Line} from "../../shared/node/2D/line";

export class LinePass {

	lines: Line[] = [];
	linesNeedUpdate: boolean = true;



	update() {
		if (this.linesNeedUpdate) {
			// update Line buffers



			this.linesNeedUpdate = false;
		}


		// render
	}


	add(node: Line) {
		this.lines.push(node);
		this.linesNeedUpdate = true;
	}

	remove(node: Line) {
		const i = this.lines.indexOf(node);
		this.lines.splice(i, 1);
		this.linesNeedUpdate = true;
	}


}

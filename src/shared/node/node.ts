export class Node {


	constructor(
		public parent?: Node,
		public children: Array<Node> = []
	) {

	}

	getChildren<T>(constructor: new (...args: any[]) => T): T[] {
		return this.children.filter(c => c instanceof constructor) as T[];
	}
}


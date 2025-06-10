export class Particle {
	particleInstanceByteSize =
		3 * 4 + // position
		1 * 4 + // lifetime
		4 * 4 + // color
		3 * 4 + // velocity
		1 * 4 + // padding
		0;

}
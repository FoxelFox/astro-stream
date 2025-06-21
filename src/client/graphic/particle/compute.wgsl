struct Particle {
	pos: vec2<f32>,
	vel: vec2<f32>,
	col: vec4<f32>
}

@binding(0) @group(0) var<storage, read> particlesA : array<Particle>;
@binding(1) @group(0) var<storage, read_write> particlesB : array<Particle>;
@compute @workgroup_size(64)
fn compute_main(@builtin(global_invocation_id) id : vec3<u32>) {
	particlesB[id.x].pos = particlesA[id.x].pos + particlesA[id.x].vel;
	particlesB[id.x].col = particlesA[id.x].col;
	particlesB[id.x].col.a = max(particlesA[id.x].col.a - 0.02, 0.0);
}
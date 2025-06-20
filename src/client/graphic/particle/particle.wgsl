struct Particle {
	pos: vec2<f32>,
	vel: vec2<f32>
}

struct Camera {
	projection: mat4x4<f32>,
	view: mat4x4<f32>,
}

@binding(0) @group(0) var<storage, read> particlesA : array<Particle>;
@binding(1) @group(0) var<storage, read_write> particlesB : array<Particle>;
@compute @workgroup_size(64)
fn compute_main(@builtin(global_invocation_id) id : vec3<u32>) {
	particlesB[id.x].pos = particlesA[id.x].pos + particlesA[id.x].vel;
}


struct VertexOutput {
	@builtin(position) position : vec4<f32>,
	@location(0) color: vec4<f32>
}

@binding(0) @group(1) var <uniform> camera: Camera;
@vertex
fn vertex_main(
	@builtin(instance_index) instanceIdx : u32,
	@location(0) quad_position : vec2<f32>,
	@location(1) position : vec2<f32>,
    @location(2) velocity : vec2<f32>,
) -> VertexOutput {
	var output : VertexOutput;
	output.position =  camera.projection * vec4<f32>(quad_position + position, 0.0, 1.0);
	output.color = vec4<f32>(velocity, 0.0, 1.0);

	return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
	return vec4(1.0, 1.0, 1.0, 1.0);
}
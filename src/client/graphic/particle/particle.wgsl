

struct Camera {
	projection: mat4x4<f32>,
	view: mat4x4<f32>,
}

struct VertexOutput {
	@builtin(position) position : vec4<f32>,
	@location(0) color: vec4<f32>,
	@location(1) quad_pos : vec2<f32>, // -1..+1
}

@binding(0) @group(0) var <uniform> camera: Camera;

@vertex
fn vertex_main(
	@builtin(instance_index) instanceIdx : u32,
	@location(0) quad_position : vec2<f32>,
	@location(1) position : vec2<f32>,
    @location(2) velocity : vec2<f32>,
    @location(3) color : vec4<f32>,
) -> VertexOutput {
	var output : VertexOutput;
	output.position =  camera.projection * vec4<f32>(quad_position + position, 0.0, 1.0);
	output.color = color;
	output.quad_pos = quad_position.xy;

	return output;
}

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    if (in.color.a == 0.0) {
        discard;
    }

    var color = in.color;
    // Apply a circular particle alpha mask
    color.a = in.color.a * max(1.0 - length(in.quad_pos * 4), 0.0);
	return color;
}
@binding(0) @group(0) var <uniform> camera: mat4x4<f32>;
@binding(1) @group(0) var <storage> matrices: array<mat4x4<f32>>;

struct VertexOutput {
  @builtin(position) position : vec4f,
  @location(0) color: vec4f,
}

@vertex
fn main(
	@location(0) in_vertex_position: vec2<f32>,
	@location(1) vertex_matrix_id: u32,
	@location(2) in_vertex_color: vec4<f32>
) -> VertexOutput {

	let m = matrices[vertex_matrix_id];
	let _c = camera;

	var output : VertexOutput;
	output.position = camera * m * vec4<f32>(in_vertex_position, 0.0, 1.0);
	output.color = in_vertex_color;

	return output;
}
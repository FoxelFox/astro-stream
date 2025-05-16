@binding(0) @group(0) var <uniform> camera: mat4x4<f32>;

@vertex
fn main(@location(0) in_vertex_position: vec2<f32>) -> @builtin(position) vec4<f32> {
	return camera * vec4<f32>(in_vertex_position, 0.0, 1.0);
}
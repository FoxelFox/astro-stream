@fragment
fn main(
	@builtin(position) position : vec4f,
	@location(0) color: vec4f
) -> @location(0) vec4<f32> {
	return color;
}
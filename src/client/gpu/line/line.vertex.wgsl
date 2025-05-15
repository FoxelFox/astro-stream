struct ObjectTransforms {
	transforms: array<mat3x3<f32>>,
}

@group(0) @binding(0) var<storage, read> object_transforms: ObjectTransforms;

struct VertexOutput {
	@builtin(position) position: vec4<f32>,
	@location(0) color: vec4<f32>,
}

@vertex
fn main(
	@location(0) vertex_position: vec2<f32>,// from vertexBuffer
	@builtin(instance_index) object_id: u32 // This is effectively firstInstance from indirect draw command
                                            // because instanceCount in the command is 1.
) -> VertexOutput {
	let transform_matrix = object_transforms.transforms[object_id];
	// Transform (x, y) to (x', y', 1) using mat3x3, then take xy for vec4 position
	let transformed_pos_3d = transform_matrix * vec3<f32>(vertex_position, 1.0);

	var out: VertexOutput;
	out.position = vec4<f32>(transformed_pos_3d.xy, 0.0, 1.0); // z=0, w=1 for 2D rendering

	// Assign color based on object_id for visual distinction
	let colors = array<vec4<f32>, 3>(
		vec4<f32>(1.0, 0.3, 0.3, 1.0), // Red-ish
		vec4<f32>(0.3, 1.0, 0.3, 1.0), // Green-ish
		vec4<f32>(0.3, 0.3, 1.0, 1.0)  // Blue-ish
	);
	out.color = colors[object_id % 3u]; // Cycle through colors if more objects than defined colors
	return out;
}
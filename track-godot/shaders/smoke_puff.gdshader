shader_type spatial;
render_mode blend_mix, depth_draw_never, cull_disabled, unshaded;

uniform float puff_alpha = 0.35;
uniform vec3 smoke_color : source_color = vec3(0.88, 0.90, 0.95);
uniform float sim_time = 0.0;
uniform float seed_offset = 0.0;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
	           mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void vertex() {
	MODELVIEW_MATRIX = VIEW_MATRIX * mat4(
		INV_VIEW_MATRIX[0] * length(MODEL_MATRIX[0].xyz),
		INV_VIEW_MATRIX[1] * length(MODEL_MATRIX[1].xyz),
		INV_VIEW_MATRIX[2] * length(MODEL_MATRIX[2].xyz),
		MODEL_MATRIX[3]
	);
}

void fragment() {
	vec2 p = UV * 2.0 - 1.0;
	float r = length(p);
	// Soft wispy cloudy noise silhouette with per-puff random seed
	float n = noise(UV * 4.2 + vec2(sim_time * 0.25 + seed_offset, -sim_time * 0.38 + seed_offset * 0.7)) * 0.55
	        + noise(UV * 8.6 - vec2(sim_time * 0.45, seed_offset * 1.3)) * 0.32;
	float mask = smoothstep(0.92, 0.16, r + (n - 0.42) * 0.65);
	ALBEDO = smoke_color;
	ALPHA = mask * puff_alpha;
}

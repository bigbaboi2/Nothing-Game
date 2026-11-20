shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;

uniform vec3 core_color : source_color = vec3(1.0, 0.96, 0.72);
uniform vec3 mid_color : source_color = vec3(1.0, 0.58, 0.12);
uniform vec3 outer_color : source_color = vec3(0.95, 0.18, 0.04);
uniform float sim_time = 0.0;
uniform float speed = 5.5;
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
float fbm(vec2 p) {
	float v = 0.0;
	v += 0.55 * noise(p);
	v += 0.30 * noise(p * 2.1 + vec2(1.7, 3.1));
	v += 0.15 * noise(p * 4.3 - vec2(2.3, 1.1));
	return v;
}

void vertex() {
	float h = 1.0 - UV.y;
	VERTEX.x += sin(sim_time * speed * 1.15 + seed_offset + h * 5.2) * 0.18 * h;
}

void fragment() {
	vec2 uv = UV;
	float y = 1.0 - uv.y; // 0 bottom, 1 top
	float x = (uv.x - 0.5) * 2.0;

	float t_off = sim_time * (0.34 + fract(seed_offset * 0.37) * 0.2);
	float turb = fbm(vec2(uv.x * 3.8 + seed_offset * 1.7 + sin(t_off) * 0.24, y * 3.6 - t_off * speed * 0.42));
	float turb2 = noise(vec2(uv.x * 6.0 - seed_offset, y * 5.2 - t_off * speed * 0.6));
	float sway = sin(t_off * 1.7 + y * 3.2 + seed_offset) * 0.12 * y + (turb - 0.5) * 0.48 * y + (turb2 - 0.5) * 0.16 * y;
	float breath = 0.9 + 0.1 * sin(sim_time * 2.3 + seed_offset);
	float shape_w = pow(max(0.0, 1.0 - y), 0.68) * (0.68 + 0.18 * turb) * breath;
	float edge = shape_w * (0.82 + 0.38 * turb2);
	float flame = 1.0 - smoothstep(edge * 0.68, edge * 1.12 + 0.015, abs(x + sway));
	float base_fade = smoothstep(0.0, 0.13, y);
	float tip = y + (turb - 0.5) * 0.2 + sin(t_off * 2.0 + seed_offset) * 0.035;
	flame *= base_fade * (1.0 - smoothstep(0.78, 1.0, tip));

	float rim = smoothstep(0.0, 0.82, abs(x + sway) / max(shape_w, 0.001));
	vec3 col = mix(core_color, mid_color, smoothstep(0.16, 0.72, rim));
	col = mix(col, outer_color, smoothstep(0.68, 1.05, rim));

	ALBEDO = col * 1.8;
	ALPHA = clamp(flame * 0.9, 0.0, 0.82);
}

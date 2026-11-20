shader_type spatial;
render_mode blend_add, depth_draw_never, cull_disabled, unshaded;

uniform vec3 ray_color : source_color = vec3(1.0, 0.76, 0.45);
uniform float ray_opacity = 0.16;
uniform float sim_time = 0.0;

void fragment() {
	float beam = sin(UV.x * 3.14159);
	float vertical = smoothstep(0.0, 0.35, UV.y) * smoothstep(1.0, 0.18, UV.y);
	float shimmer = 0.8 + 0.2 * sin(sim_time * 1.1 + UV.x * 8.0);
	float alpha = pow(beam, 1.8) * vertical * shimmer * ray_opacity;
	ALBEDO = ray_color;
	ALPHA = alpha;
}

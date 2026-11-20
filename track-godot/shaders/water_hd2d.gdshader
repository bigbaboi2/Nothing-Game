shader_type spatial;
render_mode cull_back, depth_draw_opaque;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap;
uniform float sim_time = 0.0;
uniform float reflect_on = 1.0;
uniform float high_quality = 1.0;
uniform vec3 water_deep : source_color = vec3(0.07, 0.19, 0.27);
uniform vec3 water_shallow : source_color = vec3(0.15, 0.35, 0.44);
uniform vec3 glint_color : source_color = vec3(1.0, 0.9, 0.68);

varying vec3 world_pos;

void vertex() {
	world_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec2 wp = world_pos.xz;
	float w1 = sin(wp.x * 2.8 + sim_time * 1.0 + wp.y * 1.3);
	float w2 = cos(wp.y * 3.2 - sim_time * 0.85 + wp.x * 1.1);
	float w3 = sin((wp.x + wp.y) * 5.2 + sim_time * 1.35) * 0.22;
	float ripple = (w1 + w2 + w3) * 0.24;

	vec2 refl_uv = vec2(SCREEN_UV.x + ripple * 0.006, clamp(SCREEN_UV.y - 0.12 + w2 * 0.004, 0.02, 0.98));
	vec3 refl_col = texture(screen_tex, refl_uv).rgb;

	vec3 base_col = mix(water_deep, water_shallow, smoothstep(-0.6, 0.8, ripple));
	float refl_mix = (high_quality > 0.5 ? 0.32 : 0.2) * reflect_on;
	vec3 col = mix(base_col, refl_col * 0.72 + base_col * 0.38, refl_mix);

	// Crisp tiny water sparkles instead of large ovals
	float glint = smoothstep(0.92, 0.995, ripple + 0.32 * sin(wp.x * 13.0 + sim_time * 3.5));
	col += glint_color * glint * 0.3;

	ALBEDO = col;
	NORMAL = normalize(vec3(w1 * 0.08, 1.0, w2 * 0.08));
	ROUGHNESS = high_quality > 0.5 ? 0.28 : 0.42;
	METALLIC = high_quality > 0.5 ? 0.08 : 0.02;
}

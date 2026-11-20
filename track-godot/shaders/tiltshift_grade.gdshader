shader_type canvas_item;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap;
uniform float dof_enabled = 1.0;
uniform float blur_amount = 0.18;
uniform float vignette_strength = 0.09;
uniform float grain_strength = 0.008;
uniform float sim_time = 0.0;

float rand(vec2 co) {
	return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

void fragment() {
	vec2 uv = SCREEN_UV;
	vec3 col = texture(screen_tex, uv).rgb;

	if (dof_enabled > 0.5) {
		float side_distance = abs(uv.x - 0.5) * 2.0;
		float side_blur = smoothstep(0.62, 1.0, side_distance);
		float top_blur = 1.0 - smoothstep(0.03, 0.38, uv.y);
		float lower_edge_blur = smoothstep(0.94, 1.0, uv.y) * 0.22;
		float coc = max(max(side_blur, top_blur), lower_edge_blur) * blur_amount;
		if (coc > 0.01) {
			vec2 texel = SCREEN_PIXEL_SIZE * (coc * 8.5);
			vec2 taps[12] = vec2[](
				vec2(1.0, 0.0), vec2(0.86, 0.5), vec2(0.5, 0.86),
				vec2(0.0, 1.0), vec2(-0.5, 0.86), vec2(-0.86, 0.5),
				vec2(-1.0, 0.0), vec2(-0.86, -0.5), vec2(-0.5, -0.86),
				vec2(0.0, -1.0), vec2(0.5, -0.86), vec2(0.86, -0.5)
			);
			vec3 acc = col;
			float w_sum = 1.0;
			for (int i = 0; i < 12; i++) {
				vec3 s1 = texture(screen_tex, clamp(uv + taps[i] * texel, vec2(0.001), vec2(0.999))).rgb;
				vec3 s2 = texture(screen_tex, clamp(uv + taps[i] * texel * 0.5, vec2(0.001), vec2(0.999))).rgb;
				float w1 = 1.0 + dot(s1, vec3(0.299, 0.587, 0.114)) * 0.6;
				float w2 = 1.0 + dot(s2, vec3(0.299, 0.587, 0.114)) * 0.4;
				acc += s1 * w1 + s2 * w2;
				w_sum += w1 + w2;
			}
			col = acc / w_sum;
		}
	}

	vec2 d = uv - 0.5;
	float vig = 1.0 - dot(d, d) * vignette_strength * 2.2;
	col *= clamp(vig, 0.55, 1.0);
	col += (rand(uv * 512.0 + fract(sim_time)) - 0.5) * grain_strength;

	COLOR = vec4(clamp(col, 0.0, 1.0), 1.0);
}

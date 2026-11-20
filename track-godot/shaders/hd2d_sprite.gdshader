shader_type spatial;
render_mode cull_disabled, depth_draw_opaque;

uniform sampler2D albedo_tex : source_color, filter_nearest, repeat_disable;
uniform sampler2D normal_tex : hint_normal, filter_nearest, repeat_disable;
uniform sampler2D emissive_tex : source_color, filter_nearest, repeat_disable;
uniform bool has_emissive = false;
uniform float emissive_scale = 1.45;
uniform float sway_amount = 0.0;
uniform float sway_phase = 0.0;
uniform float billboard_y = 1.0;
uniform float rim_strength = 0.28;
uniform float sim_time = 0.0;
uniform bool walking = false;
uniform float walk_phase = 0.0;

void vertex() {
	float height_factor = pow(1.0 - UV.y, 1.3);
	float sway = sin(sim_time * 1.9 + sway_phase + VERTEX.y * 0.6) * sway_amount * height_factor;
	VERTEX.x += sway;

	if (billboard_y > 0.5) {
		mat4 mv = VIEW_MATRIX * mat4(
			vec4(normalize(INV_VIEW_MATRIX[0].xyz) * length(MODEL_MATRIX[0].xyz), 0.0),
			vec4(0.0, length(MODEL_MATRIX[1].xyz), 0.0, 0.0),
			vec4(normalize(INV_VIEW_MATRIX[2].xyz) * length(MODEL_MATRIX[2].xyz), 0.0),
			MODEL_MATRIX[3]
		);
		MODELVIEW_MATRIX = mv;
		MODELVIEW_NORMAL_MATRIX = mat3(MODELVIEW_MATRIX);
	}
}

void fragment() {
	vec2 sprite_uv = UV;
	if (walking && UV.y > 0.80 && UV.y < 0.96) {
		float stride = sin(walk_phase * 6.28318) >= 0.0 ? 1.0 : -1.0;
		float pixel_step = 1.0 / 40.0;
		sprite_uv.x += (UV.x < 0.5 ? -stride : stride) * pixel_step;
	}
	vec4 tex = texture(albedo_tex, sprite_uv);
	if (tex.a < 0.5) {
		discard;
	}
	ALBEDO = tex.rgb;
	NORMAL_MAP = texture(normal_tex, sprite_uv).rgb;
	NORMAL_MAP_DEPTH = 0.75;
	ROUGHNESS = 0.85;
	METALLIC = 0.0;
	ALPHA_SCISSOR_THRESHOLD = 0.5;

	float rim = pow(1.0 - clamp(dot(NORMAL, VIEW), 0.0, 1.0), 2.5) * rim_strength;
	vec3 em = vec3(0.0);
	if (has_emissive) {
		vec4 em_tex = texture(emissive_tex, sprite_uv);
		if (em_tex.a > 0.1) {
			em += em_tex.rgb * emissive_scale;
		}
	}
	EMISSION = em + tex.rgb * rim;
}

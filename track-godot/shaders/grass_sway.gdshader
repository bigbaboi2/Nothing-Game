shader_type spatial;
render_mode cull_disabled, depth_draw_opaque;

uniform sampler2D albedo_tex : source_color, filter_linear_mipmap, repeat_disable;
uniform float sim_time = 0.0;
uniform float wind_strength = 0.14;
uniform vec3 season_tint : source_color = vec3(1.0, 1.0, 1.0);

void vertex() {
	vec3 world_origin = (MODEL_MATRIX * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
	float h_factor = pow(1.0 - UV.y, 1.4);
	float wave = sin(sim_time * 2.4 + world_origin.x * 0.65 + world_origin.z * 0.45) * wind_strength * h_factor;
	VERTEX.x += wave;

	// Cylindrical Y-billboard preserving instance scale
	mat4 mv = VIEW_MATRIX * mat4(
		vec4(normalize(INV_VIEW_MATRIX[0].xyz) * length(MODEL_MATRIX[0].xyz), 0.0),
		vec4(0.0, length(MODEL_MATRIX[1].xyz), 0.0, 0.0),
		vec4(normalize(INV_VIEW_MATRIX[2].xyz) * length(MODEL_MATRIX[2].xyz), 0.0),
		MODEL_MATRIX[3]
	);
	MODELVIEW_MATRIX = mv;
	MODELVIEW_NORMAL_MATRIX = mat3(MODELVIEW_MATRIX);
}

void fragment() {
	vec4 tex = texture(albedo_tex, UV);
	if (tex.a < 0.5) discard;
	ALBEDO = tex.rgb * COLOR.rgb * season_tint;
	ROUGHNESS = 0.88;
	ALPHA_SCISSOR_THRESHOLD = 0.5;
}

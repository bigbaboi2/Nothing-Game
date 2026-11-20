extends Node3D

const PIXELS_PER_UNIT := 16.0
const HERO_SCALE := 0.65
const WorldBuilders = preload("res://scripts/world_builders.gd")

var sprite_shader: Shader = preload("res://shaders/hd2d_sprite.gdshader")
var water_shader: Shader = preload("res://shaders/water_hd2d.gdshader")
var post_shader: Shader = preload("res://shaders/tiltshift_grade.gdshader")
var godray_shader: Shader = preload("res://shaders/godray.gdshader")
var grass_shader: Shader = preload("res://shaders/grass_sway.gdshader")
var smoke_shader: Shader = preload("res://shaders/smoke_puff.gdshader")
var fire_shader: Shader = preload("res://shaders/fire_flame.gdshader")

var tex_cache := {}
var winter_canopy_cache := {}
var canopy_normal_cache := {}
var sprite_mats: Array[ShaderMaterial] = []
var water_mat: ShaderMaterial
var post_mat: ShaderMaterial
var grass_mat: StandardMaterial3D
var grass_normal_tex: Texture2D
var roof_mats: Array[StandardMaterial3D] = []
var tree_leaf_mats: Array[StandardMaterial3D] = []
var tree_roots: Array[Node3D] = []
var forest_far_roots: Array[Node3D] = []
var grass_layer_nodes: Array[MultiMeshInstance3D] = []
var snow_tint_mats: Array[StandardMaterial3D] = []
var env: Environment
var sky_mat: ProceduralSkyMaterial
var sun_light: DirectionalLight3D
var point_lights: Array[OmniLight3D] = []
var point_base_energies: Array[float] = []

var player: CharacterBody3D
var player_sprite: MeshInstance3D
var player_mat: ShaderMaterial
var player_light: OmniLight3D
var facing_dir := Vector3(0.0, 0.0, 1.0)
var walk_t := 0.0

var cam_pivot: Node3D
var cam: Camera3D
var cam_yaw := 0.0
var cam_pitch := -19.0
var cam_dist := 47.0
var dragging := false
var settings_panel: PanelContainer

var grass_mats: Array[ShaderMaterial] = []
var smoke_mats: Array[ShaderMaterial] = []
var fire_mats: Array[ShaderMaterial] = []
var ray_mat: ShaderMaterial
var ray_group: Node3D
var leaf_nodes: Array[MeshInstance3D] = []
var snow_nodes: Array[MeshInstance3D] = []
var ground_leaf_mm: MultiMesh
var ground_leaf_mmi: MultiMeshInstance3D
var ground_leaf_idx := 0
const MAX_GROUND_LEAVES := 280
var firefly_nodes: Array[MeshInstance3D] = []
var ember_nodes: Array[MeshInstance3D] = []
var smoke_nodes: Array[MeshInstance3D] = []
var hud_label: Label
var water_high_quality := true
var forest_quality := 2

var time_of_day := "day"
var season := "spring"
var weather := "clear"
var fx_bloom := true
var fx_dof := true
var fx_volumetric := true
var fx_reflection := true
var sim_time := 2.5
var shots_mode := false

const TIME_PRESETS := {
	"dawn": {
		"sun_rot": Vector3(-24.0, -45.0, 0.0), "sun_col": Color("#ffe2bd"), "sun_energy": 2.25,
		"amb_col": Color("#757ca8"), "amb_energy": 0.68, "sky_top": Color("#4a669c"),
		"sky_horizon": Color("#f5c29b"), "fog_col": Color("#9ca6c4"), "fog_on": true, "fog_dens": 0.0028,
		"vfog_on": true, "vfog_dens": 0.004, "ray_op": 0.08, "glow_thresh": 1.05, "point_scale": 0.65, "emissive_scale": 0.75,
	},
	"day": {
		"sun_rot": Vector3(-52.0, 142.0, 0.0), "sun_col": Color("#fff5dc"), "sun_energy": 2.15,
		"amb_col": Color("#a5b79a"), "amb_energy": 0.68, "sky_top": Color("#4b82aa"),
		"sky_horizon": Color("#d5dfbd"), "fog_col": Color("#becdae"), "fog_on": true, "fog_dens": 0.0018,
		"vfog_on": true, "vfog_dens": 0.0025, "ray_op": 0.055, "glow_thresh": 1.1, "point_scale": 0.18, "emissive_scale": 0.28,
	},
	"dusk": {
		"sun_rot": Vector3(-24.0, 138.0, 0.0), "sun_col": Color("#ff9f59"), "sun_energy": 1.65,
		"amb_col": Color("#3b4378"), "amb_energy": 0.68, "sky_top": Color("#141326"),
		"sky_horizon": Color("#eda879"), "fog_col": Color("#3c3259"), "fog_on": true, "fog_dens": 0.007,
		"vfog_on": true, "vfog_dens": 0.009, "ray_op": 0.13, "glow_thresh": 0.88, "point_scale": 1.25, "emissive_scale": 1.35,
	},
	"night": {
		"sun_rot": Vector3(-38.0, -35.0, 0.0), "sun_col": Color("#7da4eb"), "sun_energy": 0.8,
		"amb_col": Color("#1b2245"), "amb_energy": 0.48, "sky_top": Color("#090b1a"),
		"sky_horizon": Color("#27355c"), "fog_col": Color("#13172e"), "fog_on": true, "fog_dens": 0.010,
		"vfog_on": true, "vfog_dens": 0.011, "ray_op": 0.09, "glow_thresh": 0.85, "point_scale": 1.55, "emissive_scale": 1.75,
	},
}

func _load_tex(rel_path: String) -> ImageTexture:
	if tex_cache.has(rel_path):
		return tex_cache[rel_path]
	var img: Image
	if rel_path.ends_with(".svg"):
		img = Image.new()
		var svg_text := FileAccess.get_file_as_string("res://" + rel_path)
		var svg_error := img.load_svg_from_string(svg_text, 2.0)
		if svg_error != OK:
			push_error("Cannot rasterize SVG texture: " + rel_path)
			return null
	else:
		var abs_path := ProjectSettings.globalize_path("res://" + rel_path)
		img = Image.load_from_file(abs_path)
	if img and not img.is_empty():
		img.generate_mipmaps()
	var tex := ImageTexture.create_from_image(img)
	tex_cache[rel_path] = tex
	return tex

func _make_winter_canopy(source: Texture2D) -> Texture2D:
	var key := source.get_instance_id()
	if winter_canopy_cache.has(key):
		return winter_canopy_cache[key]
	var img := source.get_image()
	if img == null or img.is_empty():
		return source
	for y in range(img.get_height()):
		for x in range(img.get_width()):
			var px := img.get_pixel(x, y)
			if px.a <= 0.05:
				continue
			var lum := pow(clamp(px.get_luminance(), 0.0, 1.0), 0.72)
			var snow := Color("#75899f").lerp(Color("#e6eced"), lum)
			if lum > 0.68:
				snow = snow.lerp(Color("#f4ebd8"), (lum - 0.68) * 1.8)
			snow.a = px.a
			img.set_pixel(x, y, snow)
	img.generate_mipmaps()
	var texture := ImageTexture.create_from_image(img)
	winter_canopy_cache[key] = texture
	return texture

func _make_canopy_normal(source: Texture2D) -> Texture2D:
	var key := source.get_instance_id()
	if canopy_normal_cache.has(key):
		return canopy_normal_cache[key]
	var color_img := source.get_image()
	if color_img == null or color_img.is_empty():
		return source
	var normal_img := Image.create(color_img.get_width(), color_img.get_height(), false, Image.FORMAT_RGBA8)
	var w := color_img.get_width()
	var h := color_img.get_height()
	for y in range(h):
		for x in range(w):
			if color_img.get_pixel(x, y).a < 0.02:
				normal_img.set_pixel(x, y, Color(0.5, 0.5, 1.0, 1.0))
				continue
			var xl := maxi(0, x - 1); var xr := mini(w - 1, x + 1)
			var yu := maxi(0, y - 1); var yd := mini(h - 1, y + 1)
			var dx := color_img.get_pixel(xr, y).get_luminance() - color_img.get_pixel(xl, y).get_luminance()
			var dy := color_img.get_pixel(x, yd).get_luminance() - color_img.get_pixel(x, yu).get_luminance()
			var n := Vector3(-dx * 1.8, -dy * 1.8, 1.0).normalized()
			normal_img.set_pixel(x, y, Color(n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, n.z * 0.5 + 0.5, 1.0))
	var texture := ImageTexture.create_from_image(normal_img)
	canopy_normal_cache[key] = texture
	return texture

func _ready() -> void:
	for arg in OS.get_cmdline_user_args():
		if arg == "--shots":
			shots_mode = true
	_build_environment()
	_build_ground_and_water()
	_build_3d_world()
	_build_player()
	_build_lights()
	_build_atmosphere()
	_build_post_and_hud()
	_apply_state()

	if shots_mode:
		call_deferred("_run_shots")

func _build_environment() -> void:
	cam_pivot = Node3D.new()
	cam_pivot.position = Vector3(0.0, 1.4, 1.5)
	add_child(cam_pivot)

	cam = Camera3D.new()
	cam.fov = 39.0
	cam.near = 0.5
	cam.far = 180.0
	cam_pivot.add_child(cam)

	sky_mat = ProceduralSkyMaterial.new()
	sky_mat.sky_curve = 0.25
	sky_mat.ground_bottom_color = Color("#1e1c33")
	sky_mat.ground_horizon_color = Color("#3c3259")
	var sky := Sky.new()
	sky.sky_material = sky_mat

	env = Environment.new()
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.glow_enabled = true
	env.glow_hdr_threshold = 1.05
	env.glow_intensity = 0.38
	env.glow_bloom = 0.08
	env.fog_enabled = true
	env.fog_density = 0.011
	env.volumetric_fog_enabled = true
	env.volumetric_fog_density = 0.004
	env.volumetric_fog_albedo = Color("#a5c5ae")
	env.ssr_enabled = true
	env.ssr_max_steps = 64
	env.ssr_fade_in = 0.15
	env.ssr_fade_out = 2.0
	env.ssr_depth_tolerance = 0.25

	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

	sun_light = DirectionalLight3D.new()
	sun_light.shadow_enabled = true
	sun_light.directional_shadow_max_distance = 75.0
	add_child(sun_light)

func _build_ground_and_water() -> void:
	var grass := MeshInstance3D.new()
	var gm := PlaneMesh.new()
	gm.size = Vector2(500.0, 500.0)
	grass.mesh = gm
	grass_mat = StandardMaterial3D.new()
	grass_mat.albedo_texture = _load_tex("assets/sprites/ground_grass.png")
	grass_mat.normal_enabled = true
	grass_normal_tex = _load_tex("assets/sprites/ground_grass_n.png")
	grass_mat.normal_texture = grass_normal_tex
	grass_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	grass_mat.uv1_scale = Vector3(70.0, 70.0, 1.0)
	grass_mat.roughness = 0.92
	grass.material_override = grass_mat
	grass.position = Vector3(0.0, 0.0, -2.0)
	add_child(grass)

	var stone_mat := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/ground_cobble.png"), _load_tex("assets/sprites/ground_cobble_n.png"))

	# Curving packed-earth path from camp to the central gathering place.
	var dirt_mat := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/ground_dirt.png"), _load_tex("assets/sprites/ground_dirt_n.png"))
	WorldBuilders.add_path_strip(self, [
		Vector3(-1.5, 0.025, 4.6), Vector3(-2.4, 0.025, 2.0), Vector3(-1.5, 0.025, 0.0),
		Vector3(0.3, 0.025, -1.8), Vector3(0.4, 0.025, -3.2),
	], 3.1, dirt_mat)

	water_mat = ShaderMaterial.new()
	water_mat.shader = water_shader

func _build_3d_world() -> void:
	var wall_mat := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/tex_wall_timber.png"), _load_tex("assets/sprites/tex_wall_timber_n.png"))
	var roof_terra := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/tex_roof_terracotta.png"), _load_tex("assets/sprites/tex_roof_terracotta_n.png"))
	var roof_slate := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/tex_roof_slate.png"), _load_tex("assets/sprites/tex_roof_slate_n.png"))
	var stone_mat := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/ground_cobble.png"), _load_tex("assets/sprites/ground_cobble_n.png"))
	var wood_mat := WorldBuilders.make_solid_mat(Color("#543636"), 0.88)
	var iron_mat := WorldBuilders.make_solid_mat(Color("#282b3b"), 0.6)
	var canvas_mat := WorldBuilders.make_solid_mat(Color("#d9c8b4"), 0.92)
	snow_tint_mats.append(canvas_mat)

	var w_tex := _load_tex("assets/sprites/tex_window_glow.png")
	var w_norm := _load_tex("assets/sprites/tex_window_glow_n.png")
	var w_em := _load_tex("assets/sprites/tex_window_glow_e.png")

	# Detailed 3D Houses
	WorldBuilders.build_detailed_house(self, Vector3(-11.2, 0.0, -4.5), Vector3(7.6, 5.4, 5.8), 0.1, wall_mat, roof_terra, stone_mat, wood_mat, sprite_shader, w_tex, w_norm, w_em, sprite_mats, roof_mats, true)
	WorldBuilders.build_detailed_house(self, Vector3(10.4, 0.0, -5.8), Vector3(6.4, 4.8, 5.2), -0.14, wall_mat, roof_slate, stone_mat, wood_mat, sprite_shader, w_tex, w_norm, w_em, sprite_mats, roof_mats, false)
	WorldBuilders.build_detailed_house(self, Vector3(-16.5, 0.0, -13.6), Vector3(5.4, 4.0, 4.6), 0.22, wall_mat, roof_slate, stone_mat, wood_mat, sprite_shader, w_tex, w_norm, w_em, sprite_mats, roof_mats, false)
	WorldBuilders.build_detailed_house(self, Vector3(16.2, 0.0, -14.0), Vector3(5.6, 4.0, 4.6), -0.2, wall_mat, roof_terra, stone_mat, wood_mat, sprite_shader, w_tex, w_norm, w_em, sprite_mats, roof_mats, false)

	var rng := RandomNumberGenerator.new()
	rng.seed = 4242
	var dirt_mat := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/ground_dirt.png"), _load_tex("assets/sprites/ground_dirt_n.png"))
	# 3D Canvas Tents + Glowing Shrine Plaza (with Blue Spirit Flames) + Pond + Banner
	WorldBuilders.build_3d_tent(self, Vector3(-15.8, 0.0, 3.5), 0.35, canvas_mat, wood_mat)
	WorldBuilders.build_3d_tent(self, Vector3(-17.1, 0.0, 7.0), -0.25, canvas_mat, wood_mat)
	WorldBuilders.build_3d_shrine_plaza(self, Vector3(0.4, 0.0, -3.2), stone_mat, point_lights, point_base_energies, fire_shader, fire_mats)
	WorldBuilders.build_crimson_banner(self, Vector3(-4.8, 0.0, -2.2), wood_mat)
	WorldBuilders.build_pond_with_reeds(self, Vector3(-3.8, 0.0, 11.0), water_mat, _load_tex("assets/sprites/reeds.png"), _load_tex("assets/sprites/grass_tall.png"), dirt_mat, rng)

	# 3D Wooden Cart, Fences, Stone Lanterns
	WorldBuilders.build_3d_cart_and_props(self, wood_mat, iron_mat, stone_mat)

	# Painterly 3D Volumetric Trees (Rough Bark + Towering Ancient Oaks + Diverse Sizes!)
	var bark_mat := WorldBuilders.make_pixel_mat(_load_tex("assets/sprites/tex_bark.png"), _load_tex("assets/sprites/tex_bark_n.png"), Vector3(0.4, 0.4, 0.4), 0.94)
	var tree_canopy_layers: Array[Texture2D] = [
		_load_tex("assets/sprites/tree_paint_shadow.png"),
		_load_tex("assets/sprites/tree_paint_base.png"),
		_load_tex("assets/sprites/tree_paint_mid.png"),
		_load_tex("assets/sprites/tree_paint_clump.png"),
		_load_tex("assets/sprites/tree_paint_sun.png"),
	]
	for td in [
		[Vector3(-3.0, 0.0, -9.5), 2.05, Color(0.94, 1.0, 0.9)],
		[Vector3(5.8, 0.0, -10.4), 1.75, Color(1.0, 1.03, 0.92)],
		[Vector3(14.0, 0.0, -2.5), 1.45, Color(1.04, 0.94, 0.82)],
		[Vector3(-18.0, 0.0, -5.8), 1.35, Color(1.02, 0.93, 0.84)],
		[Vector3(-13.8, 0.0, -9.5), 1.25, Color(1.0, 0.92, 0.96)],
		[Vector3(14.5, 0.0, -10.2), 1.85, Color(0.96, 1.02, 0.88)],
		[Vector3(-21.0, 0.0, -4.0), 1.9, Color(0.93, 0.98, 0.87)],
		[Vector3(20.5, 0.0, -5.0), 1.65, Color(1.02, 0.93, 0.82)],
		[Vector3(-19.5, 0.0, -1.8), 1.15, Color(1.0, 0.92, 0.96)],
		[Vector3(1.5, 0.0, -16.0), 2.15, Color(0.94, 1.02, 0.88)],
	]:
		tree_roots.append(WorldBuilders.build_3d_tree(self, td[0], td[1], bark_mat, tree_canopy_layers, td[2], rng, tree_leaf_mats))
	# Near-camera framing trees sit beyond the walkable village edges.
	for td in [[Vector3(-28.0, 0.0, 9.0), 2.0, Color(0.9, 0.98, 0.87)], [Vector3(29.0, 0.0, 10.0), 2.15, Color(0.96, 1.0, 0.88)]]:
		tree_roots.append(WorldBuilders.build_3d_tree(self, td[0], td[1], bark_mat, tree_canopy_layers, td[2], rng, tree_leaf_mats))
	# A broader ring of mixed woodland closes the horizon around the village clearing.
	for td in [
		[Vector3(-30.0, 0.0, -22.0), 1.55, Color(0.96, 1.0, 0.9)],
		[Vector3(-23.0, 0.0, -25.0), 1.25, Color(1.0, 0.92, 0.96)],
		[Vector3(-15.0, 0.0, -28.0), 1.45, Color(0.95, 1.0, 0.86)],
		[Vector3(-6.0, 0.0, -26.0), 1.2, Color(1.03, 0.96, 0.85)],
		[Vector3(6.0, 0.0, -29.0), 1.55, Color(0.96, 1.0, 0.87)],
		[Vector3(17.0, 0.0, -27.0), 1.25, Color(1.0, 0.94, 0.96)],
		[Vector3(27.0, 0.0, -24.0), 1.6, Color(0.92, 0.99, 0.86)],
		[Vector3(-31.0, 0.0, -9.0), 1.3, Color(1.02, 0.94, 0.84)],
		[Vector3(-32.0, 0.0, 4.0), 1.5, Color(0.95, 1.0, 0.9)],
		[Vector3(-29.0, 0.0, 17.0), 1.35, Color(1.0, 0.91, 0.96)],
		[Vector3(31.0, 0.0, -8.0), 1.35, Color(0.92, 0.99, 0.86)],
		[Vector3(32.0, 0.0, 5.0), 1.55, Color(1.03, 0.95, 0.84)],
		[Vector3(29.0, 0.0, 17.0), 1.3, Color(0.98, 1.0, 0.9)],
	]:
		var far_tree := WorldBuilders.build_3d_tree(self, td[0], td[1], bark_mat, tree_canopy_layers, td[2], rng, tree_leaf_mats)
		tree_roots.append(far_tree)
		forest_far_roots.append(far_tree)

	# A clear central floor keeps the hero and plaza readable; layered meadow frames the glade.
	_spawn_flora_layer("assets/sprites/grass_tall.png", 8200, Vector2(0.72, 0.88), rng, Color(0.88, 1.0, 0.78))
	_spawn_flora_layer("assets/sprites/grass_wheat.png", 4000, Vector2(0.72, 1.0), rng, Color(1.0, 0.96, 0.78))
	_spawn_flora_layer("assets/sprites/grass_fern.png", 2250, Vector2(0.88, 0.72), rng, Color(0.84, 1.0, 0.78))
	_spawn_flora_layer("assets/sprites/grass_tuft.png", 3200, Vector2(0.78, 0.64), rng, Color(0.72, 0.95, 0.68))
	_spawn_flora_layer("assets/sprites/flower_red.png", 1900, Vector2(0.72, 0.82), rng, Color(1.0, 0.96, 0.9))
	_spawn_flora_layer("assets/sprites/flower_mix.png", 2300, Vector2(0.72, 0.82), rng, Color(1.0, 0.98, 0.92))

	# Cozy Campfire with Stone Ring, Crossed Logs & 3D Turbulent FBM Flame Cluster
	for i in range(8):
		var ang := float(i) / 8.0 * TAU
		WorldBuilders.add_box(self, Vector3(0.32, 0.22, 0.32), Vector3(-6.6 + cos(ang) * 0.55, 0.11, 4.9 + sin(ang) * 0.55), stone_mat)
	WorldBuilders.add_box(self, Vector3(0.95, 0.16, 0.18), Vector3(-6.6, 0.12, 4.9), wood_mat, Vector3(0, 35, 12))
	WorldBuilders.add_box(self, Vector3(0.95, 0.16, 0.18), Vector3(-6.6, 0.12, 4.9), wood_mat, Vector3(0, -45, -12))
	WorldBuilders.spawn_3d_flame_cluster(self, Vector3(-6.6, 0.85, 4.9), Vector2(1.05, 1.5), Color("#fff4c4"), Color("#ff9b43"), Color("#cf4b21"), fire_shader, fire_mats)
	var fire_light := OmniLight3D.new()
	fire_light.position = Vector3(-6.6, 0.8, 4.9)
	fire_light.light_color = Color("#ff8c2e")
	fire_light.omni_range = 5.5
	fire_light.light_energy = 1.8
	add_child(fire_light)
	point_lights.append(fire_light)
	point_base_energies.append(1.8)

	# Props & Bushes
	_add_sprite("bench", 48, 24, Vector3(-3.7, 0.0, 1.2))
	_add_sprite("barrel", 24, 28, Vector3(-8.0, 0.0, 1.0))
	_add_sprite("crate", 28, 24, Vector3(-7.0, 0.0, 1.1))
	_add_sprite("signpost", 24, 40, Vector3(4.4, 0.0, 0.7))
	_add_sprite("bush_pink", 48, 36, Vector3(-16.0, 0.0, 7.6), {"sway": 0.12, "phase": 0.3})
	_add_sprite("bush_gold", 48, 36, Vector3(-5.6, 0.0, 9.4), {"sway": 0.12, "phase": 1.4})
	_add_sprite("bush_pink", 48, 36, Vector3(15.5, 0.0, 7.2), {"sway": 0.12, "phase": 2.1})
	var pine_tex := _load_tex("assets/sprites/tree_pine.png")
	for p in [
		[Vector3(-18, 0, -12), 1.2], [Vector3(-14, 0, -16), 1.4], [Vector3(-11, 0, -14), 1.1],
		[Vector3(-8, 0, -17), 1.5], [Vector3(-5.5, 0, -15), 1.15], [Vector3(-1, 0, -18), 1.35],
		[Vector3(4.5, 0, -14.5), 1.2], [Vector3(8, 0, -17), 1.45], [Vector3(10.5, 0, -13.5), 1.1],
		[Vector3(14, 0, -16), 1.35], [Vector3(18, 0, -13), 1.25],
	]:
		WorldBuilders.build_3d_pine(self, p[0], p[1], pine_tex, tree_leaf_mats)
	for p in [
		[Vector3(-25.0, 0.0, -5.0), 1.2], [Vector3(25.0, 0.0, -6.0), 1.15],
		[Vector3(-26.0, 0.0, 6.0), 1.1], [Vector3(27.0, 0.0, 9.0), 1.3],
	]:
		WorldBuilders.build_3d_pine(self, p[0], p[1], pine_tex, tree_leaf_mats)

func _spawn_flora_layer(tex_path: String, count: int, quad_size: Vector2, rng: RandomNumberGenerator, tint: Color) -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.instance_count = count
	var qm := QuadMesh.new()
	qm.size = quad_size
	mm.mesh = qm
	var mat := ShaderMaterial.new()
	mat.shader = grass_shader
	mat.set_shader_parameter("albedo_tex", _load_tex(tex_path))
	grass_mats.append(mat)
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	mmi.material_override = mat
	var placed := 0
	for i in range(count):
		var gx := rng.randf_range(-46.0, 46.0)
		var gz := rng.randf_range(-38.0, 36.0)
		var path_x := 2.0 - gz * 0.45
		if abs(gx - path_x) < 2.7 and gz > -7.5 and gz < 8.5: continue # open approach path
		if Vector2(gx - 0.4, gz + 3.2).length() < 7.6: continue # plaza and walkable clearing
		if Vector2(gx + 3.8, gz - 11.0).length() < 5.4: continue # irregular pond and its bank
		if gx > -20.0 and gx < -13.0 and gz > 1.0 and gz < 9.0: continue # dry tent clearing
		var height_scale := rng.randf_range(0.55, 1.75)
		var width_scale := rng.randf_range(0.62, 1.45)
		var transform_basis := Basis().rotated(Vector3.UP, rng.randf_range(0.0, TAU)).scaled(Vector3(width_scale, height_scale, 1.0))
		var t := Transform3D(transform_basis, Vector3(gx, quad_size.y * height_scale * 0.45, gz))
		mm.set_instance_transform(placed, t)
		var color_variation := Color(rng.randf_range(0.84, 1.18), rng.randf_range(0.86, 1.16), rng.randf_range(0.78, 1.18))
		mm.set_instance_color(placed, tint * color_variation)
		placed += 1
	mm.visible_instance_count = placed
	mmi.set_meta("full_visible_count", placed)
	add_child(mmi)
	grass_layer_nodes.append(mmi)
	_apply_forest_quality()

func _apply_forest_quality() -> void:
	var visibility_ratio: float = [0.34, 0.64, 1.0][forest_quality]
	sun_light.shadow_enabled = forest_quality > 0
	env.volumetric_fog_enabled = forest_quality > 0 and fx_volumetric and TIME_PRESETS[time_of_day]["vfog_on"]
	env.ssr_enabled = forest_quality > 0 and water_high_quality
	for layer in grass_layer_nodes:
		if layer.multimesh:
			layer.multimesh.visible_instance_count = int(float(layer.get_meta("full_visible_count", layer.multimesh.instance_count)) * visibility_ratio)
	for tree in forest_far_roots:
		tree.visible = forest_quality > 0

func _build_player() -> void:
	player = CharacterBody3D.new()
	player.position = Vector3(-1.5, 0.0, 2.4)
	add_child(player)

	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.35; cap.height = 1.4
	col.shape = cap; col.position = Vector3(0.0, 0.7, 0.0)
	player.add_child(col)

	var qm := QuadMesh.new()
	qm.size = Vector2((40.0 / PIXELS_PER_UNIT) * HERO_SCALE, (48.0 / PIXELS_PER_UNIT) * HERO_SCALE)
	player_mat = ShaderMaterial.new()
	player_mat.shader = sprite_shader
	player_mat.set_shader_parameter("albedo_tex", _load_tex("assets/sprites/chibi_hero.png"))
	player_mat.set_shader_parameter("normal_tex", _load_tex("assets/sprites/chibi_hero_n.png"))
	player_mat.set_shader_parameter("has_emissive", true)
	player_mat.set_shader_parameter("emissive_tex", _load_tex("assets/sprites/chibi_hero_e.png"))
	player_mat.set_shader_parameter("billboard_y", 1.0)
	player_mat.set_shader_parameter("rim_strength", 0.22)
	player_mat.set_shader_parameter("walking", false)
	player_mat.set_shader_parameter("walk_phase", 0.0)
	sprite_mats.append(player_mat)

	player_sprite = MeshInstance3D.new()
	player_sprite.mesh = qm
	player_sprite.material_override = player_mat
	player_sprite.position = Vector3(0.0, 1.5 * HERO_SCALE, 0.0)
	player_sprite.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	player.add_child(player_sprite)

	# Grounded soft contact shadow under character
	var shadow_disc := MeshInstance3D.new()
	var sdm := CylinderMesh.new()
	sdm.top_radius = 0.45; sdm.bottom_radius = 0.45; sdm.height = 0.02; sdm.radial_segments = 14
	shadow_disc.mesh = sdm
	var s_mat := StandardMaterial3D.new()
	s_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	s_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	s_mat.albedo_color = Color(0.05, 0.05, 0.12, 0.48)
	shadow_disc.material_override = s_mat
	shadow_disc.position = Vector3(0.0, 0.03, 0.0)
	player.add_child(shadow_disc)

	player_light = OmniLight3D.new()
	player_light.position = Vector3(0.3, 1.0, 0.2)
	player_light.light_color = Color("#ffca4f")
	player_light.omni_range = 5.5
	player_light.light_energy = 1.45
	player.add_child(player_light)

func _add_sprite(name: String, w_px: int, h_px: int, pos: Vector3, opts := {}) -> MeshInstance3D:
	var w := w_px / PIXELS_PER_UNIT
	var h := h_px / PIXELS_PER_UNIT
	var qm := QuadMesh.new()
	qm.size = Vector2(w, h)
	var mat := ShaderMaterial.new()
	mat.shader = sprite_shader
	mat.set_shader_parameter("albedo_tex", _load_tex("assets/sprites/%s.png" % name))
	mat.set_shader_parameter("normal_tex", _load_tex("assets/sprites/%s_n.png" % name))
	var has_em: bool = opts.get("has_emissive", false)
	mat.set_shader_parameter("has_emissive", has_em)
	if has_em:
		mat.set_shader_parameter("emissive_tex", _load_tex("assets/sprites/%s_e.png" % name))
	mat.set_shader_parameter("sway_amount", opts.get("sway", 0.0))
	mat.set_shader_parameter("sway_phase", opts.get("phase", 0.0))
	mat.set_shader_parameter("billboard_y", 1.0 if opts.get("billboard", true) else 0.0)
	mat.set_shader_parameter("rim_strength", opts.get("rim", 0.25))
	sprite_mats.append(mat)

	var mi := MeshInstance3D.new()
	mi.mesh = qm; mi.material_override = mat
	mi.position = pos + Vector3(0.0, h * 0.5, 0.0)
	add_child(mi)
	return mi

func _build_lights() -> void:
	for ld in [
		[Vector3(-4.4, 2.8, 0.6), Color("#ffd17b"), 7.0, 2.0],
		[Vector3(4.4, 2.8, 0.6),  Color("#ffd17b"), 7.0, 2.0],
		[Vector3(-10.5, 2.8, -2.2), Color("#ffbd70"), 7.0, 1.8],
		[Vector3(9.8, 2.5, -3.4), Color("#ffbd70"), 7.0, 1.7],
	]:
		var l := OmniLight3D.new()
		l.position = ld[0]; l.light_color = ld[1]; l.omni_range = ld[2]; l.light_energy = ld[3]
		add_child(l); point_lights.append(l); point_base_energies.append(ld[3])

func _build_atmosphere() -> void:
	ray_group = Node3D.new()
	add_child(ray_group)
	ray_mat = ShaderMaterial.new()
	ray_mat.shader = godray_shader
	for rx in [-2.8, -0.4, 2.2, -5.5]:
		var rm := MeshInstance3D.new()
		var qm := QuadMesh.new()
		qm.size = Vector2(3.4, 17.0)
		rm.mesh = qm; rm.material_override = ray_mat
		rm.position = Vector3(rx, 7.2, -3.2); rm.rotation.z = -0.46; rm.rotation.y = 0.22
		ray_group.add_child(rm)

	var rng := RandomNumberGenerator.new()
	rng.seed = 909
	var ff_mat := StandardMaterial3D.new()
	ff_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	ff_mat.albedo_color = Color(1.0, 0.9, 0.4)
	ff_mat.emission_enabled = true; ff_mat.emission = Color(1.0, 0.85, 0.3); ff_mat.emission_energy_multiplier = 2.5
	for i in range(40):
		var m := MeshInstance3D.new()
		var sm := SphereMesh.new(); sm.radius = 0.04; sm.height = 0.08
		m.mesh = sm; m.material_override = ff_mat
		m.position = Vector3(rng.randf_range(-14.0, 14.0), rng.randf_range(0.5, 5.0), rng.randf_range(-5.0, 9.0))
		m.set_meta("base", m.position); m.set_meta("phase", rng.randf_range(0.0, 6.28))
		add_child(m); firefly_nodes.append(m)

	# Rising Glowing Embers (Orange for campfire, Cyan for Totem Spirit Flames)
	var em_orange := StandardMaterial3D.new()
	em_orange.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	em_orange.albedo_color = Color("#ffaa33"); em_orange.emission_enabled = true; em_orange.emission = Color("#ff6611"); em_orange.emission_energy_multiplier = 3.2
	var em_cyan := StandardMaterial3D.new()
	em_cyan.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	em_cyan.albedo_color = Color("#88eeff"); em_cyan.emission_enabled = true; em_cyan.emission = Color("#33bbff"); em_cyan.emission_energy_multiplier = 3.2
	for i in range(28):
		var m := MeshInstance3D.new()
		var sm := SphereMesh.new(); sm.radius = 0.035; sm.height = 0.07
		m.mesh = sm; m.material_override = em_orange if i < 14 else em_cyan
		m.set_meta("offset", rng.randf())
		m.set_meta("src", 0 if i < 14 else 1)
		m.set_meta("phase", rng.randf_range(0.0, 6.28))
		add_child(m); ember_nodes.append(m)

	for i in range(22):
		var m := MeshInstance3D.new()
		var qm := QuadMesh.new(); qm.size = Vector2(1.4, 1.4)
		var smat := ShaderMaterial.new()
		smat.shader = smoke_shader
		smat.set_shader_parameter("puff_alpha", 0.34)
		smat.set_shader_parameter("seed_offset", rng.randf_range(0.0, 20.0))
		smoke_mats.append(smat)
		m.mesh = qm; m.material_override = smat
		m.set_meta("offset", rng.randf())
		m.set_meta("rand_scale", rng.randf_range(0.75, 1.45))
		m.set_meta("curl", rng.randf_range(0.6, 1.6))
		m.set_meta("phase", rng.randf_range(0.0, 6.28))
		m.set_meta("source", 0 if i < 11 else 1) # 0 = campfire, 1 = Inn chimney
		add_child(m); smoke_nodes.append(m)

	var l_mat := StandardMaterial3D.new()
	l_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	l_mat.albedo_texture = _load_tex("assets/sprites/leaf.png")
	l_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	l_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	l_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	for i in range(60):
		var m := MeshInstance3D.new()
		var qm := QuadMesh.new(); qm.size = Vector2(0.32, 0.32)
		m.mesh = qm; m.material_override = l_mat
		m.set_meta("base", Vector3(rng.randf_range(-16.0, 16.0), rng.randf_range(0.0, 14.0), rng.randf_range(-8.0, 12.0)))
		m.set_meta("phase", rng.randf_range(0.0, 6.28))
		m.set_meta("prev_y", 14.0)
		add_child(m); leaf_nodes.append(m)

	# Winter Snowflakes (white pixel flakes)
	var snow_mat := StandardMaterial3D.new()
	snow_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	snow_mat.albedo_texture = _load_tex("assets/sprites/snow_flake.png")
	snow_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	snow_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	snow_mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	for i in range(140):
		var m := MeshInstance3D.new()
		var qm := QuadMesh.new(); qm.size = Vector2(0.24, 0.24)
		m.mesh = qm; m.material_override = snow_mat
		m.set_meta("base", Vector3(rng.randf_range(-18.0, 18.0), rng.randf_range(0.0, 15.0), rng.randf_range(-10.0, 14.0)))
		m.set_meta("phase", rng.randf_range(0.0, 6.28))
		add_child(m); snow_nodes.append(m)

	# Ring-buffered Ground Fallen Leaves for Autumn (capped at MAX_GROUND_LEAVES = 280!)
	ground_leaf_mm = MultiMesh.new()
	ground_leaf_mm.transform_format = MultiMesh.TRANSFORM_3D
	ground_leaf_mm.instance_count = MAX_GROUND_LEAVES
	var glq := QuadMesh.new(); glq.size = Vector2(0.32, 0.32)
	ground_leaf_mm.mesh = glq
	ground_leaf_mmi = MultiMeshInstance3D.new()
	ground_leaf_mmi.multimesh = ground_leaf_mm
	ground_leaf_mmi.material_override = l_mat
	for i in range(MAX_GROUND_LEAVES):
		ground_leaf_mm.set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ZERO), Vector3.ZERO))
	add_child(ground_leaf_mmi)

func _build_post_and_hud() -> void:
	var cl := CanvasLayer.new()
	add_child(cl)
	var cr := ColorRect.new()
	cr.set_anchors_preset(Control.PRESET_FULL_RECT)
	cr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	post_mat = ShaderMaterial.new()
	post_mat.shader = post_shader
	cr.material = post_mat
	cl.add_child(cr)

	var panel := PanelContainer.new()
	panel.position = Vector2(18, 18)
	cl.add_child(panel)
	hud_label = Label.new()
	hud_label.add_theme_font_size_override("font_size", 16)
	panel.add_child(hud_label)
	hud_label.visible = false

	settings_panel = PanelContainer.new()
	settings_panel.anchor_left = 1.0; settings_panel.anchor_right = 1.0
	settings_panel.offset_left = -240; settings_panel.offset_right = -18; settings_panel.offset_top = 18
	cl.add_child(settings_panel)
	settings_panel.visible = false
	var vbox := VBoxContainer.new()
	settings_panel.add_child(vbox)
	var title := Label.new(); title.text = "Environment (Tab: Toggle)"; vbox.add_child(title)
	for pair in [["Dawn", "dawn"], ["Day", "day"], ["Dusk", "dusk"], ["Night", "night"]]:
		var btn := Button.new(); btn.text = "Time: " + pair[0]
		btn.pressed.connect(func(): time_of_day = pair[1])
		vbox.add_child(btn)
	for sp in [["Spring", "spring"], ["Summer", "summer"], ["Autumn", "autumn"], ["Winter", "winter"]]:
		var btn := Button.new(); btn.text = "Season: " + sp[0]
		btn.pressed.connect(func(): season = sp[1])
		vbox.add_child(btn)
	var wbtn := Button.new(); wbtn.text = "Water Reflect: High/Med"
	wbtn.pressed.connect(func(): water_high_quality = not water_high_quality)
	vbox.add_child(wbtn)
	var qbtn := Button.new(); qbtn.text = "Forest quality: High"
	qbtn.pressed.connect(func():
		forest_quality = (forest_quality + 1) % 3
		qbtn.text = "Forest quality: " + ["Low", "Medium", "High"][forest_quality]
		_apply_forest_quality()
	)
	vbox.add_child(qbtn)
	var dof_btn := Button.new(); dof_btn.text = "Depth of Field: On"
	dof_btn.pressed.connect(func():
		fx_dof = not fx_dof
		dof_btn.text = "Depth of Field: " + ("On" if fx_dof else "Off")
	)
	vbox.add_child(dof_btn)

func _update_player_sprite_direction() -> void:
	var cam_fwd := -cam.global_transform.basis.z; cam_fwd.y = 0.0; cam_fwd = cam_fwd.normalized()
	var cam_right := cam.global_transform.basis.x; cam_right.y = 0.0; cam_right = cam_right.normalized()
	var f_dot := facing_dir.dot(cam_fwd)
	var r_dot := facing_dir.dot(cam_right)
	if abs(f_dot) > abs(r_dot):
		if f_dot > 0.0:
			player_mat.set_shader_parameter("albedo_tex", _load_tex("assets/sprites/chibi_back.png"))
			player_mat.set_shader_parameter("normal_tex", _load_tex("assets/sprites/chibi_back_n.png"))
			player_mat.set_shader_parameter("emissive_tex", _load_tex("assets/sprites/chibi_back_e.png"))
		else:
			player_mat.set_shader_parameter("albedo_tex", _load_tex("assets/sprites/chibi_hero.png"))
			player_mat.set_shader_parameter("normal_tex", _load_tex("assets/sprites/chibi_hero_n.png"))
			player_mat.set_shader_parameter("emissive_tex", _load_tex("assets/sprites/chibi_hero_e.png"))
		player_sprite.scale.x = 1.0
	else:
		player_mat.set_shader_parameter("albedo_tex", _load_tex("assets/sprites/chibi_side.png"))
		player_mat.set_shader_parameter("normal_tex", _load_tex("assets/sprites/chibi_side_n.png"))
		player_mat.set_shader_parameter("emissive_tex", _load_tex("assets/sprites/chibi_side_e.png"))
		player_sprite.scale.x = 1.0 if r_dot >= 0.0 else -1.0

func _apply_state() -> void:
	var p: Dictionary = TIME_PRESETS[time_of_day]
	sun_light.rotation_degrees = p["sun_rot"]
	sun_light.light_color = p["sun_col"]
	sun_light.light_energy = p["sun_energy"]
	env.ambient_light_color = p["amb_col"]
	env.ambient_light_energy = p["amb_energy"]
	sky_mat.sky_top_color = p["sky_top"]
	sky_mat.sky_horizon_color = p["sky_horizon"]
	env.fog_light_color = p["fog_col"]
	env.fog_enabled = p["fog_on"]
	env.fog_density = p["fog_dens"]
	env.volumetric_fog_enabled = forest_quality > 0 and fx_volumetric and p["vfog_on"]
	env.volumetric_fog_density = p["vfog_dens"]
	env.glow_hdr_threshold = p["glow_thresh"]
	env.glow_bloom = 0.055 if p["vfog_on"] else 0.035
	ray_mat.set_shader_parameter("ray_opacity", p["ray_op"])
	env.glow_enabled = fx_bloom
	ray_group.visible = fx_volumetric and p["ray_op"] > 0.01
	env.ssr_enabled = forest_quality > 0 and water_high_quality
	water_mat.set_shader_parameter("reflect_on", 1.0 if fx_reflection else 0.0)
	water_mat.set_shader_parameter("high_quality", 1.0 if water_high_quality else 0.0)
	water_mat.set_shader_parameter("sim_time", sim_time)
	for gm in grass_mats:
		gm.set_shader_parameter("sim_time", sim_time)
		gm.set_shader_parameter("season_tint", Color(1.0, 0.82, 0.62) if season == "autumn" else (Color(0.76, 0.84, 0.94) if season == "winter" else (Color(0.84, 1.0, 0.72) if season == "summer" else Color(1.0, 1.0, 1.0))))
	for sm in smoke_mats:
		sm.set_shader_parameter("sim_time", sim_time)
	for fm in fire_mats:
		fm.set_shader_parameter("sim_time", sim_time)
	for i in range(tree_roots.size()):
		var phase := float(i) * 0.73
		tree_roots[i].rotation.z = sin(sim_time * 0.55 + phase) * 0.012
		tree_roots[i].rotation.x = cos(sim_time * 0.42 + phase) * 0.008
	for lm in tree_leaf_mats:
		if lm.has_meta("base_texture"):
			var base_texture: Texture2D = lm.get_meta("base_texture")
			lm.albedo_texture = _make_winter_canopy(base_texture) if season == "winter" else base_texture

	if season == "winter":
		grass_mat.albedo_texture = _load_tex("assets/sprites/ground_snow.png")
		grass_mat.normal_texture = _load_tex("assets/sprites/ground_snow_n.png")
		grass_mat.albedo_color = Color(1.05, 1.08, 1.12)
		for rm in roof_mats:
			if not rm.has_meta("orig_tex"): rm.set_meta("orig_tex", rm.albedo_texture)
			rm.albedo_texture = _load_tex("assets/sprites/ground_snow.png")
			rm.albedo_color = Color(1.05, 1.08, 1.15)
		for lm in tree_leaf_mats:
			var bt: Color = lm.get_meta("base_tint")
			lm.albedo_color = bt.lerp(Color(0.9, 0.96, 1.0), 0.68)
		for sm2 in snow_tint_mats:
			if not sm2.has_meta("orig_col"): sm2.set_meta("orig_col", sm2.albedo_color)
			sm2.albedo_color = Color(1.32, 1.38, 1.5)
	elif season == "autumn":
		grass_mat.albedo_texture = _load_tex("assets/sprites/ground_grass.png")
		grass_mat.normal_texture = grass_normal_tex
		grass_mat.albedo_color = Color(1.15, 0.82, 0.55)
		for rm in roof_mats:
			if rm.has_meta("orig_tex"): rm.albedo_texture = rm.get_meta("orig_tex")
			rm.albedo_color = Color(1.0, 1.0, 1.0)
		for lm in tree_leaf_mats:
			var bt: Color = lm.get_meta("base_tint")
			lm.albedo_color = bt * Color(1.1, 0.86, 0.58)
		for sm2 in snow_tint_mats:
			if sm2.has_meta("orig_col"): sm2.albedo_color = sm2.get_meta("orig_col")
	elif season == "summer":
		grass_mat.albedo_texture = _load_tex("assets/sprites/ground_grass.png")
		grass_mat.normal_texture = grass_normal_tex
		grass_mat.albedo_color = Color(0.88, 1.02, 0.76)
		for rm in roof_mats:
			if rm.has_meta("orig_tex"): rm.albedo_texture = rm.get_meta("orig_tex")
			rm.albedo_color = Color(1.0, 1.0, 1.0)
		for lm in tree_leaf_mats:
			var bt: Color = lm.get_meta("base_tint")
			lm.albedo_color = bt * Color(0.9, 1.04, 0.78)
		for sm2 in snow_tint_mats:
			if sm2.has_meta("orig_col"): sm2.albedo_color = sm2.get_meta("orig_col")
	else:
		grass_mat.albedo_texture = _load_tex("assets/sprites/ground_grass.png")
		grass_mat.normal_texture = grass_normal_tex
		grass_mat.albedo_color = Color(1.0, 1.0, 1.0)
		for rm in roof_mats:
			if rm.has_meta("orig_tex"): rm.albedo_texture = rm.get_meta("orig_tex")
			rm.albedo_color = Color(1.0, 1.0, 1.0)
		for lm in tree_leaf_mats:
			lm.albedo_color = lm.get_meta("base_tint")
		for sm2 in snow_tint_mats:
			if sm2.has_meta("orig_col"): sm2.albedo_color = sm2.get_meta("orig_col")

	for mat in sprite_mats:
		mat.set_shader_parameter("emissive_scale", p["emissive_scale"])
		mat.set_shader_parameter("sim_time", sim_time)
	for i in range(point_lights.size()):
		point_lights[i].light_energy = point_base_energies[i] * p["point_scale"]

	cam_pivot.position = cam_pivot.position.lerp(player.position + Vector3(0.0, 1.2, 0.0), 0.25 if not shots_mode else 1.0)
	cam_pivot.rotation_degrees = Vector3(cam_pitch, cam_yaw, 0.0)
	cam.position = Vector3(0.0, 0.0, cam_dist)
	_update_player_sprite_direction()

	post_mat.set_shader_parameter("dof_enabled", 1.0 if fx_dof else 0.0)
	post_mat.set_shader_parameter("sim_time", sim_time)
	hud_label.text = "HD-2D 3D Village | %s | %s | Move: WASD (+Shift Run) | Orbit: Q/E or Right-Drag" % [season.capitalize(), time_of_day.capitalize()]

	for i in range(firefly_nodes.size()):
		var m := firefly_nodes[i]
		var b: Vector3 = m.get_meta("base"); var ph: float = m.get_meta("phase")
		m.visible = time_of_day != "day" and season != "winter"
		m.position = b + Vector3(sin(sim_time + ph) * 0.6, cos(sim_time * 1.3 + ph) * 0.4, sin(sim_time * 0.7 + ph) * 0.4)

	for m in ember_nodes:
		var t := fmod(float(m.get_meta("offset")) + sim_time * 0.38, 1.0)
		var ph: float = m.get_meta("phase")
		var origin := Vector3(-6.6, 0.5, 4.9) if int(m.get_meta("src")) == 0 else Vector3(0.4, 2.0, -2.7)
		var rise := smoothstep(0.0, 1.0, t)
		m.position = origin + Vector3(sin(sim_time * 1.25 + ph + t * 4.2) * 0.22 + rise * 0.18, t * 3.1, cos(sim_time * 1.0 + ph + t * 3.6) * 0.16)
		m.scale = Vector3.ONE * (0.72 - rise * 0.48)

	for m in smoke_nodes:
		var t := fmod(float(m.get_meta("offset")) + sim_time * 0.14, 1.0)
		var src: int = m.get_meta("source")
		var ph: float = m.get_meta("phase")
		var curl: float = m.get_meta("curl")
		var rsc: float = m.get_meta("rand_scale")
		var origin := Vector3(-6.6, 0.6, 4.9) if src == 0 else Vector3(-9.0, 9.0, -6.8)
		var rise := smoothstep(0.0, 1.0, t)
		m.position = origin + Vector3(sin(sim_time * 0.72 + ph + t * 4.0) * 0.28 * curl + rise * 1.45 * curl, t * 5.8, cos(sim_time * 0.64 + ph + t * 3.3) * 0.24 * curl + rise * 0.34 * curl)
		m.scale = Vector3.ONE * rsc * (0.3 + t * 1.5)
		var smat: ShaderMaterial = m.material_override
		smat.set_shader_parameter("puff_alpha", sin(t * PI) * 0.24)

	var show_leaves := (weather == "leaves" or season == "autumn")
	ground_leaf_mmi.visible = show_leaves
	for m in leaf_nodes:
		m.visible = show_leaves
		if show_leaves:
			var b: Vector3 = m.get_meta("base"); var ph: float = m.get_meta("phase")
			var y := fposmod(b.y - sim_time * 1.4, 14.0)
			var lx := b.x + sin(sim_time * 1.5 + ph) * 0.9
			m.position = Vector3(lx, y, b.z)
			var prev_y: float = m.get_meta("prev_y")
			if y > prev_y: # leaf just hit ground and wrapped to top -> deposit onto ground ring buffer!
				var basis := Basis(Vector3.RIGHT, -PI * 0.5).rotated(Vector3.UP, ph)
				ground_leaf_mm.set_instance_transform(ground_leaf_idx, Transform3D(basis, Vector3(lx, 0.04, b.z)))
				ground_leaf_idx = (ground_leaf_idx + 1) % MAX_GROUND_LEAVES
			m.set_meta("prev_y", y)

	var show_snow := (season == "winter")
	for m in snow_nodes:
		m.visible = show_snow
		if show_snow:
			var b: Vector3 = m.get_meta("base"); var ph: float = m.get_meta("phase")
			var y := fposmod(b.y - sim_time * 1.9, 15.0)
			m.position = Vector3(b.x + sin(sim_time * 1.1 + ph) * 1.1, y, b.z + cos(sim_time * 0.9 + ph) * 0.6)

func _physics_process(delta: float) -> void:
	if shots_mode:
		return
	sim_time += delta
	if Input.is_key_pressed(KEY_Q): cam_yaw += 65.0 * delta
	if Input.is_key_pressed(KEY_E): cam_yaw -= 65.0 * delta

	var inp := Vector2.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): inp.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): inp.y += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): inp.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): inp.x += 1.0

	if inp.length() > 0.01:
		inp = inp.normalized()
		var sprinting := Input.is_key_pressed(KEY_SHIFT)
		var speed := 8.5 if sprinting else 4.5
		var bob_freq := 16.5 if sprinting else 11.5
		var yaw_rad := deg_to_rad(cam_yaw)
		var fwd := Vector3(-sin(yaw_rad), 0.0, -cos(yaw_rad))
		var right := Vector3(cos(yaw_rad), 0.0, -sin(yaw_rad))
		var move_dir := (right * inp.x - fwd * inp.y).normalized()
		facing_dir = move_dir
		player.velocity = move_dir * speed
		walk_t += delta
		player_sprite.position.y = 1.5 * HERO_SCALE + abs(sin(walk_t * bob_freq)) * 0.07
		player_mat.set_shader_parameter("walking", true)
		player_mat.set_shader_parameter("walk_phase", walk_t * (1.35 if sprinting else 1.0))
	else:
		player.velocity = Vector3.ZERO
		player_sprite.position.y = 1.5 * HERO_SCALE
		player_mat.set_shader_parameter("walking", false)

	player.move_and_slide()
	_apply_state()

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_RIGHT: dragging = event.pressed
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed: cam_dist = clamp(cam_dist - 2.0, 18.0, 58.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed: cam_dist = clamp(cam_dist + 2.0, 18.0, 58.0)
	elif event is InputEventMouseMotion and dragging:
		cam_yaw -= event.relative.x * 0.35
		cam_pitch = clamp(cam_pitch - event.relative.y * 0.2, -55.0, -10.0)
	elif event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_1: time_of_day = "dawn"
			KEY_2: time_of_day = "day"
			KEY_3: time_of_day = "dusk"
			KEY_4: time_of_day = "night"
			KEY_F1: season = "spring"
			KEY_F2: season = "summer"
			KEY_F3: season = "autumn"
			KEY_F4: season = "winter"
			KEY_Z: weather = "clear"
			KEY_X: weather = "leaves"
			KEY_TAB:
				settings_panel.visible = not settings_panel.visible
				hud_label.visible = settings_panel.visible

func _snap(filename: String) -> void:
	_apply_state()
	for _i in range(4):
		await get_tree().process_frame
	var img := get_viewport().get_texture().get_image()
	img.save_png(ProjectSettings.globalize_path("res://shots/" + filename))
	print("Captured ", filename, " ", img.get_width(), "x", img.get_height())

func _run_shots() -> void:
	cam_yaw = 0.0; cam_pitch = -19.0; cam_dist = 47.0; season = "spring"; time_of_day = "day"
	await _snap("V3-hero-spring-day.png")
	player_mat.set_shader_parameter("walking", true)
	player_mat.set_shader_parameter("walk_phase", 0.25)
	await _snap("V3-walk-step-a.png")
	player_mat.set_shader_parameter("walk_phase", 0.75)
	await _snap("V3-walk-step-b.png")
	player_mat.set_shader_parameter("walking", false)
	cam_yaw = 35.0; await _snap("V3-orbit-spring-day.png")
	cam_yaw = 0.0; season = "autumn"; time_of_day = "dusk"; await _snap("V3-autumn-dusk.png")
	cam_yaw = 0.0; season = "winter"; time_of_day = "day"; await _snap("V3-winter-day.png")
	time_of_day = "dusk"; await _snap("V3-winter-dusk.png")
	cam_yaw = 0.0; season = "spring"; time_of_day = "night"; await _snap("V3-night.png")
	get_tree().quit()

extends RefCounted
class_name WorldBuilders

static func make_pixel_mat(tex: Texture2D, norm: Texture2D = null, scale := Vector3(0.25, 0.25, 0.25), roughness := 0.88) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex
	if norm:
		m.normal_enabled = true
		m.normal_texture = norm
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	m.uv1_triplanar = true
	m.uv1_scale = scale
	m.roughness = roughness
	return m

static func make_solid_mat(col: Color, roughness := 0.85, emit_col := Color.BLACK, emit_energy := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.roughness = roughness
	if emit_energy > 0.0:
		m.emission_enabled = true
		m.emission = emit_col
		m.emission_energy_multiplier = emit_energy
	return m

static func add_box(parent: Node3D, size: Vector3, pos: Vector3, mat: Material, rot := Vector3.ZERO) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var bm := BoxMesh.new()
	bm.size = size
	mi.mesh = bm
	mi.material_override = mat
	mi.position = pos
	mi.rotation_degrees = rot
	parent.add_child(mi)
	return mi

static func add_path_strip(parent: Node3D, points: Array[Vector3], width: float, mat: Material) -> MeshInstance3D:
	var surface := SurfaceTool.new()
	surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(points.size() - 1):
		var a := points[i]
		var b := points[i + 1]
		var direction := (b - a).normalized()
		var side := Vector3(-direction.z, 0.0, direction.x) * width * 0.5
		var v0 := a - side
		var v1 := a + side
		var v2 := b - side
		var v3 := b + side
		for vertex in [v0, v1, v2, v2, v1, v3]:
			surface.add_vertex(vertex)
	surface.generate_normals()
	var path := MeshInstance3D.new()
	path.mesh = surface.commit()
	path.material_override = mat
	parent.add_child(path)
	return path

static func build_detailed_house(
	parent: Node3D,
	pos: Vector3,
	size: Vector3,
	rot_y: float,
	wall_mat: Material,
	roof_mat: Material,
	stone_mat: Material,
	wood_mat: Material,
	win_shader: Shader,
	win_tex: Texture2D,
	win_norm: Texture2D,
	win_em: Texture2D,
	sprite_mats: Array[ShaderMaterial],
	roof_mats: Array[StandardMaterial3D],
	has_awning := true
) -> void:
	var root := StaticBody3D.new()
	root.position = pos
	root.rotation.y = rot_y
	parent.add_child(root)

	var col := CollisionShape3D.new()
	var bs := BoxShape3D.new()
	bs.size = Vector3(size.x + 0.4, size.y, size.z + 0.4)
	col.shape = bs
	col.position = Vector3(0.0, size.y * 0.5, 0.0)
	root.add_child(col)

	# 1. Stepped 3D Stone Plinth Foundation
	add_box(root, Vector3(size.x + 0.5, 0.75, size.z + 0.5), Vector3(0.0, 0.375, 0.0), stone_mat)
	# 2. Main Timber-Plaster Walls
	add_box(root, size, Vector3(0.0, size.y * 0.5 + 0.35, 0.0), wall_mat)

	# 3. Exposed 3D Corner Timber Pillars & Horizontal Belt Beam
	for sx in [-1.0, 1.0]:
		for sz in [-1.0, 1.0]:
			add_box(root, Vector3(0.32, size.y + 0.1, 0.32), Vector3(sx * size.x * 0.5, size.y * 0.5 + 0.35, sz * size.z * 0.5), wood_mat)
	add_box(root, Vector3(size.x + 0.25, 0.28, size.z + 0.25), Vector3(0.0, size.y * 0.54 + 0.35, 0.0), wood_mat)

	# 4. Overhanging 3D Pitched Gable Roof + Ridge Beam
	var roof := MeshInstance3D.new()
	var pm := PrismMesh.new()
	pm.size = Vector3(size.x + 1.4, size.y * 0.58, size.z + 1.4)
	roof.mesh = pm
	var rmat: StandardMaterial3D = roof_mat.duplicate()
	roof.material_override = rmat
	roof_mats.append(rmat)
	roof.position = Vector3(0.0, size.y + 0.35 + size.y * 0.29, 0.0)
	root.add_child(roof)
	add_box(root, Vector3(0.3, 0.35, size.z + 1.6), Vector3(0.0, size.y + 0.35 + size.y * 0.58, 0.0), wood_mat)

	# 5. Detailed 3D Stone Chimney with Cap
	add_box(root, Vector3(1.15, size.y * 0.75, 1.15), Vector3(size.x * 0.3, size.y + size.y * 0.35, -size.z * 0.18), stone_mat)
	add_box(root, Vector3(1.4, 0.28, 1.4), Vector3(size.x * 0.3, size.y + size.y * 0.73, -size.z * 0.18), stone_mat)

	# 6. 3D Wooden Door + Stone Doorstep
	add_box(root, Vector3(1.6, 2.6, 0.22), Vector3(size.x * 0.22, 1.65, size.z * 0.5 + 0.08), wood_mat)
	add_box(root, Vector3(2.2, 0.3, 1.1), Vector3(size.x * 0.22, 0.15, size.z * 0.5 + 0.55), stone_mat)

	# 7. Striped Shopfront Awning (if Inn/Bakery)
	if has_awning:
		var red_mat := make_solid_mat(Color("#bd403c"), 0.85)
		var cream_mat := make_solid_mat(Color("#e5d2c4"), 0.85)
		for i in range(6):
			var aw_x := -size.x * 0.34 + i * 0.65
			add_box(root, Vector3(0.62, 0.14, 1.6), Vector3(aw_x, 3.1, size.z * 0.5 + 0.7), red_mat if i % 2 == 0 else cream_mat, Vector3(22.0, 0.0, 0.0))

	# 8. 3D Mullioned Glowing Windows + Window Sills + Flower Boxes on Front & Sides
	var win_locs := [
		[Vector3(-size.x * 0.26, size.y * 0.72, size.z * 0.5 + 0.06), 0.0],
		[Vector3(size.x * 0.26, size.y * 0.72, size.z * 0.5 + 0.06), 0.0],
		[Vector3(-size.x * 0.24, 2.1, size.z * 0.5 + 0.06), 0.0],
		[Vector3(size.x * 0.5 + 0.06, size.y * 0.62, 0.0), PI * 0.5],
		[Vector3(-size.x * 0.5 - 0.06, size.y * 0.62, 0.0), -PI * 0.5],
	]
	for wl in win_locs:
		var wp: Vector3 = wl[0]
		var wy: float = wl[1]
		var w_holder := Node3D.new()
		w_holder.position = wp
		w_holder.rotation.y = wy
		root.add_child(w_holder)

		var qm := QuadMesh.new()
		qm.size = Vector2(1.3, 1.3)
		var wmat := ShaderMaterial.new()
		wmat.shader = win_shader
		wmat.set_shader_parameter("albedo_tex", win_tex)
		wmat.set_shader_parameter("normal_tex", win_norm)
		wmat.set_shader_parameter("has_emissive", true)
		wmat.set_shader_parameter("emissive_tex", win_em)
		wmat.set_shader_parameter("billboard_y", 0.0)
		sprite_mats.append(wmat)
		var wmi := MeshInstance3D.new()
		wmi.mesh = qm; wmi.material_override = wmat
		w_holder.add_child(wmi)
		# 3D Window Sill
		add_box(w_holder, Vector3(1.55, 0.16, 0.28), Vector3(0.0, -0.72, 0.12), wood_mat)

static func build_3d_tent(parent: Node3D, pos: Vector3, rot_y: float, canvas_mat: Material, wood_mat: Material) -> void:
	var root := Node3D.new()
	root.position = pos
	root.rotation.y = rot_y
	parent.add_child(root)
	var tent := MeshInstance3D.new()
	var pm := PrismMesh.new()
	pm.size = Vector3(2.8, 2.2, 3.2)
	tent.mesh = pm
	tent.material_override = canvas_mat
	tent.position = Vector3(0.0, 1.1, 0.0)
	root.add_child(tent)
	add_box(root, Vector3(0.14, 2.3, 0.14), Vector3(0.0, 1.15, 1.62), wood_mat)
	add_box(root, Vector3(0.14, 2.3, 0.14), Vector3(0.0, 1.15, -1.62), wood_mat)

static func spawn_3d_flame_cluster(parent: Node3D, pos: Vector3, size: Vector2, core: Color, mid: Color, outer: Color, fire_shader: Shader, fire_mats: Array[ShaderMaterial]) -> void:
	var scales := [Vector2(0.85, 0.9), Vector2(1.05, 1.18), Vector2(0.95, 0.78)]
	var speeds := [4.3, 6.2, 7.7]
	var seeds := [1.4, 5.9, 11.7]
	for i in range(3):
		var fm := MeshInstance3D.new()
		var qm := QuadMesh.new(); qm.size = size * scales[i]
		fm.mesh = qm
		var fmat := ShaderMaterial.new()
		fmat.shader = fire_shader
		fmat.set_shader_parameter("core_color", core)
		fmat.set_shader_parameter("mid_color", mid)
		fmat.set_shader_parameter("outer_color", outer)
		fmat.set_shader_parameter("speed", speeds[i])
		fmat.set_shader_parameter("seed_offset", seeds[i] + pos.x * 0.7)
		fire_mats.append(fmat)
		fm.material_override = fmat
		fm.position = pos + Vector3((i - 1) * 0.06, (scales[i].y - 1.0) * size.y * 0.4, 0.0)
		fm.rotation_degrees.y = float(i) * 58.0 + 12.0
		parent.add_child(fm)

static func build_3d_shrine_plaza(parent: Node3D, pos: Vector3, stone_mat: Material, point_lights: Array[OmniLight3D], point_base: Array[float], fire_shader: Shader, fire_mats: Array[ShaderMaterial]) -> void:
	var root := StaticBody3D.new()
	root.position = pos
	parent.add_child(root)
	var col := CollisionShape3D.new()
	var bs := BoxShape3D.new()
	bs.size = Vector3(4.6, 2.0, 4.6)
	col.shape = bs; col.position = Vector3(0.0, 1.0, 0.0)
	root.add_child(col)

	# Stepped Stone Platform
	add_box(root, Vector3(5.2, 0.35, 5.2), Vector3(0.0, 0.175, 0.0), stone_mat)
	add_box(root, Vector3(4.0, 0.35, 4.0), Vector3(0.0, 0.525, 0.0), stone_mat)
	# Central Obelisk + Glowing Rune Core
	add_box(root, Vector3(1.1, 3.4, 0.8), Vector3(0.0, 2.3, -0.4), stone_mat)
	var rune_mat := make_solid_mat(Color("#81b7b2"), 0.28, Color("#6ac7cf"), 1.35)
	add_box(root, Vector3(0.55, 1.3, 0.86), Vector3(0.0, 2.4, -0.4), rune_mat)
	# 2 Animated 3D Blue-Cyan Spirit Fire Braziers + Central Flame Tip
	for bx in [-1.45, 1.45]:
		add_box(root, Vector3(0.65, 1.0, 0.65), Vector3(bx, 1.2, 0.5), stone_mat)
		spawn_3d_flame_cluster(root, Vector3(bx, 2.25, 0.5), Vector2(0.72, 1.12), Color("#e6f3df"), Color("#66bac0"), Color("#377f91"), fire_shader, fire_mats)
	spawn_3d_flame_cluster(root, Vector3(0.0, 4.45, -0.4), Vector2(0.62, 1.0), Color("#f3f2dc"), Color("#70c4c2"), Color("#477f99"), fire_shader, fire_mats)

	var l := OmniLight3D.new()
	l.position = pos + Vector3(0.0, 2.8, 0.6)
	l.light_color = Color("#5ce1ff")
	l.omni_range = 6.5
	l.light_energy = 1.25
	parent.add_child(l)
	point_lights.append(l)
	point_base.append(1.25)

static func build_3d_tree(parent: Node3D, pos: Vector3, scale_val: float, bark_mat: Material, leaf_layers: Array[Texture2D], tint: Color, rng: RandomNumberGenerator, tree_leaf_mats: Array[StandardMaterial3D]) -> Node3D:
	var root := StaticBody3D.new()
	root.position = pos
	parent.add_child(root)
	var col := CollisionShape3D.new()
	var cs := CylinderShape3D.new()
	cs.radius = 0.5 * scale_val; cs.height = 4.0 * scale_val
	col.shape = cs; col.position = Vector3(0.0, 2.0 * scale_val, 0.0)
	root.add_child(col)

	# Smoothly flared 2-segment rough-barked trunk (no awkward protruding spikes!)
	var base_flare := MeshInstance3D.new()
	var bcm_base := CylinderMesh.new()
	bcm_base.top_radius = 0.44 * scale_val
	bcm_base.bottom_radius = 0.78 * scale_val
	bcm_base.height = 1.15 * scale_val
	bcm_base.radial_segments = 8
	base_flare.mesh = bcm_base
	base_flare.material_override = bark_mat
	base_flare.position = Vector3(0.0, 0.57 * scale_val, 0.0)
	root.add_child(base_flare)

	var trunk := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.24 * scale_val
	cm.bottom_radius = 0.46 * scale_val
	cm.height = 3.9 * scale_val
	cm.radial_segments = 8
	trunk.mesh = cm
	trunk.material_override = bark_mat
	trunk.position = Vector3(0.0, 3.0 * scale_val, 0.0)
	trunk.rotation_degrees = Vector3(rng.randf_range(-2.0, 2.0), rng.randf_range(0.0, 360.0), rng.randf_range(-3.0, 3.0))
	root.add_child(trunk)

	for br in [[Vector3(-0.9, 3.6, 0.3), Vector3(0.0, 0.0, 38.0)], [Vector3(0.95, 3.8, -0.2), Vector3(0.0, 0.0, -35.0)], [Vector3(0.1, 3.7, 0.85), Vector3(34.0, 0.0, 0.0)]]:
		var b_mesh := MeshInstance3D.new()
		var bcm := CylinderMesh.new()
		bcm.top_radius = 0.12 * scale_val; bcm.bottom_radius = 0.22 * scale_val; bcm.height = 2.5 * scale_val; bcm.radial_segments = 6
		b_mesh.mesh = bcm; b_mesh.material_override = bark_mat
		b_mesh.position = br[0] * scale_val
		b_mesh.rotation_degrees = br[1]
		root.add_child(b_mesh)

	# Layered hand-painted 2D foliage on camera-facing planes gives a soft anime diorama look.
	var layer_y := [5.75, 5.95, 6.2, 5.45, 5.6]
	var layer_z := [-0.72, -0.24, 0.26, 0.42, 0.5]
	var layer_x := [0.0, 0.0, 0.0, -1.52, 1.55]
	var layer_size := [Vector2(8.4, 7.2), Vector2(8.15, 6.8), Vector2(7.7, 6.55), Vector2(4.75, 4.45), Vector2(4.65, 4.3)]
	var layer_color := [Color(0.9, 0.98, 0.88), Color(0.98, 1.02, 0.94), Color(1.06, 1.06, 0.94), Color(0.94, 1.02, 0.88), Color(1.08, 1.06, 0.9)]
	for i in range(leaf_layers.size()):
		var tint_adjust: Color = tint * layer_color[i]
		var leaf_mat := StandardMaterial3D.new()
		leaf_mat.albedo_texture = leaf_layers[i]
		leaf_mat.set_meta("base_texture", leaf_layers[i])
		leaf_mat.albedo_color = tint_adjust
		leaf_mat.roughness = 0.9
		leaf_mat.metallic = 0.0
		leaf_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		leaf_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		leaf_mat.billboard_mode = BaseMaterial3D.BILLBOARD_FIXED_Y
		leaf_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
		leaf_mat.set_meta("base_tint", tint_adjust)
		tree_leaf_mats.append(leaf_mat)
		var mi := MeshInstance3D.new()
		var quad := QuadMesh.new()
		quad.size = layer_size[i] * scale_val * 0.58
		mi.mesh = quad
		mi.material_override = leaf_mat
		mi.position = Vector3(layer_x[i] * scale_val + rng.randf_range(-0.18, 0.18), layer_y[i] * scale_val, layer_z[i] * scale_val)
		root.add_child(mi)

	# Independent painterly leaf clumps leave gaps for branches and sky.
	var boughs := [
		[Vector3(-2.1, 5.2, 0.52), Vector2(2.8, 2.4)], [Vector3(-1.2, 6.5, 0.62), Vector2(2.7, 2.4)],
		[Vector3(0.35, 6.8, 0.55), Vector2(3.0, 2.55)], [Vector3(2.0, 6.0, 0.5), Vector2(2.8, 2.35)],
		[Vector3(1.05, 4.95, 0.68), Vector2(2.7, 2.2)], [Vector3(-0.65, 5.45, 0.85), Vector2(2.35, 2.0)],
	]
	for j in range(boughs.size()):
		var bough: Array = boughs[j]
		var leaf_mat := StandardMaterial3D.new()
		var tex_index := 3 if j % 2 == 0 else 4
		leaf_mat.albedo_texture = leaf_layers[tex_index]
		leaf_mat.set_meta("base_texture", leaf_layers[tex_index])
		var tint_variants: Array[Color] = [Color(0.92, 1.0, 0.84), Color(1.04, 1.08, 0.91), Color(1.1, 1.1, 0.92)]
		var bough_tint: Color = tint * tint_variants[j % 3]
		leaf_mat.albedo_color = bough_tint
		leaf_mat.roughness = 0.92
		leaf_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		leaf_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		leaf_mat.billboard_mode = BaseMaterial3D.BILLBOARD_FIXED_Y
		leaf_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
		leaf_mat.set_meta("base_tint", bough_tint)
		tree_leaf_mats.append(leaf_mat)
		var bough_mesh := MeshInstance3D.new()
		var bough_quad := QuadMesh.new()
		bough_quad.size = bough[1] * scale_val * 0.58
		bough_mesh.mesh = bough_quad
		bough_mesh.material_override = leaf_mat
		bough_mesh.position = bough[0] * scale_val + Vector3(rng.randf_range(-0.16, 0.16), rng.randf_range(-0.1, 0.1), rng.randf_range(-0.08, 0.08))
		root.add_child(bough_mesh)
	return root

static func build_3d_pine(parent: Node3D, pos: Vector3, scale_val: float, pine_tex: Texture2D, tree_leaf_mats: Array[StandardMaterial3D]) -> void:
	var root := Node3D.new()
	root.position = pos
	parent.add_child(root)
	var trunk := MeshInstance3D.new()
	var trunk_mesh := CylinderMesh.new()
	trunk_mesh.top_radius = 0.14 * scale_val
	trunk_mesh.bottom_radius = 0.3 * scale_val
	trunk_mesh.height = 4.8 * scale_val
	trunk.mesh = trunk_mesh
	trunk.material_override = make_solid_mat(Color("#79533c"), 0.96)
	trunk.position.y = 2.4 * scale_val
	root.add_child(trunk)
	# Crossed hand-painted pine cutouts add volume from the exploration camera.
	for i in range(3):
		var mat := StandardMaterial3D.new()
		var tint: Color = [Color("#b7d69a"), Color("#d2e8ad"), Color("#a5cc8b")][i]
		mat.albedo_texture = pine_tex
		mat.albedo_color = tint
		mat.roughness = 0.9
		mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
		mat.alpha_scissor_threshold = 0.12
		mat.cull_mode = BaseMaterial3D.CULL_DISABLED
		mat.set_meta("base_tint", tint)
		tree_leaf_mats.append(mat)
		var mi := MeshInstance3D.new()
		var quad := QuadMesh.new()
		quad.size = Vector2(5.6, 8.6) * scale_val * (1.0 - float(i) * 0.06)
		mi.mesh = quad
		mi.material_override = mat
		mi.position = Vector3(0.0, 4.25 * scale_val, 0.0)
		mi.rotation.y = float(i) * PI / 3.0
		root.add_child(mi)

static func build_crimson_banner(parent: Node3D, pos: Vector3, wood_mat: Material) -> void:
	add_box(parent, Vector3(0.16, 4.2, 0.16), pos + Vector3(0.0, 2.1, 0.0), wood_mat)
	add_box(parent, Vector3(1.1, 0.12, 0.12), pos + Vector3(0.55, 4.0, 0.0), wood_mat)
	var red_m := make_solid_mat(Color("#9e2b33"), 0.85)
	var gold_m := make_solid_mat(Color("#f7d054"), 0.4, Color("#ffca4f"), 0.6)
	add_box(parent, Vector3(0.85, 1.8, 0.06), pos + Vector3(0.55, 3.05, 0.0), red_m)
	add_box(parent, Vector3(0.32, 0.32, 0.08), pos + Vector3(0.55, 3.2, 0.0), gold_m)

static func build_pond_with_reeds(parent: Node3D, pos: Vector3, water_mat: Material, reeds_tex: Texture2D, grass_tex: Texture2D, dirt_mat: Material, rng: RandomNumberGenerator) -> void:
	# Asymmetric shoreline based on layered, gently varying arcs rather than a circular stamp.
	var segments := 36
	var water_outline := PackedVector3Array()
	var bank_inner := PackedVector3Array()
	var bank_outer := PackedVector3Array()
	for i in range(segments):
		var angle := float(i) / float(segments) * TAU
		var wobble := 1.0 + 0.10 * sin(angle * 3.0 + 0.6) + 0.055 * cos(angle * 5.0 - 0.9) + 0.035 * sin(angle * 7.0 + 1.8)
		water_outline.append(Vector3(cos(angle) * 3.8 * wobble, 0.0, sin(angle) * 2.75 * wobble))
		bank_inner.append(Vector3(cos(angle) * 4.0 * wobble, 0.0, sin(angle) * 2.95 * wobble))
		bank_outer.append(Vector3(cos(angle) * (4.52 * wobble + 0.12), 0.0, sin(angle) * (3.38 * wobble + 0.10)))

	# Collision body follows the pond's oblong footprint and keeps the hero out of deep water.
	var pond_body := StaticBody3D.new()
	pond_body.position = pos
	parent.add_child(pond_body)
	var col := CollisionShape3D.new()
	var cs := ConvexPolygonShape3D.new()
	var collision_points := PackedVector3Array()
	for point in water_outline:
		collision_points.append(point)
		collision_points.append(point + Vector3.UP * 2.0)
	cs.points = collision_points
	col.shape = cs; col.position = Vector3.ZERO
	pond_body.add_child(col)

	# Irregular earthen bank ribbon; the triplanar dirt material softens seams.
	var bank_surface := SurfaceTool.new()
	bank_surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(segments):
		var j := (i + 1) % segments
		for vertex in [bank_inner[i], bank_outer[j], bank_outer[i], bank_inner[i], bank_inner[j], bank_outer[j]]:
			bank_surface.add_vertex(vertex)
	bank_surface.generate_normals()
	var bank := MeshInstance3D.new()
	bank.mesh = bank_surface.commit(); bank.material_override = dirt_mat
	bank.position = pos + Vector3(0.0, 0.015, 0.0)
	parent.add_child(bank)

	# Natural, gently asymmetrical water edge.
	var water_surface := SurfaceTool.new()
	water_surface.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in range(segments):
		var j := (i + 1) % segments
		water_surface.add_vertex(Vector3.ZERO)
		water_surface.add_vertex(water_outline[j])
		water_surface.add_vertex(water_outline[i])
	water_surface.generate_normals()
	var pond := MeshInstance3D.new()
	pond.mesh = water_surface.commit()
	pond.material_override = water_mat
	pond.position = pos + Vector3(0.0, 0.035, 0.0)
	parent.add_child(pond)

	# Lily pads + Pink Lotus Flowers
	var pad_mat := make_solid_mat(Color("#487d52"), 0.8)
	var lotus_mat := make_solid_mat(Color("#f08ca0"), 0.6, Color("#f08ca0"), 0.35)
	for lp in [Vector3(-1.1, 0.07, 0.4), Vector3(0.7, 0.07, -0.3), Vector3(1.6, 0.07, 0.5), Vector3(-1.7, 0.07, -0.6), Vector3(0.1, 0.07, 0.8)]:
		var pad := MeshInstance3D.new()
		var pm := CylinderMesh.new(); pm.top_radius = 0.38; pm.bottom_radius = 0.38; pm.height = 0.03; pm.radial_segments = 10
		pad.mesh = pm; pad.material_override = pad_mat
		pad.position = pos + lp
		parent.add_child(pad)
		if rng.randf() > 0.4:
			var lot := MeshInstance3D.new()
			var lm := CylinderMesh.new(); lm.top_radius = 0.06; lm.bottom_radius = 0.18; lm.height = 0.16; lm.radial_segments = 6
			lot.mesh = lm; lot.material_override = lotus_mat
			lot.position = pos + lp + Vector3(0.0, 0.09, 0.0)
			parent.add_child(lot)

	# Cattail reeds + water grass growing inside & around pond edge
	var reed_mat := StandardMaterial3D.new()
	reed_mat.albedo_texture = reeds_tex
	reed_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	reed_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	reed_mat.billboard_mode = BaseMaterial3D.BILLBOARD_FIXED_Y
	var wgrass_mat := StandardMaterial3D.new()
	wgrass_mat.albedo_texture = grass_tex
	wgrass_mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	wgrass_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR
	wgrass_mat.billboard_mode = BaseMaterial3D.BILLBOARD_FIXED_Y
	for i in range(34):
		if rng.randf() < 0.22: continue
		var ang := rng.randf_range(0.0, TAU) + sin(float(i) * 0.57) * 0.18
		var rad := rng.randf_range(0.85, 1.16)
		var rx := cos(ang) * 4.15 * rad
		var rz := sin(ang) * 3.15 * rad
		var mi := MeshInstance3D.new()
		var is_reed := (i % 2 == 0)
		var qm := QuadMesh.new(); qm.size = Vector2(rng.randf_range(0.6, 1.05), rng.randf_range(1.05, 1.9)) if is_reed else Vector2(rng.randf_range(0.65, 1.0), rng.randf_range(0.65, 1.1))
		mi.mesh = qm; mi.material_override = reed_mat if is_reed else wgrass_mat
		mi.position = pos + Vector3(rx, rng.randf_range(0.5, 0.9) if is_reed else rng.randf_range(0.3, 0.55), rz)
		mi.rotation.y = rng.randf_range(0.0, TAU)
		parent.add_child(mi)

static func build_3d_cart_and_props(parent: Node3D, wood_mat: Material, iron_mat: Material, stone_mat: Material) -> void:
	# 3D Wooden Cart near Inn
	var cart := Node3D.new()
	cart.position = Vector3(-8.0, 0.0, 3.8)
	cart.rotation.y = 0.35
	parent.add_child(cart)
	add_box(cart, Vector3(2.0, 0.7, 1.3), Vector3(0.0, 0.85, 0.0), wood_mat)
	add_box(cart, Vector3(0.9, 0.12, 0.12), Vector3(-1.35, 0.6, 0.45), wood_mat)
	add_box(cart, Vector3(0.9, 0.12, 0.12), Vector3(-1.35, 0.6, -0.45), wood_mat)
	for wx in [-0.65, 0.65]:
		for wz in [-0.72, 0.72]:
			var w := MeshInstance3D.new()
			var cm := CylinderMesh.new()
			cm.top_radius = 0.42; cm.bottom_radius = 0.42; cm.height = 0.16; cm.radial_segments = 10
			w.mesh = cm; w.material_override = iron_mat
			w.position = Vector3(wx, 0.42, wz)
			w.rotation_degrees = Vector3(90.0, 0.0, 0.0)
			cart.add_child(w)

	# 3D Stone Lantern Pillars
	for sp in [Vector3(-4.4, 0.0, 0.6), Vector3(4.4, 0.0, 0.6)]:
		add_box(parent, Vector3(0.35, 2.4, 0.35), sp + Vector3(0.0, 1.2, 0.0), iron_mat)
		var glow_m := make_solid_mat(Color("#fff3b8"), 0.1, Color("#ffca4f"), 2.8)
		add_box(parent, Vector3(0.45, 0.55, 0.45), sp + Vector3(0.0, 2.6, 0.0), glow_m)

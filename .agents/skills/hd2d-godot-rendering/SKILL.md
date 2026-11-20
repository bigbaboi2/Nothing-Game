---
name: hd2d-godot-rendering
description: >-
  Architecture and implementation guide for Godot 4.4+ HD-2D rendering,
  Sprite3D/ShaderMaterial normal-mapped sprites, CameraAttributesPractical DOF,
  WorldEnvironment glow & volumetric fog, planar/screen-space water reflection,
  and automated CLI 1920x1080 screenshot capture.
---

# HD-2D Godot 4.4+ Rendering Guide

## 1. Renderer & Project Settings
- Prefer **Forward+** (`rendering/renderer/rendering_method="forward_plus"`) for full `VolumetricFog`, `CameraAttributesPractical` DOF, and `Glow`.
- If running on a software-only environment without Vulkan, fallback to `gl_compatibility` (`--rendering-method gl_compatibility`) and use additive god-ray meshes + screen-space blur shader for DOF; document this clearly in `README.md` and `report/SUMMARY.md`.
- Set `rendering/textures/canvas_textures/default_texture_filter = 0` (Nearest) and configure `.import` files with `compress/mode=0` (Lossless) and `mipmaps/generate=false`.

## 2. Camera & Tilt-Shift DOF
- `Camera3D`: `fov = 28.0`, positioned at `(0, 11.5, 22.0)` looking at `(0, 2.2, -1.5)`.
- Attach `CameraAttributesPractical`:
  - `dof_blur_far_enabled = true`, `dof_blur_far_distance = 27.5`, `dof_blur_far_transition = 6.0`
  - `dof_blur_near_enabled = true`, `dof_blur_near_distance = 17.5`, `dof_blur_near_transition = 4.5`
  - `dof_blur_amount = 0.14` (keeps hero at distance `~22.0` razor sharp).

## 3. Sprites, Normal Maps & Wind
- Use `Sprite3D` (`texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST`, `billboard = BaseMaterial3D.BILLBOARD_FIXED_Y`, `shaded = true`, `alpha_cut = SpriteBase3D.ALPHA_CUT_DISCARD`, `pixel_size = 0.0625`) OR a custom `ShaderMaterial` on `QuadMesh` (`1 px = 0.0625 units`) for wind sway + rim light + emissive window masks.
- Assign `normal_map` (`_n.png`) so `DirectionalLight3D` and `OmniLight3D` lamps light sprites with 3D relief.

## 4. Environment, Bloom, Volumetric & Water
- `WorldEnvironment`: `tonemap_mode = ACES`, `glow_enabled = true`, `glow_hdr_threshold = 0.85`, `glow_intensity = 0.65`, `volumetric_fog_enabled = true` (subtle density `0.015`).
- Water: `SubViewport` mirrored camera OR `hint_screen_texture` spatial shader with dual-wave UV distortion, depth tint, and specular glints.
- Post-process `CanvasLayer` `ColorRect` shader for subtle vignette, film grain, and warm/cool color grading.

## 5. Automated 1920×1080 Screenshots
- Support CLI arguments (`-- --shots`) in the main scene script to cycle through `time`, `weather`, and `fx` toggles, wait `3–5` rendered frames per state, and save `get_viewport().get_texture().get_image().save_png(...)` at `1920x1080`.

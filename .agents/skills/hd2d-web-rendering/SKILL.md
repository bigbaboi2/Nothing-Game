---
name: hd2d-web-rendering
description: >-
  Architecture and implementation guide for the Three.js (WebGL2) HD-2D renderer,
  custom normal-mapped sprite shaders, planar water reflection, tilt-shift DOF,
  bloom, volumetric god-rays, and Playwright 1920x1080 screenshot automation.
---

# HD-2D Web Rendering (Three.js + WebGL2)

## 1. Scene & Camera Setup
- Use `THREE.PerspectiveCamera(28, 16/9, 0.5, 120)` positioned at `(0, 11.5, 22.0)` looking at `(0, 2.2, -1.5)` for the miniature diorama angle.
- Enforce `texture.magFilter = THREE.NearestFilter`, `texture.minFilter = THREE.NearestFilter`, `texture.generateMipmaps = false` on all pixel textures.

## 2. Custom Sprite ShaderMaterial
- Use `PlaneGeometry` sized `widthPx / 16` by `heightPx / 16` with pivot at bottom-center (`geometry.translate(0, h/2, 0)`).
- In vertex shader: apply cylindrical Y-axis billboarding (optional tilt toward camera) and per-instance wind sway (`sin(uTime * speed + worldPos.x * 0.7 + uv.y) * swayAmount * uv.y`).
- In fragment shader:
  - Alpha-test (`if (tex.a < 0.5) discard;`) for crisp pixel edges.
  - Decode tangent-space normal map (`_n.png`), combine with `uSunDir` + `uSunColor` + `uAmbientColor` + loop over `uPointLights[8]` (distance attenuation + normal dot product).
  - Add subtle Fresnel/edge rim light from the sun/moon and warm self-emission mask for glowing windows/lanterns.

## 3. Planar Water Reflection & Wet Cobbles
- Render inverted scene (reflected across `y = waterY`, clip plane `y >= waterY`) into a `WebGLRenderTarget` (`960x540` or `1024x512`).
- Sample reflection texture in the water shader with UV distortion from dual-scrolling sine/noise ripples, tint with `water` palette ramp, and add crisp pixel-quantized specular glints from warm point lights.

## 4. HD-2D Post-Processing Stack (`EffectComposer`)
1. `RenderPass` (full 1920×1080 crisp pixels).
2. `UnrealBloomPass` (high threshold `0.78–0.85`, moderate strength `0.55–0.75`, radius `0.45`) so only lanterns, lit windows, and water glints bloom—never wash out the whole scene.
3. Custom `TiltShiftDOFPass`: compute Circle of Confusion (`CoC`) from distance to hero focus plane (`z = 2.0`) combined with vertical screen gradient; apply multi-tap disc/bokeh blur in foreground and background while keeping the hero band razor sharp.
4. `VolumetricGodRay` + depth mist: additive angled light-shaft planes through the hero tree + exponential height/depth fog.
5. `ColorGradingPass`: warm/cool split-toning, ACES Filmic tone mapping, subtle vignette (`0.22`), and fine film grain (`0.025`).

## 5. Automated 1920×1080 Screenshots
- Expose `window.__setState({ time, weather, fx: { bloom, dof, volumetric, reflection }, cameraMode })` and `window.__renderNow()`.
- Use `playwright-core` launching Chrome/Edge headless at `1920x1080` with WebGL2 enabled (`--use-angle=swiftshader` fallback if no GPU).
- Always run `tools/verify_shots.mjs` to validate dimensions, non-black/non-white histogram, and A/B effect diffs.

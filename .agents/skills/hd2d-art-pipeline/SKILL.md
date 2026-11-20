---
name: hd2d-art-pipeline
description: >-
  Guides procedural pixel art generation, height-to-normal map synthesis, palette
  validation, and 2-head chibi sprite creation for HD-2D projects. Use whenever
  creating, modifying, or auditing pixel sprites, tilesets, or normal maps.
---

# HD-2D Pixel Art & Normal Map Pipeline

## Core Rules
1. **Palette Lock:** Load all colors from `shared/palette.json`. Every ramp has 4–6 steps where shadows shift toward cool indigo/violet and highlights shift toward warm amber/cream.
2. **Selective Outline:** Outline characters, props, and foliage with the darkest shade of their own material ramp (or a dark indigo), NEVER `#000000`.
3. **Clean Shading:** Avoid noisy 1×1 checkerboard dithering on characters and props. Reserve dithering strictly for large atmospheric gradients (sky dome, distant mist).
4. **Consistent Scale (`16 px = 1.0 unit`):**
   - Chibi hero: `44–48 px` tall (`2.75–3.0` units), 2-head proportion (`~20 px` head, large expressive eyes with 1px white/cream specular highlight, 3+ hair ramp steps, cloak, scarf, handheld lantern).
   - Houses: `5–7×` hero height (`208–280 px` tall).
   - Hero Tree: `6–10×` hero height (`260–320 px` tall).

## Procedural Asset & Normal Map Generation
1. Draw each sprite/texture onto an indexed RGBA pixel buffer using `shared/palette.json` ramps, and simultaneously write a matching grayscale height buffer (`0–255`, where protruding parts like roofs, nose, lantern, tree canopy clusters have higher values).
2. Convert the height buffer to a tangent-space normal map via Sobel filter (`dx`, `dy`, `dz = strength`), normalized to `[0..255]` RGB (`(nx*0.5+0.5)*255`).
3. Output both `<name>.png` and `<name>_n.png` at native 1× pixel resolution.

## Verification Checklist
- Generate `assets-sheet.png` (all sprites arranged on a neutral `#2a2c38` grid, scaled `4×` with Nearest Neighbor).
- Run an automated palette audit script checking that 100% of opaque pixels in every albedo PNG match `shared/palette.json` (tolerance `0` or `<= 2` RGB units).
- Visually inspect `assets-sheet.png` and `character-closeup.png` to confirm crisp edges, readable silhouettes, and zero bilinear blur.

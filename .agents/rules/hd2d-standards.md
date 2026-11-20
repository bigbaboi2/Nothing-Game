---
trigger: always_on
---
# HD-2D Project Non-Negotiable Standards

1. **Pixel Density Consistency:** All pixel art sprites and 3D surface textures MUST share the exact same world-to-pixel density (`16 px = 1.0 world unit`, i.e. `0.0625 units/px`). Never mix high-res textures with chunky pixel art.
2. **Nearest Filtering Only:** Every pixel texture MUST use Nearest-Neighbor filtering (`THREE.NearestFilter` on Web; `TEXTURE_FILTER_NEAREST` + Lossless + no mipmaps in Godot). Never use bilinear/trilinear filtering on pixel art.
3. **Shared Palette Discipline:** All art assets MUST derive colors from `shared/palette.json` (48–96 colors, hue-shifted 4–6 step ramps). Use selective outlines (darkest ramp color), NEVER pure `#000000`.
4. **Real 1920×1080 Visual Proof:** Every milestone requires real rendered 1920×1080 PNG screenshots inspected visually before marking complete. Never fabricate or extrapolate visual results.
5. **Independent Review Loop:** Builders do not self-approve. Follow `shared/scene-brief.md` for layout, coordinates, and the 32+ object checklist, then run the Reviewer QA rubric (`reviews/review-NN.md`).

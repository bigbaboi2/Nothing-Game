# Scene Brief — HD-2D Cozy Riverside Village Corner (Vòng 1)

## 1. Coordinate System & Scale
- **Axes:** `+X` right, `+Z` toward camera (foreground), `-Z` into screen (background), `+Y` up.
- **Unit:** `1.0 unit = 16 px` (base tile).
- **Character Height:** `~2.75 units` (`44 px` tall, 2-head chibi ratio: head ~20 px, body ~24 px).
- **House Height:** `~13–17 units` (`5–6×` character height).
- **Hero Tree Height:** `~18–22 units` (`7–8×` character height).
- **Pixel Density Rule:** `16 px per world unit` (`1 px = 0.0625 units`) consistently across ALL sprites and 3D ground/wall textures.

## 2. Camera & Framing (16:9, 1920×1080)
- **FOV:** `28°` (narrow perspective for diorama tilt-shift feel).
- **Position:** `(0.0, 11.5, 22.0)`
- **Target (LookAt):** `(0.0, 2.2, -1.5)` (tilt ~25°–32° downward).
- **Focus Plane (DOF):** Locked at character Z-depth (`z = 2.0`, distance from camera `~22.0` units). Foreground (`z > 6.5`) and background (`z < -8.0`) visibly blur.

## 3. Three-Layer Composition
1. **Foreground (`z = +6.5` to `+13.0`, blurred by DOF):**
   - Left & right framing bushes, tall grass clusters, pink/gold flower patches, wooden fence posts, low stone wall corner, fireflies/floating dust.
2. **Midground (`z = -5.5` to `+6.0`, sharp focus):**
   - **Cobblestone street** running diagonally/horizontally across `z = 0.5` to `z = 4.5`, leading eye to the stone bridge.
   - **Canal / River** along the front-right / lower-right (`x = 2.0..18.0, z = 4.5..10.5` or curving from `x = 4..18, z = 3.5..9.0`) with **arched wooden/stone bridge** at `(6.5, 0.0, 2.5)` and wooden dock/pier.
   - **Chibi Hero** at `(-1.2, 0.0, 2.2)` (rule-of-thirds left-center, facing 3/4 right toward the lantern & bridge, holding a small warm lantern).
   - **Main Bakery/Inn House (Left-Center)** at `(-7.5, 0.0, -2.5)`: 2-story timber-framed plaster house with terracotta roof, glowing shopfront windows, chimney with rising smoke, hanging cloth awning, wooden sign.
   - **Riverside Cottage (Right-Back)** at `(7.5, 0.0, -4.5)`: slate-roofed stone/wood cottage with warm lit windows, flower boxes, balcony lantern.
   - **Hero Old Oak/Maple Tree** at `(-1.5, 0.0, -4.8)`: massive layered canopy casting dappled shadows & volumetric light shafts.
   - **Props:** Streetlamp posts (3), wooden barrels (4), ceramic jars (3), wooden bench (1), market crate (2), signpost (1), laundry/banner line (1), moored rowboat (1) at dock.
3. **Background (`z = -9.0` to `-28.0`, atmospheric fog + DOF blur):**
   - Distant village cottage silhouettes (`z = -12` to `-16`), terraced stone wall, layered pine/deciduous treeline, rolling hills, dusk sky dome with drifting clouds.

## 4. Lighting Setup
- **Directional Light (Sun/Moon):**
  - `dawn`: low warm peach `(255, 190, 140)`, azimuth east, elevation `18°`.
  - `day`: bright warm-white `(255, 245, 225)`, elevation `50°`.
  - `dusk` (Hero default): golden-amber `(255, 158, 92)`, low angle `(-0.6, 0.45, -0.65)` casting long shadows + cool indigo ambient `(42, 48, 88)`.
  - `night`: cool moonlight `(110, 145, 220)`, deep indigo ambient `(18, 22, 45)`.
- **Point Lights (6–8 warm sources, flicker-animated):**
  1. Hero's handheld lantern: `(-0.5, 1.4, 2.3)`, color `#ffca4f`, radius `4.5`, intensity `2.2`.
  2. Streetlamp Left (near Inn): `(-4.2, 3.6, 1.2)`, color `#ffa940`, radius `7.5`, intensity `3.2`.
  3. Streetlamp Bridge: `(4.2, 3.6, 1.8)`, color `#ffa940`, radius `7.5`, intensity `3.2`.
  4. Inn Shopfront Window 1: `(-7.5, 2.4, 0.6)`, color `#ff9636`, radius `6.5`, intensity `2.8`.
  5. Inn Upper Window: `(-6.8, 6.2, 0.4)`, color `#ffb85c`, radius `5.5`, intensity `2.0`.
  6. Cottage Window: `(7.2, 2.5, -1.8)`, color `#ff9636`, radius `6.5`, intensity `2.6`.
  7. Dock Lantern: `(10.5, 2.2, 4.2)`, color `#ffaa44`, radius `6.0`, intensity `2.4`.

## 5. Distinct Object Checklist (32+ items, excluding grass blades)
1. Chibi hero character (with lantern)
2. Inn/Bakery main house (2-story)
3. Inn chimney + smoke emitter
4. Inn cloth awning & hanging shop sign
5. Riverside cottage (slate roof)
6. Distant background cottage A
7. Distant background cottage B
8. Arched bridge (wood & stone)
9. Wooden dock / pier
10. Moored wooden rowboat
11. Hero big tree (multi-layer canopy)
12. Midground birch/maple tree
13. Background trees (6+ clustered)
14. Cobblestone main road
15. Canal water plane (reflective + rippled)
16. Canal stone embankment walls
17. Streetlamp post #1 (left)
18. Streetlamp post #2 (bridge)
19. Dock lantern post #3
20. Wooden bench
21. Wooden barrels (pair + stack)
22. Ceramic jars / amphorae
23. Market crates with apples/bread
24. Wooden signpost
25. Hanging cloth banner / bunting line
26. Foreground wooden fence (left & right)
27. Foreground flower bushes (pink)
28. Foreground flower bushes (gold)
29. Birds (perched on roof + flying flock)
30. Butterflies (day/dusk) & Fireflies (dusk/night)
31. Drifting clouds + cloud shadow gobo
32. Volumetric god-ray planes + floating dust motes

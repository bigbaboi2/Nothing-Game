---
name: hd2d-visual-qa
description: >-
  Independent Reviewer workflow for HD-2D milestones. Covers clean-run
  verification, automated screenshot integrity checks, 11-category visual rubric
  scoring (0-100), and writing measurable review-NN.md action items.
---

# HD-2D Visual QA & Reviewer Protocol

## Golden Rule
**Reviewer NEVER edits builder code.** Reviewer runs the project from scratch, captures/verifies screenshots independently, inspects them visually, scores honestly, and writes concrete, measurable fix requests.

## Step 1: Independent Run & Automated Verification
1. Follow `README.md` 1-command run/capture instructions.
2. Check console/logs for shader compilation errors or missing textures.
3. Run image verification:
   - Resolution must be `1920x1080`.
   - Pixel standard deviation > `12.0` (not blank/black/white).
   - A/B toggle pairs (`ab-bloom`, `ab-dof`, `ab-volumetric`, `ab-reflection`) must have measurable pixel difference (`MAE > 0.5`).
   - Motion strip frames must differ from each other (`MAE > 0.3`).

## Step 2: Visual Inspection & 11-Category Rubric (0–10 each, total / 100)
Target for Vòng 1 pass: **Total >= 75/100** and **no single category < 5/10**.
1. **Pixel Art Quality:** Hue-shifted ramps, selective outlines, uniform `16 px/unit` density, crisp Nearest filtering.
2. **Palette & Atmosphere:** Warm/cool contrast, cohesive cozy mood.
3. **Composition & Depth:** Clear Foreground (blurred) / Midground (sharp hero + street) / Background (fogged hills/cottages).
4. **Lighting & Shadows:** Directional shadows, 6–8 warm point lights, normal-mapped sprite relief, rim light.
5. **Volumetrics & Fog:** Visible light shafts, depth mist, floating dust motes.
6. **Reflections:** Water reflects houses/lights with wave ripple; wet cobbles reflect warm lights in rain.
7. **HD-2D Post-Processing:** Tilt-shift DOF keeps hero sharp while blurring FG/BG; bloom only on bright lights; balanced grading/vignette.
8. **Liveliness:** Swaying trees/flowers, rain/leaves, birds, butterflies/fireflies, chimney smoke, flickering lamps, rippling water.
9. **Chibi Character:** 2-head ratio, appealing details, grounded contact shadow, reacts to scene lighting.
10. **Reference Parity:** Compare side-by-side against Octopath Traveler / The Last Night / Long Gone principles.
11. **Technical Solidity:** Clean logs, reproducible 1-command run, stable FPS recorded.

## Step 3: Output `reviews/review-NN.md`
Every fix item MUST be specific and measurable (e.g., `"[High] Increase tilt-shift DOF near blur so foreground bushes at z>7 show >= 6px blur radius; re-submit FINAL-hero.png and FINAL-ab-dof.png"`).

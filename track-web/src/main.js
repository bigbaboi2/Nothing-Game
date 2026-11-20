import * as THREE from 'three';
import { TIME_PRESETS, POINT_LIGHTS_DATA, createSkyDome } from './lighting.js';
import {
  createSharedLightUniforms,
  createGroundMaterial,
  addSprite,
  addContactShadow,
} from './sprites.js';
import { createCanalWater } from './water.js';
import { createAtmosphereSystems } from './particles.js';
import { createPostPipeline } from './post.js';

const W = 1920, H = 1080;

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(28, 16 / 9, 0.5, 120);
const HERO_CAM_POS = new THREE.Vector3(0.5, 13.0, 25.5);
const HERO_CAM_LOOK = new THREE.Vector3(0.5, 2.5, -1.5);
const CLOSEUP_CAM_POS = new THREE.Vector3(-1.2, 2.6, 7.6);
const CLOSEUP_CAM_LOOK = new THREE.Vector3(-1.2, 1.55, 2.2);

camera.position.copy(HERO_CAM_POS);
camera.lookAt(HERO_CAM_LOOK);

const sharedUniforms = createSharedLightUniforms();
const skyDome = createSkyDome();
scene.add(skyDome);

// ---------- GROUND, ROAD & CANAL EMBANKMENT ----------
// Grass terrain
const grassGeo = new THREE.PlaneGeometry(72, 56);
grassGeo.rotateX(-Math.PI / 2);
const grassMat = createGroundMaterial('ground_grass', 18, 14, sharedUniforms, false);
const grassMesh = new THREE.Mesh(grassGeo, grassMat);
grassMesh.position.set(0, 0, -4);
scene.add(grassMesh);

// Cobblestone street (midground leading to bridge)
const cobbleGeo = new THREE.PlaneGeometry(24, 4.4);
cobbleGeo.rotateX(-Math.PI / 2);
const cobbleMat = createGroundMaterial('ground_cobble', 6, 1.1, sharedUniforms, true);
const cobbleMesh = new THREE.Mesh(cobbleGeo, cobbleMat);
cobbleMesh.position.set(-2.5, 0.015, 2.5);
scene.add(cobbleMesh);

// Canal cut-out dark basin + stone embankment walls
const basinGeo = new THREE.PlaneGeometry(24, 9.6);
basinGeo.rotateX(-Math.PI / 2);
const basinMat = new THREE.MeshBasicMaterial({ color: 0x0b101d });
const basinMesh = new THREE.Mesh(basinGeo, basinMat);
basinMesh.position.set(8.5, -0.25, 8.2);
scene.add(basinMesh);

const wallMat = createGroundMaterial('ground_cobble', 8, 1, sharedUniforms, false);
const northBank = new THREE.Mesh(new THREE.BoxGeometry(24, 0.55, 0.45), wallMat);
northBank.position.set(8.5, -0.05, 3.55);
scene.add(northBank);

const westBank = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 9.6), wallMat);
westBank.position.set(-3.3, -0.05, 8.2);
scene.add(westBank);

// Reflective Water
const { waterMesh, waterMat, renderReflection } = createCanalWater(sharedUniforms);
scene.add(waterMesh);

// ---------- 3-LAYER OBJECT PLACEMENT (per shared/scene-brief.md) ----------
// 1. HERO CHIBI (Rule of thirds left-center, sharp focus)
const heroSprite = addSprite(scene, 'chibi_hero', 40, 48, -1.2, 0.0, 2.2, sharedUniforms, {
  hasEmissive: true,
  swayAmount: 0.025,
  swayPhase: 0.0,
  rimStrength: 0.35,
});
addContactShadow(scene, -1.2, 2.2, 0.72, 0.4, 0.48);

// 2. MIDGROUND BUILDINGS & BRIDGE
addSprite(scene, 'house_inn', 224, 208, -7.8, 0.0, -2.5, sharedUniforms, {
  hasEmissive: true,
  billboard: false,
  rotY: 0.14,
  rimStrength: 0.22,
});
addContactShadow(scene, -7.8, -2.5, 6.8, 1.8, 0.38);

addSprite(scene, 'house_cottage', 160, 160, 7.6, 0.0, -4.2, sharedUniforms, {
  hasEmissive: true,
  billboard: false,
  rotY: -0.18,
  rimStrength: 0.22,
});
addContactShadow(scene, 7.6, -4.2, 4.8, 1.5, 0.36);

addSprite(scene, 'bridge', 128, 64, 6.5, -0.25, 3.8, sharedUniforms, {
  billboard: false,
  rotY: -0.1,
});
addSprite(scene, 'dock', 96, 48, 10.2, -0.28, 4.3, sharedUniforms, { billboard: false });
addSprite(scene, 'rowboat', 64, 32, 11.4, -0.26, 6.6, sharedUniforms, {
  swayAmount: 0.04,
  swayPhase: 1.2,
});

// 3. TREES (Hero Oak, Autumn Maple, Background Pines)
addSprite(scene, 'tree_hero', 192, 240, -1.2, 0.0, -4.8, sharedUniforms, {
  swayAmount: 0.18,
  swayPhase: 0.4,
  rimStrength: 0.3,
});
addContactShadow(scene, -1.2, -4.8, 3.6, 1.4, 0.42);

addSprite(scene, 'tree_autumn', 128, 176, 12.6, 0.0, -2.8, sharedUniforms, {
  swayAmount: 0.16,
  swayPhase: 1.9,
});
addSprite(scene, 'tree_autumn', 128, 176, -14.2, 0.0, 0.8, sharedUniforms, {
  swayAmount: 0.15,
  swayPhase: 2.7,
});

// 4. STREETLAMPS & PROPS
addSprite(scene, 'streetlamp', 24, 64, -4.5, 0.0, 1.2, sharedUniforms, { hasEmissive: true, swayAmount: 0.02 });
addSprite(scene, 'streetlamp', 24, 64, 4.0, 0.0, 1.8, sharedUniforms, { hasEmissive: true, swayAmount: 0.02 });
addSprite(scene, 'streetlamp', 24, 64, 10.4, 0.0, 3.7, sharedUniforms, { hasEmissive: true, swayAmount: 0.02 });

addSprite(scene, 'bench', 48, 24, -3.1, 0.0, 0.6, sharedUniforms);
addSprite(scene, 'barrel', 24, 28, -10.8, 0.0, 0.2, sharedUniforms);
addSprite(scene, 'barrel', 24, 28, -9.9, 0.0, 0.5, sharedUniforms);
addSprite(scene, 'crate', 28, 24, -6.2, 0.0, 0.5, sharedUniforms);
addSprite(scene, 'jar', 18, 24, -5.2, 0.0, 0.7, sharedUniforms);
addSprite(scene, 'jar', 18, 24, 5.5, 0.0, -1.6, sharedUniforms);
addSprite(scene, 'signpost', 24, 40, 1.6, 0.0, 0.7, sharedUniforms);
addSprite(scene, 'banner', 96, 24, -3.5, 4.8, -0.5, sharedUniforms, {
  billboard: false,
  swayAmount: 0.08,
  swayPhase: 0.8,
});

// 5. FOREGROUND FRAMING (z = +6.5 to +10.5, blurred by Tilt-Shift DOF)
addSprite(scene, 'fence', 64, 28, -8.5, 0.0, 7.2, sharedUniforms, { billboard: false });
addSprite(scene, 'fence', 64, 28, -4.6, 0.0, 7.2, sharedUniforms, { billboard: false });
addSprite(scene, 'bush_pink', 48, 36, -9.8, 0.0, 8.2, sharedUniforms, { swayAmount: 0.12, swayPhase: 0.3 });
addSprite(scene, 'bush_gold', 48, 36, -6.4, 0.0, 8.6, sharedUniforms, { swayAmount: 0.12, swayPhase: 1.4 });
addSprite(scene, 'bush_pink', 48, 36, 9.5, 0.0, 9.2, sharedUniforms, { swayAmount: 0.12, swayPhase: 2.1 });
addSprite(scene, 'bush_gold', 48, 36, -12.0, 0.0, 6.2, sharedUniforms, { swayAmount: 0.11, swayPhase: 0.9 });
addSprite(scene, 'bush_pink', 48, 36, 2.2, 0.0, 0.4, sharedUniforms, { swayAmount: 0.08, swayPhase: 2.8 });
addSprite(scene, 'bush_gold', 48, 36, 8.8, 0.0, -1.4, sharedUniforms, { swayAmount: 0.08, swayPhase: 1.1 });

// 6. BACKGROUND VILLAGE & LAYERED FOREST (z = -11 to -22, fogged + DOF blurred)
addSprite(scene, 'house_distant', 112, 112, -14.0, 0.0, -13.0, sharedUniforms, { hasEmissive: true, billboard: false });
addSprite(scene, 'house_distant', 112, 112, 1.5, 0.0, -15.5, sharedUniforms, { hasEmissive: true, billboard: false });
addSprite(scene, 'house_distant', 112, 112, 14.5, 0.0, -14.0, sharedUniforms, { hasEmissive: true, billboard: false });

const pineCoords = [
  [-18, -11], [-11, -13], [-5.5, -14], [4.5, -13.5], [10.5, -12.5], [18, -12],
  [-15, -17], [-7, -18], [0, -19], [8, -18], [16, -17],
];
pineCoords.forEach(([px, pz], idx) => {
  addSprite(scene, 'tree_pine', 80, 144, px, 0.0, pz, sharedUniforms, {
    swayAmount: 0.12,
    swayPhase: idx * 0.65,
  });
});

// Debug light spheres (hidden unless lightsDebug=true)
const lightDebugGroup = new THREE.Group();
for (const l of POINT_LIGHTS_DATA) {
  const s = new THREE.Mesh(
    new THREE.SphereGeometry(l.radius, 12, 10),
    new THREE.MeshBasicMaterial({ color: l.color, wireframe: true, transparent: true, opacity: 0.45 })
  );
  s.position.copy(l.pos);
  lightDebugGroup.add(s);
}
lightDebugGroup.visible = false;
scene.add(lightDebugGroup);

// ---------- ATMOSPHERE & POST-PROCESSING ----------
const atmosphere = createAtmosphereSystems(scene);
const post = createPostPipeline(renderer, scene, camera, W, H);

// ---------- STATE MANAGEMENT ----------
const state = {
  time: 'dusk',
  weather: 'clear',
  bloom: true,
  dof: true,
  volumetric: true,
  reflection: true,
  lightsDebug: false,
  cameraMode: 'hero',
  simTime: 2.5,
};

// Apply URL query parameters if present
const params = new URLSearchParams(window.location.search);
if (params.has('time')) state.time = params.get('time');
if (params.has('weather')) state.weather = params.get('weather');

function applyState(timeSec) {
  const preset = TIME_PRESETS[state.time] || TIME_PRESETS.dusk;
  sharedUniforms.uTime.value = timeSec;
  sharedUniforms.uSunDir.value.copy(preset.sunDir);
  sharedUniforms.uSunColor.value.copy(preset.sunColor);
  sharedUniforms.uSunIntensity.value = preset.sunIntensity;
  sharedUniforms.uAmbientColor.value.copy(preset.ambientColor);
  sharedUniforms.uAmbientIntensity.value = preset.ambientIntensity;
  sharedUniforms.uFogColor.value.copy(preset.fogColor);
  sharedUniforms.uFogDensity.value = preset.fogDensity;
  sharedUniforms.uEmissiveScale.value = preset.emissiveScale;
  sharedUniforms.uWetness.value = state.weather === 'rain' ? 0.92 : 0.0;

  skyDome.material.uniforms.uTop.value.copy(preset.skyTop);
  skyDome.material.uniforms.uMid.value.copy(preset.skyMid);
  skyDome.material.uniforms.uHorizon.value.copy(preset.skyHorizon);
  skyDome.material.uniforms.uTime.value = timeSec;

  waterMat.uniforms.uReflectOn.value = state.reflection ? 1.0 : 0.0;
  waterMat.uniforms.uSkyTint.value.copy(preset.skyMid);

  // Update 7 flickering point lights
  for (let i = 0; i < POINT_LIGHTS_DATA.length; i++) {
    const ld = POINT_LIGHTS_DATA[i];
    const flick = 1.0 + Math.sin(timeSec * 6.5 + i * 2.3) * ld.flicker * 0.5
                      + Math.cos(timeSec * 11.2 + i) * ld.flicker * 0.5;
    sharedUniforms.uPointPos.value[i].copy(ld.pos);
    sharedUniforms.uPointColor.value[i].copy(ld.color);
    sharedUniforms.uPointParams.value[i].set(ld.radius, ld.baseIntensity * preset.pointScale * flick);
  }

  // Camera mode
  if (state.cameraMode === 'closeup') {
    camera.position.copy(CLOSEUP_CAM_POS);
    camera.lookAt(CLOSEUP_CAM_LOOK);
    post.dofPass.uniforms.uEnabled.value = 0.0;
  } else {
    camera.position.copy(HERO_CAM_POS);
    camera.lookAt(HERO_CAM_LOOK);
    post.dofPass.uniforms.uEnabled.value = state.dof ? 1.0 : 0.0;
  }

  post.bloomPass.strength = state.bloom ? (state.time === 'day' ? 0.25 : 0.42) : 0.0;
  post.gradePass.uniforms.uTime.value = timeSec;
  post.gradePass.uniforms.uWarm.value = preset.gradeWarm;
  post.gradePass.uniforms.uCool.value = preset.gradeCool;
  post.gradePass.uniforms.uExposure.value = preset.exposure;

  lightDebugGroup.visible = state.lightsDebug;
  atmosphere.update(timeSec, {
    weather: state.weather,
    timeOfDay: state.time,
    volumetricOn: state.volumetric,
  });
}

function renderOnce(timeSec = state.simTime) {
  applyState(timeSec);
  renderReflection(renderer, scene, camera);
  post.composer.render();
}

window.__setState = (next) => {
  Object.assign(state, next);
  renderOnce(state.simTime);
};
window.__renderNow = (t) => {
  if (typeof t === 'number') state.simTime = t;
  renderOnce(state.simTime);
};
window.__getFPS = () => currentFps;

window.addEventListener('keydown', (e) => {
  if (e.key === '1') state.time = 'dawn';
  if (e.key === '2') state.time = 'day';
  if (e.key === '3') state.time = 'dusk';
  if (e.key === '4') state.time = 'night';
  if (e.key === 'q') state.weather = 'clear';
  if (e.key === 'w') state.weather = 'rain';
  if (e.key === 'e') state.weather = 'leaves';
  if (e.key === 'b') state.bloom = !state.bloom;
  if (e.key === 'd') state.dof = !state.dof;
  if (e.key === 'v') state.volumetric = !state.volumetric;
  if (e.key === 'r') state.reflection = !state.reflection;
});

let lastT = performance.now();
let frames = 0;
let currentFps = 60;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  state.simTime += dt;
  renderOnce(state.simTime);

  frames++;
  const now = performance.now();
  if (now - lastT >= 1000) {
    currentFps = Math.round((frames * 1000) / (now - lastT));
    frames = 0;
    lastT = now;
  }
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

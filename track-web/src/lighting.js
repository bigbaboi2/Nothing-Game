import * as THREE from 'three';

export const TIME_PRESETS = {
  dawn: {
    sunDir: new THREE.Vector3(0.65, 0.34, -0.68).normalize(),
    sunColor: new THREE.Color('#ffbe8c'),
    sunIntensity: 1.35,
    ambientColor: new THREE.Color('#5a5482'),
    ambientIntensity: 0.72,
    fogColor: new THREE.Color('#6b587a'),
    fogDensity: 0.017,
    skyTop: new THREE.Color('#282852'),
    skyMid: new THREE.Color('#7a5375'),
    skyHorizon: new THREE.Color('#f2a57c'),
    pointScale: 0.65,
    emissiveScale: 0.75,
    gradeWarm: 0.12,
    gradeCool: 0.06,
    exposure: 1.08,
  },
  day: {
    sunDir: new THREE.Vector3(-0.35, 0.78, -0.52).normalize(),
    sunColor: new THREE.Color('#fff5e0'),
    sunIntensity: 1.75,
    ambientColor: new THREE.Color('#7c98bf'),
    ambientIntensity: 0.92,
    fogColor: new THREE.Color('#9ec0db'),
    fogDensity: 0.011,
    skyTop: new THREE.Color('#3b6fa8'),
    skyMid: new THREE.Color('#70a7cf'),
    skyHorizon: new THREE.Color('#d8ecf2'),
    pointScale: 0.25,
    emissiveScale: 0.3,
    gradeWarm: 0.05,
    gradeCool: 0.02,
    exposure: 1.05,
  },
  dusk: {
    sunDir: new THREE.Vector3(-0.6, 0.42, -0.68).normalize(),
    sunColor: new THREE.Color('#ff9a52'),
    sunIntensity: 1.4,
    ambientColor: new THREE.Color('#383f73'),
    ambientIntensity: 0.68,
    fogColor: new THREE.Color('#3c3259'),
    fogDensity: 0.018,
    skyTop: new THREE.Color('#141326'),
    skyMid: new THREE.Color('#4a3159'),
    skyHorizon: new THREE.Color('#eda879'),
    pointScale: 1.15,
    emissiveScale: 1.05,
    gradeWarm: 0.16,
    gradeCool: 0.14,
    exposure: 1.12,
  },
  night: {
    sunDir: new THREE.Vector3(0.45, 0.62, -0.64).normalize(),
    sunColor: new THREE.Color('#7da4eb'),
    sunIntensity: 0.68,
    ambientColor: new THREE.Color('#1b2245'),
    ambientIntensity: 0.45,
    fogColor: new THREE.Color('#13172e'),
    fogDensity: 0.022,
    skyTop: new THREE.Color('#090b1a'),
    skyMid: new THREE.Color('#151d3b'),
    skyHorizon: new THREE.Color('#27355c'),
    pointScale: 1.4,
    emissiveScale: 1.2,
    gradeWarm: 0.10,
    gradeCool: 0.20,
    exposure: 1.10,
  },
};

export const POINT_LIGHTS_DATA = [
  { pos: new THREE.Vector3(-0.5, 1.4, 2.3), color: new THREE.Color('#ffca4f'), radius: 5.0, baseIntensity: 2.2, flicker: 0.12 },
  { pos: new THREE.Vector3(-4.2, 3.6, 1.2), color: new THREE.Color('#ffa940'), radius: 8.5, baseIntensity: 3.2, flicker: 0.08 },
  { pos: new THREE.Vector3(4.2, 3.6, 1.8),  color: new THREE.Color('#ffa940'), radius: 8.5, baseIntensity: 3.2, flicker: 0.09 },
  { pos: new THREE.Vector3(-7.5, 2.4, 0.6), color: new THREE.Color('#ff9636'), radius: 7.5, baseIntensity: 2.8, flicker: 0.14 },
  { pos: new THREE.Vector3(-6.8, 6.2, 0.4), color: new THREE.Color('#ffb85c'), radius: 6.5, baseIntensity: 2.0, flicker: 0.10 },
  { pos: new THREE.Vector3(7.2, 2.5, -1.8), color: new THREE.Color('#ff9636'), radius: 7.5, baseIntensity: 2.6, flicker: 0.11 },
  { pos: new THREE.Vector3(10.5, 2.2, 4.2), color: new THREE.Color('#ffaa44'), radius: 7.0, baseIntensity: 2.4, flicker: 0.10 },
];

export function createSkyDome() {
  const geo = new THREE.SphereGeometry(75, 32, 20);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTop: { value: new THREE.Color('#141326') },
      uMid: { value: new THREE.Color('#4a3159') },
      uHorizon: { value: new THREE.Color('#eda879') },
      uTime: { value: 0 },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTop;
      uniform vec3 uMid;
      uniform vec3 uHorizon;
      uniform float uTime;
      varying vec3 vWorldPos;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        vec3 d = normalize(vWorldPos);
        float h = clamp(d.y * 1.4, 0.0, 1.0);
        vec3 sky = mix(uHorizon, uMid, smoothstep(0.0, 0.35, h));
        sky = mix(sky, uTop, smoothstep(0.32, 0.85, h));

        // Subtle pixel-quantized drifting clouds
        if (d.y > 0.04) {
          vec2 cuv = d.xz / (d.y + 0.28) * 1.6 + vec2(uTime * 0.025, 0.0);
          cuv = floor(cuv * 24.0) / 24.0;
          float c = noise(cuv) * 0.6 + noise(cuv * 2.1) * 0.4;
          float cloudMask = smoothstep(0.56, 0.72, c) * smoothstep(0.04, 0.22, d.y);
          vec3 cloudCol = mix(uMid * 1.15, uHorizon * 1.05, 0.55);
          sky = mix(sky, cloudCol, cloudMask * 0.45);
        }
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
  });
  return new THREE.Mesh(geo, mat);
}

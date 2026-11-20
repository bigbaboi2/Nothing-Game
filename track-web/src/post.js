import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const TiltShiftDOFShader = {
  uniforms: {
    tDiffuse: { value: null },
    uResolution: { value: new THREE.Vector2(1920, 1080) },
    uFocusY: { value: 0.45 },
    uFocusBand: { value: 0.17 },
    uBlurAmount: { value: 1.0 },
    uEnabled: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 uResolution;
    uniform float uFocusY;
    uniform float uFocusBand;
    uniform float uBlurAmount;
    uniform float uEnabled;
    varying vec2 vUv;

    void main() {
      vec4 center = texture2D(tDiffuse, vUv);
      if (uEnabled < 0.5) {
        gl_FragColor = center;
        return;
      }

      // Tilt-shift band: razor sharp around hero, smooth bokeh blur top & bottom
      float distFromBand = max(0.0, abs(vUv.y - uFocusY) - uFocusBand);
      float coc = clamp(distFromBand / 0.32, 0.0, 1.0);
      coc = coc * coc * uBlurAmount;

      if (coc < 0.01) {
        gl_FragColor = center;
        return;
      }

      vec2 texel = (1.0 / uResolution) * (coc * 9.5);
      // 12-tap Vogel/disc bokeh kernel
      vec2 taps[12];
      taps[0]  = vec2( 1.00,  0.00);
      taps[1]  = vec2( 0.86,  0.50);
      taps[2]  = vec2( 0.50,  0.86);
      taps[3]  = vec2( 0.00,  1.00);
      taps[4]  = vec2(-0.50,  0.86);
      taps[5]  = vec2(-0.86,  0.50);
      taps[6]  = vec2(-1.00,  0.00);
      taps[7]  = vec2(-0.86, -0.50);
      taps[8]  = vec2(-0.50, -0.86);
      taps[9]  = vec2( 0.00, -1.00);
      taps[10] = vec2( 0.50, -0.86);
      taps[11] = vec2( 0.86, -0.50);

      vec3 acc = center.rgb;
      float wSum = 1.0;
      for (int i = 0; i < 12; i++) {
        vec3 s1 = texture2D(tDiffuse, clamp(vUv + taps[i] * texel, 0.001, 0.999)).rgb;
        vec3 s2 = texture2D(tDiffuse, clamp(vUv + taps[i] * texel * 0.5, 0.001, 0.999)).rgb;
        // Slight bokeh highlight boost
        float w1 = 1.0 + dot(s1, vec3(0.299, 0.587, 0.114)) * 0.65;
        float w2 = 1.0 + dot(s2, vec3(0.299, 0.587, 0.114)) * 0.45;
        acc += s1 * w1 + s2 * w2;
        wSum += w1 + w2;
      }
      gl_FragColor = vec4(acc / wSum, 1.0);
    }
  `,
};

const GradingVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uWarm: { value: 0.16 },
    uCool: { value: 0.14 },
    uExposure: { value: 1.12 },
    uVignette: { value: 0.24 },
    uGrain: { value: 0.022 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uWarm;
    uniform float uCool;
    uniform float uExposure;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    vec3 aces(vec3 x) {
      return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb * uExposure;
      col = aces(col);

      // Split-tone: cool shadows, warm highlights
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 coolShadow = vec3(0.18, 0.22, 0.42);
      vec3 warmHigh = vec3(1.08, 0.95, 0.78);
      col = mix(col, col * (1.0 + coolShadow * 0.8), (1.0 - smoothstep(0.0, 0.45, luma)) * uCool);
      col = mix(col, col * warmHigh, smoothstep(0.45, 1.0, luma) * uWarm);

      // Vignette
      vec2 d = vUv - 0.5;
      float vig = 1.0 - dot(d, d) * uVignette * 2.2;
      col *= clamp(vig, 0.55, 1.0);

      // Subtle film grain
      float g = (rand(vUv * 512.0 + fract(uTime)) - 0.5) * uGrain;
      col += g;

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `,
};

export function createPostPipeline(renderer, scene, camera, width, height) {
  const composer = new EffectComposer(renderer);
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 0.42, 0.88);
  composer.addPass(bloomPass);

  const dofPass = new ShaderPass(TiltShiftDOFShader);
  dofPass.uniforms.uResolution.value.set(width, height);
  composer.addPass(dofPass);

  const gradePass = new ShaderPass(GradingVignetteShader);
  composer.addPass(gradePass);

  return { composer, bloomPass, dofPass, gradePass };
}

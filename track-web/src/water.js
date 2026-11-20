import * as THREE from 'three';

export function createCanalWater(sharedUniforms) {
  const reflectionRT = new THREE.WebGLRenderTarget(960, 540, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
  });

  const waterGeo = new THREE.PlaneGeometry(24, 9.5);
  waterGeo.rotateX(-Math.PI / 2);

  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      ...sharedUniforms,
      uReflectionMap: { value: reflectionRT.texture },
      uReflectOn: { value: 1.0 },
      uWaterDeep: { value: new THREE.Color('#172842') },
      uWaterShallow: { value: new THREE.Color('#234163') },
      uSkyTint: { value: new THREE.Color('#4a3159') },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec4 vClipPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vClipPos = projectionMatrix * viewMatrix * wp;
        gl_Position = vClipPos;
      }
    `,
    fragmentShader: `
      uniform sampler2D uReflectionMap;
      uniform float uReflectOn;
      uniform float uTime;
      uniform vec3 uWaterDeep;
      uniform vec3 uWaterShallow;
      uniform vec3 uSkyTint;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform vec3 uPointPos[7];
      uniform vec3 uPointColor[7];
      uniform vec2 uPointParams[7];

      varying vec3 vWorldPos;
      varying vec4 vClipPos;

      void main() {
        // Pixel-quantized ripple coordinates for authentic HD-2D water
        vec2 wp = floor(vWorldPos.xz * 16.0) / 16.0;
        float w1 = sin(wp.x * 2.8 + uTime * 2.2 + wp.y * 1.1);
        float w2 = cos(wp.y * 4.2 - uTime * 1.7 + wp.x * 0.9);
        float ripple = (w1 + w2) * 0.5;

        vec2 ndc = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;
        vec2 reflUv = vec2(ndc.x, 1.0 - ndc.y);
        reflUv.x += ripple * 0.012;
        reflUv.y += w2 * 0.008;
        reflUv = clamp(reflUv, 0.002, 0.998);

        vec3 baseWater = mix(uWaterDeep, uWaterShallow, smoothstep(-0.6, 0.8, ripple));
        vec3 reflCol = texture2D(uReflectionMap, reflUv).rgb;

        float fresnel = 0.52 * uReflectOn;
        vec3 col = mix(baseWater, reflCol, fresnel);

        // Specular warm glints from lamps on water ripples
        for (int i = 0; i < 7; i++) {
          vec3 lVec = uPointPos[i] - vWorldPos;
          float dist = length(lVec.xz);
          float rad = uPointParams[i].x * 1.3;
          if (dist < rad) {
            float att = pow(1.0 - dist / rad, 1.7);
            float glint = smoothstep(0.62, 0.92, ripple + 0.35 * sin(wp.x * 5.0 + uTime * 3.0));
            col += uPointColor[i] * uPointParams[i].y * att * (0.14 + glint * 0.55);
          }
        }

        // Subtle shoreline foam along north bank (z ~ 3.5)
        float bankDist = abs(vWorldPos.z - 3.6);
        if (bankDist < 0.25 + 0.08 * w1) {
          col = mix(col, vec3(0.45, 0.62, 0.72), 0.35);
        }

        float camDist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(camDist * uFogDensity, 1.6));
        col = mix(col, uFogColor, clamp(fogFactor, 0.0, 0.92));

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.set(8.5, -0.18, 8.2);

  // Mirror camera for planar reflection
  const mirrorCam = new THREE.PerspectiveCamera();

  function renderReflection(renderer, scene, mainCam) {
    if (waterMat.uniforms.uReflectOn.value < 0.5) return;
    const waterY = waterMesh.position.y;
    mirrorCam.copy(mainCam);
    mirrorCam.position.y = 2 * waterY - mainCam.position.y;
    mirrorCam.lookAt(0, 2 * waterY - 2.2, -1.5);
    mirrorCam.updateMatrixWorld();

    waterMesh.visible = false;
    const prevTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(reflectionRT);
    renderer.clear();
    renderer.render(scene, mirrorCam);
    renderer.setRenderTarget(prevTarget);
    waterMesh.visible = true;
  }

  return { waterMesh, waterMat, renderReflection };
}

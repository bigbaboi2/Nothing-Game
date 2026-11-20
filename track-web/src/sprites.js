import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function loadPixelTex(url, repeatX = 1, repeatY = 1) {
  const tex = loader.load(url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  return tex;
}

export function loadDataTex(url, repeatX = 1, repeatY = 1) {
  const tex = loader.load(url);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.NoColorSpace;
  if (repeatX > 1 || repeatY > 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  return tex;
}

const MAX_LIGHTS = 7;

export function createSharedLightUniforms() {
  return {
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(-0.6, 0.42, -0.68).normalize() },
    uSunColor: { value: new THREE.Color('#ff9a52') },
    uSunIntensity: { value: 1.4 },
    uAmbientColor: { value: new THREE.Color('#383f73') },
    uAmbientIntensity: { value: 0.68 },
    uFogColor: { value: new THREE.Color('#3c3259') },
    uFogDensity: { value: 0.018 },
    uEmissiveScale: { value: 1.45 },
    uWetness: { value: 0.0 },
    uPointPos: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3()) },
    uPointColor: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Color()) },
    uPointParams: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector2(6, 1)) }, // x=radius, y=intensity
  };
}

export function createSpriteMaterial(name, sharedUniforms, {
  hasEmissive = false,
  swayAmount = 0.0,
  swayPhase = 0.0,
  billboard = true,
  rimStrength = 0.25,
} = {}) {
  const map = loadPixelTex(`/assets/sprites/${name}.png`);
  const normalMap = loadDataTex(`/assets/sprites/${name}_n.png`);
  const emissiveMap = hasEmissive ? loadPixelTex(`/assets/sprites/${name}_e.png`) : null;

  return new THREE.ShaderMaterial({
    transparent: false,
    side: THREE.DoubleSide,
    uniforms: {
      ...sharedUniforms,
      uMap: { value: map },
      uNormalMap: { value: normalMap },
      uEmissiveMap: { value: emissiveMap },
      uHasEmissive: { value: hasEmissive ? 1.0 : 0.0 },
      uSwayAmount: { value: swayAmount },
      uSwayPhase: { value: swayPhase },
      uBillboard: { value: billboard ? 1.0 : 0.0 },
      uRimStrength: { value: rimStrength },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uSwayAmount;
      uniform float uSwayPhase;
      uniform float uBillboard;
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;

      void main() {
        vUv = uv;
        vec3 pos = position;
        // Wind sway stronger near top of sprite (uv.y)
        float sway = sin(uTime * 1.9 + uSwayPhase + pos.y * 0.6) * uSwayAmount * pow(uv.y, 1.3);
        pos.x += sway;

        vec4 wp;
        if (uBillboard > 0.5) {
          vec3 origin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          vec3 toCam = normalize(vec3(cameraPosition.x - origin.x, 0.0, cameraPosition.z - origin.z));
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
          vec3 up = vec3(0.0, 1.0, 0.0);
          vec3 worldOffset = right * pos.x + up * pos.y + toCam * pos.z;
          wp = vec4(origin + worldOffset, 1.0);
          vNormalW = toCam;
        } else {
          wp = modelMatrix * vec4(pos, 1.0);
          vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
        }
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform sampler2D uNormalMap;
      uniform sampler2D uEmissiveMap;
      uniform float uHasEmissive;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uSunIntensity;
      uniform vec3 uAmbientColor;
      uniform float uAmbientIntensity;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform float uEmissiveScale;
      uniform float uRimStrength;
      uniform vec3 uPointPos[7];
      uniform vec3 uPointColor[7];
      uniform vec2 uPointParams[7];

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vNormalW;

      void main() {
        vec4 tex = texture2D(uMap, vUv);
        if (tex.a < 0.5) discard;

        vec3 nMap = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
        vec3 baseN = normalize(vNormalW);
        vec3 up = vec3(0.0, 1.0, 0.0);
        vec3 right = normalize(cross(up, baseN));
        vec3 N = normalize(right * nMap.x + up * nMap.y + baseN * nMap.z);

        vec3 V = normalize(cameraPosition - vWorldPos);
        float sunDiff = max(dot(N, uSunDir), 0.0);
        // Soft wrap lighting for pixel art warmth
        float wrapDiff = max((dot(N, uSunDir) + 0.35) / 1.35, 0.0);
        vec3 light = uAmbientColor * uAmbientIntensity + uSunColor * uSunIntensity * mix(wrapDiff, sunDiff, 0.55);

        // Rim light from sun/moon edge
        float rim = pow(1.0 - max(dot(baseN, V), 0.0), 2.5) * uRimStrength;
        light += uSunColor * rim * uSunIntensity;

        // 7 Dynamic Point Lights
        for (int i = 0; i < 7; i++) {
          vec3 lVec = uPointPos[i] - vWorldPos;
          float dist = length(lVec);
          float rad = uPointParams[i].x;
          if (dist < rad) {
            vec3 L = lVec / max(dist, 0.001);
            float att = pow(1.0 - dist / rad, 1.85);
            float ndl = max(dot(N, L) * 0.7 + 0.3, 0.0);
            light += uPointColor[i] * uPointParams[i].y * att * ndl;
          }
        }

        vec3 color = tex.rgb * light;

        // Emissive warm windows & lanterns
        if (uHasEmissive > 0.5) {
          vec4 em = texture2D(uEmissiveMap, vUv);
          if (em.a > 0.1) {
            color += em.rgb * uEmissiveScale;
          }
        }

        // Exponential distance fog
        float camDist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(camDist * uFogDensity, 1.6));
        color = mix(color, uFogColor, clamp(fogFactor, 0.0, 0.92));

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

export function createGroundMaterial(texName, repeatX, repeatY, sharedUniforms, isCobble = false) {
  const map = loadPixelTex(`/assets/sprites/${texName}.png`, repeatX, repeatY);
  const normalMap = loadDataTex(`/assets/sprites/${texName}_n.png`, repeatX, repeatY);

  return new THREE.ShaderMaterial({
    uniforms: {
      ...sharedUniforms,
      uMap: { value: map },
      uNormalMap: { value: normalMap },
      uRepeat: { value: new THREE.Vector2(repeatX, repeatY) },
      uIsCobble: { value: isCobble ? 1.0 : 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform sampler2D uNormalMap;
      uniform vec2 uRepeat;
      uniform float uIsCobble;
      uniform float uWetness;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uSunIntensity;
      uniform vec3 uAmbientColor;
      uniform float uAmbientIntensity;
      uniform vec3 uFogColor;
      uniform float uFogDensity;
      uniform vec3 uPointPos[7];
      uniform vec3 uPointColor[7];
      uniform vec2 uPointParams[7];

      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        vec2 ruv = vUv * uRepeat;
        vec4 tex = texture2D(uMap, ruv);
        vec3 nMap = texture2D(uNormalMap, ruv).xyz * 2.0 - 1.0;
        vec3 N = normalize(vec3(nMap.x, nMap.z, -nMap.y));
        vec3 V = normalize(cameraPosition - vWorldPos);

        float sunDiff = max(dot(N, uSunDir), 0.0);
        vec3 light = uAmbientColor * uAmbientIntensity + uSunColor * uSunIntensity * sunDiff;

        vec3 specTotal = vec3(0.0);
        for (int i = 0; i < 7; i++) {
          vec3 lVec = uPointPos[i] - vWorldPos;
          float dist = length(lVec);
          float rad = uPointParams[i].x;
          if (dist < rad) {
            vec3 L = lVec / max(dist, 0.001);
            float att = pow(1.0 - dist / rad, 1.85);
            float ndl = max(dot(N, L), 0.0);
            light += uPointColor[i] * uPointParams[i].y * att * ndl;

            // Wet cobblestone specular reflections from warm lamps!
            if (uIsCobble > 0.5 && uWetness > 0.05) {
              vec3 H = normalize(L + V);
              float spec = pow(max(dot(N, H), 0.0), 36.0);
              specTotal += uPointColor[i] * uPointParams[i].y * att * spec * uWetness * 1.8;
            }
          }
        }

        // Cloud shadow gobo sweep
        vec3 baseCol = tex.rgb * (1.0 - uWetness * 0.25 * uIsCobble);
        vec3 color = baseCol * light + specTotal;

        float camDist = length(cameraPosition - vWorldPos);
        float fogFactor = 1.0 - exp(-pow(camDist * uFogDensity, 1.6));
        color = mix(color, uFogColor, clamp(fogFactor, 0.0, 0.92));

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

export function addSprite(scene, name, wPx, hPx, x, y, z, sharedUniforms, opts = {}) {
  const w = wPx / 16;
  const h = hPx / 16;
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const mat = createSpriteMaterial(name, sharedUniforms, opts);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  if (opts.rotY) mesh.rotation.y = opts.rotY;
  scene.add(mesh);
  return mesh;
}

export function addContactShadow(scene, x, z, rx = 1.1, rz = 0.65, opacity = 0.42) {
  const geo = new THREE.CircleGeometry(1, 16);
  geo.rotateX(-Math.PI / 2);
  geo.scale(rx, 1, rz);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x0b0a18,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, 0.025, z);
  scene.add(m);
  return m;
}

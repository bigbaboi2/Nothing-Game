import * as THREE from 'three';
import { loadPixelTex } from './sprites.js';

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createAtmosphereSystems(scene) {
  const rng = makeRng(909);

  // 1. Volumetric God-Ray Light Shafts (additive angled planes)
  const rayGroup = new THREE.Group();
  const rayMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ffbd78') },
      uOpacity: { value: 0.22 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float beam = sin(vUv.x * 3.14159);
        float vertical = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.15, vUv.y);
        float shimmer = 0.78 + 0.22 * sin(uTime * 1.1 + vUv.x * 8.0);
        float a = pow(beam, 1.6) * vertical * shimmer * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });

  const rayConfigs = [
    { pos: [-2.8, 7.2, -3.5], rotZ: -0.48, w: 3.4, h: 16.0 },
    { pos: [-0.4, 7.6, -2.8], rotZ: -0.45, w: 4.0, h: 17.0 },
    { pos: [2.2, 6.8, -3.8],  rotZ: -0.46, w: 3.0, h: 15.0 },
    { pos: [-5.5, 6.5, -1.2], rotZ: -0.44, w: 2.6, h: 14.0 },
  ];
  for (const rc of rayConfigs) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(rc.w, rc.h), rayMat);
    m.position.set(...rc.pos);
    m.rotation.z = rc.rotZ;
    m.rotation.y = 0.22;
    rayGroup.add(m);
  }
  scene.add(rayGroup);

  // 2. Chimney Smoke Puffs (Inn chimney around x = -3.8, y = 12.2, z = -2.4)
  const smokeCount = 18;
  const smokeGeo = new THREE.BufferGeometry();
  const smokePos = new Float32Array(smokeCount * 3);
  const smokeLife = new Float32Array(smokeCount);
  for (let i = 0; i < smokeCount; i++) {
    smokeLife[i] = i / smokeCount;
  }
  smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));
  const smokeMat = new THREE.PointsMaterial({
    color: 0xc2b8cf,
    size: 0.75,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const smokePoints = new THREE.Points(smokeGeo, smokeMat);
  scene.add(smokePoints);

  // 3. Fireflies & Floating Dust Motes
  const fireflyCount = 48;
  const ffGeo = new THREE.BufferGeometry();
  const ffPos = new Float32Array(fireflyCount * 3);
  const ffSeeds = [];
  for (let i = 0; i < fireflyCount; i++) {
    const x = (rng() - 0.5) * 26;
    const y = 0.6 + rng() * 5.2;
    const z = -5 + rng() * 14;
    ffPos[i * 3] = x; ffPos[i * 3 + 1] = y; ffPos[i * 3 + 2] = z;
    ffSeeds.push({ x, y, z, p: rng() * 6.28, s: 0.6 + rng() * 1.1 });
  }
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const ffMat = new THREE.PointsMaterial({
    color: 0xffe066,
    size: 0.22,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  scene.add(fireflies);

  // 4. Rain Streaks
  const rainCount = 420;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 6);
  const rainSeeds = [];
  for (let i = 0; i < rainCount; i++) {
    const x = (rng() - 0.5) * 32;
    const y = rng() * 18;
    const z = -10 + rng() * 24;
    rainSeeds.push({ x, y, z, speed: 15 + rng() * 6 });
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({
    color: 0x9ec4e8,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const rainLines = new THREE.LineSegments(rainGeo, rainMat);
  rainLines.visible = false;
  scene.add(rainLines);

  // 5. Falling Leaves
  const leafCount = 70;
  const leafTex = loadPixelTex('/assets/sprites/leaf.png');
  const leafGeo = new THREE.PlaneGeometry(0.28, 0.28);
  const leafMat = new THREE.MeshBasicMaterial({
    map: leafTex,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  const leafInst = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
  const leafSeeds = [];
  for (let i = 0; i < leafCount; i++) {
    leafSeeds.push({
      x: (rng() - 0.5) * 26,
      y: rng() * 14,
      z: -6 + rng() * 16,
      speed: 1.1 + rng() * 0.9,
      phase: rng() * 6.28,
    });
  }
  leafInst.visible = false;
  scene.add(leafInst);

  // 6. Birds (2 perched + 3 circling)
  const birdTex = loadPixelTex('/assets/sprites/bird.png');
  const birdMat = new THREE.MeshBasicMaterial({
    map: birdTex,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  const birds = [];
  const birdGeo = new THREE.PlaneGeometry(12 / 16, 10 / 16);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(birdGeo, birdMat);
    b.userData = { perched: i < 2, idx: i };
    scene.add(b);
    birds.push(b);
  }

  // 7. Butterflies (4 fluttering near flower bushes)
  const bfTex = loadPixelTex('/assets/sprites/butterfly.png');
  const bfMat = new THREE.MeshBasicMaterial({
    map: bfTex,
    transparent: true,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
  });
  const butterflies = [];
  const bfGeo = new THREE.PlaneGeometry(10 / 16, 8 / 16);
  const bfHomes = [
    [-7.5, 1.4, 6.2],
    [7.2, 1.3, 6.8],
    [-2.8, 1.5, 4.5],
    [1.8, 1.6, 3.2],
  ];
  for (let i = 0; i < bfHomes.length; i++) {
    const bf = new THREE.Mesh(bfGeo, bfMat);
    bf.userData = { home: bfHomes[i], phase: i * 1.7 };
    scene.add(bf);
    butterflies.push(bf);
  }

  const dummy = new THREE.Object3D();

  function update(time, { weather, timeOfDay, volumetricOn }) {
    rayGroup.visible = volumetricOn;
    rayMat.uniforms.uTime.value = time;
    rayMat.uniforms.uOpacity.value = timeOfDay === 'night' ? 0.12 : timeOfDay === 'day' ? 0.24 : 0.26;
    rayMat.uniforms.uColor.value.set(
      timeOfDay === 'night' ? '#8ab4ff' : timeOfDay === 'day' ? '#fff3d1' : '#ffbd78'
    );

    // Smoke
    const sArr = smokeGeo.attributes.position.array;
    for (let i = 0; i < smokeCount; i++) {
      const t = (smokeLife[i] + time * 0.16) % 1.0;
      sArr[i * 3] = -4.2 + Math.sin(time * 1.4 + i) * 0.25 + t * 1.1;
      sArr[i * 3 + 1] = 12.1 + t * 5.2;
      sArr[i * 3 + 2] = -2.4 + Math.cos(time + i) * 0.2;
    }
    smokeGeo.attributes.position.needsUpdate = true;

    // Fireflies (brighter at dusk/night)
    ffMat.opacity = timeOfDay === 'day' ? 0.22 : 0.85;
    const fArr = ffGeo.attributes.position.array;
    for (let i = 0; i < fireflyCount; i++) {
      const s = ffSeeds[i];
      fArr[i * 3] = s.x + Math.sin(time * s.s + s.p) * 0.7;
      fArr[i * 3 + 1] = s.y + Math.cos(time * s.s * 1.3 + s.p) * 0.45;
      fArr[i * 3 + 2] = s.z + Math.sin(time * 0.7 + s.p) * 0.5;
    }
    ffGeo.attributes.position.needsUpdate = true;

    // Rain
    rainLines.visible = weather === 'rain';
    if (rainLines.visible) {
      const rArr = rainGeo.attributes.position.array;
      for (let i = 0; i < rainCount; i++) {
        const s = rainSeeds[i];
        const y = ((s.y - time * s.speed) % 18 + 18) % 18;
        const x = s.x - (18 - y) * 0.08;
        rArr[i * 6] = x;
        rArr[i * 6 + 1] = y;
        rArr[i * 6 + 2] = s.z;
        rArr[i * 6 + 3] = x - 0.1;
        rArr[i * 6 + 4] = y - 0.65;
        rArr[i * 6 + 5] = s.z;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    // Leaves
    leafInst.visible = weather === 'leaves';
    if (leafInst.visible) {
      for (let i = 0; i < leafCount; i++) {
        const s = leafSeeds[i];
        const y = ((s.y - time * s.speed) % 14 + 14) % 14;
        const x = s.x + Math.sin(time * 1.5 + s.phase) * 0.9;
        dummy.position.set(x, y, s.z);
        dummy.rotation.set(time * 1.8 + s.phase, time * 1.2, Math.sin(time + s.phase));
        dummy.updateMatrix();
        leafInst.setMatrixAt(i, dummy.matrix);
      }
      leafInst.instanceMatrix.needsUpdate = true;
    }

    // Birds
    for (const b of birds) {
      const idx = b.userData.idx;
      if (b.userData.perched) {
        const bx = idx === 0 ? -9.2 : -8.3;
        const hop = Math.max(0, Math.sin(time * 3.5 + idx * 2.0)) * 0.14;
        b.position.set(bx, 11.4 + hop, -2.3);
      } else {
        const ang = time * 0.55 + idx * 2.1;
        b.position.set(
          Math.cos(ang) * 9.5,
          9.5 + Math.sin(time * 2.2 + idx) * 0.6,
          -4.0 + Math.sin(ang) * 5.0
        );
      }
    }

    // Butterflies (visible in clear/leaves, hidden in heavy rain/night)
    const showBf = weather !== 'rain' && timeOfDay !== 'night';
    for (const bf of butterflies) {
      bf.visible = showBf;
      if (!showBf) continue;
      const [hx, hy, hz] = bf.userData.home;
      const p = bf.userData.phase;
      bf.position.set(
        hx + Math.sin(time * 1.8 + p) * 0.9,
        hy + Math.sin(time * 3.4 + p) * 0.35,
        hz + Math.cos(time * 1.5 + p) * 0.7
      );
      bf.scale.x = 0.5 + 0.5 * Math.abs(Math.sin(time * 14.0 + p));
    }
  }

  return { update };
}

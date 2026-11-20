import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SHOTS_DIR = path.resolve(ROOT, 'shots');
const CROPS_DIR = path.resolve(SHOTS_DIR, 'FINAL-detail-crops');

fs.mkdirSync(SHOTS_DIR, { recursive: true });
fs.mkdirSync(CROPS_DIR, { recursive: true });

function findBrowser() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('Neither Chrome nor Edge found on system');
}

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function readPng(filePath) {
  return PNG.sync.read(fs.readFileSync(filePath));
}

function writePng(filePath, w, h, data) {
  const png = new PNG({ width: w, height: h });
  png.data.set(data);
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function statsPng(png) {
  let sum = 0, sumSq = 0;
  const n = png.width * png.height * 3;
  for (let i = 0; i < png.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = png.data[i + c];
      sum += v;
      sumSq += v * v;
    }
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  return { mean, std };
}

function maePng(a, b) {
  let diff = 0;
  const n = a.width * a.height * 3;
  for (let i = 0; i < a.data.length; i += 4) {
    diff += Math.abs(a.data[i] - b.data[i]);
    diff += Math.abs(a.data[i + 1] - b.data[i + 1]);
    diff += Math.abs(a.data[i + 2] - b.data[i + 2]);
  }
  return diff / n;
}

function makeSplitAB(leftPng, rightPng, outPath) {
  const w = 1920, h = 1080;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = x < w / 2 ? leftPng : rightPng;
      const i = (y * w + x) * 4;
      if (Math.abs(x - w / 2) <= 1) {
        out[i] = 255; out[i + 1] = 210; out[i + 2] = 90; out[i + 3] = 255;
      } else {
        out[i] = src.data[i]; out[i + 1] = src.data[i + 1]; out[i + 2] = src.data[i + 2]; out[i + 3] = 255;
      }
    }
  }
  writePng(outPath, w, h, out);
}

function makeCrop(srcPng, sx, sy, cw, ch, outPath) {
  const out = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((sy + y) * srcPng.width + (sx + x)) * 4;
      const di = (y * cw + x) * 4;
      out[di] = srcPng.data[si];
      out[di + 1] = srcPng.data[si + 1];
      out[di + 2] = srcPng.data[si + 2];
      out[di + 3] = 255;
    }
  }
  writePng(outPath, cw, ch, out);
}

function makeMotionStrip(pngs, outPath) {
  // 3x2 grid at 1920x1080 (each cell 640x540)
  const w = 1920, h = 1080;
  const cw = 640, ch = 540;
  const out = new Uint8Array(w * h * 4);
  pngs.forEach((p, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const ox = col * cw, oy = row * ch;
    for (let y = 0; y < ch; y++) {
      const sy = Math.floor((y / ch) * p.height);
      for (let x = 0; x < cw; x++) {
        const sx = Math.floor((x / cw) * p.width);
        const si = (sy * p.width + sx) * 4;
        const di = ((oy + y) * w + (ox + x)) * 4;
        out[di] = p.data[si];
        out[di + 1] = p.data[si + 1];
        out[di + 2] = p.data[si + 2];
        out[di + 3] = 255;
      }
    }
  });
  writePng(outPath, w, h, out);
}

async function run() {
  const port = 5179;
  const viteProc = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
    cwd: ROOT,
    shell: true,
    stdio: 'pipe',
  });

  const url = `http://localhost:${port}/`;
  await waitForServer(url);

  const browser = await chromium.launch({
    executablePath: findBrowser(),
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
    ],
  });

  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
    });
    page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    async function snap(filename, nextState) {
      await page.evaluate((s) => {
        window.__setState(s);
        window.__renderNow(s.simTime ?? 2.5);
      }, nextState);
      await page.waitForTimeout(150);
      const outPath = path.join(SHOTS_DIR, filename);
      await page.screenshot({ path: outPath });
      const p = readPng(outPath);
      const st = statsPng(p);
      console.log(`Captured ${filename} (${p.width}x${p.height}) mean=${st.mean.toFixed(1)} std=${st.std.toFixed(1)}`);
      if (p.width !== 1920 || p.height !== 1080) throw new Error(`${filename} wrong dimensions`);
      if (st.std < 10) throw new Error(`${filename} appears blank/flat (std=${st.std})`);
      return p;
    }

    const base = {
      time: 'dusk', weather: 'clear', bloom: true, dof: true,
      volumetric: true, reflection: true, lightsDebug: false, cameraMode: 'hero', simTime: 2.5,
    };

    const heroPng = await snap('FINAL-hero.png', { ...base });
    await snap('FINAL-dusk.png', { ...base, time: 'dusk' });
    await snap('FINAL-day.png', { ...base, time: 'day' });
    await snap('FINAL-night.png', { ...base, time: 'night' });
    await snap('W3-lit-dawn.png', { ...base, time: 'dawn' });
    const rainNightPng = await snap('FINAL-rain-night.png', { ...base, time: 'night', weather: 'rain' });
    await snap('FINAL-leaves-day.png', { ...base, time: 'day', weather: 'leaves' });
    await snap('FINAL-character-closeup.png', { ...base, cameraMode: 'closeup' });
    await snap('W3-lights-debug.png', { ...base, lightsDebug: true });

    // A/B Comparisons
    const abPairs = [
      ['bloom', 'FINAL-ab-bloom.png'],
      ['dof', 'FINAL-ab-dof.png'],
      ['volumetric', 'FINAL-ab-volumetric.png'],
      ['reflection', 'FINAL-ab-reflection.png'],
    ];
    for (const [key, fname] of abPairs) {
      const offPng = await snap(`_tmp_off_${key}.png`, { ...base, [key]: false });
      const onPng = await snap(`_tmp_on_${key}.png`, { ...base, [key]: true });
      const mae = maePng(offPng, onPng);
      console.log(`A/B ${key} MAE = ${mae.toFixed(3)}`);
      if (mae < 0.25) throw new Error(`A/B ${key} shows insufficient visual difference (MAE=${mae})`);
      makeSplitAB(offPng, onPng, path.join(SHOTS_DIR, fname));
      fs.unlinkSync(path.join(SHOTS_DIR, `_tmp_off_${key}.png`));
      fs.unlinkSync(path.join(SHOTS_DIR, `_tmp_on_${key}.png`));
    }

    // Motion strip (6 frames, 0.5s apart)
    const motionPngs = [];
    for (let i = 0; i < 6; i++) {
      const mp = await snap(`_tmp_m${i}.png`, { ...base, weather: 'leaves', simTime: 1.0 + i * 0.5 });
      motionPngs.push(mp);
      fs.unlinkSync(path.join(SHOTS_DIR, `_tmp_m${i}.png`));
    }
    const motionMae = maePng(motionPngs[0], motionPngs[3]);
    console.log(`Motion frame[0] vs frame[3] MAE = ${motionMae.toFixed(3)}`);
    if (motionMae < 0.2) throw new Error(`Motion frames look static (MAE=${motionMae})`);
    makeMotionStrip(motionPngs, path.join(SHOTS_DIR, 'FINAL-motion-strip.png'));

    // Detail crops (640x360)
    makeCrop(heroPng, 560, 420, 640, 360, path.join(CROPS_DIR, 'crop-hero-lantern.png'));
    makeCrop(heroPng, 220, 260, 640, 360, path.join(CROPS_DIR, 'crop-inn-windows.png'));
    makeCrop(heroPng, 1080, 680, 640, 360, path.join(CROPS_DIR, 'crop-water-reflection.png'));
    makeCrop(heroPng, 660, 120, 640, 360, path.join(CROPS_DIR, 'crop-godrays-tree.png'));
    makeCrop(rainNightPng, 480, 560, 640, 360, path.join(CROPS_DIR, 'crop-rain-wet-cobble.png'));

    const fps = await page.evaluate(() => window.__getFPS());
    console.log(`Measured FPS (SwiftShader headless): ${fps}`);
    if (errors.length > 0) {
      throw new Error(`Browser console/page errors detected:\n${errors.join('\n')}`);
    }
  } finally {
    await browser.close();
    viteProc.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

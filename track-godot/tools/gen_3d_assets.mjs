import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import './gen_forest_canopies.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PALETTE_PATH = path.resolve(ROOT, '../shared/palette.json');
const OUT_DIR = path.resolve(ROOT, 'assets/sprites');
const SHOTS_DIR = path.resolve(ROOT, 'shots');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const paletteData = JSON.parse(fs.readFileSync(PALETTE_PATH, 'utf8'));
const RAMPS = {};
for (const [k, hexList] of Object.entries(paletteData.ramps)) {
  RAMPS[k] = hexList.map(hexToRgb);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class PixelCanvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.rgba = new Uint8Array(w * h * 4);
    this.height = new Uint8Array(w * h);
    this.emissive = new Uint8Array(w * h * 4);
  }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, col, hVal = 128, emit = false) {
    x = Math.round(x); y = Math.round(y);
    if (!this.inBounds(x, y)) return;
    const i = (y * this.w + x) * 4;
    this.rgba[i] = col[0]; this.rgba[i + 1] = col[1]; this.rgba[i + 2] = col[2]; this.rgba[i + 3] = col[3] ?? 255;
    this.height[y * this.w + x] = Math.max(0, Math.min(255, Math.round(hVal)));
    if (emit) {
      this.emissive[i] = col[0]; this.emissive[i + 1] = col[1]; this.emissive[i + 2] = col[2]; this.emissive[i + 3] = 255;
    }
  }
  getA(x, y) { return this.inBounds(x, y) ? this.rgba[(y * this.w + x) * 4 + 3] : 0; }
  rect(x0, y0, w, h, col, hVal = 128, emit = false) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) this.set(x, y, col, hVal, emit);
  }
  ellipse(cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, d2 = dx * dx + dy * dy;
        if (d2 <= 1.0) fn(x, y, dx, dy, d2);
      }
    }
  }
  addSelectiveOutline(outlineCol) {
    const copy = new Uint8Array(this.rgba);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (copy[(y * this.w + x) * 4 + 3] > 0) continue;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = x + dx, ny = y + dy;
          if (this.inBounds(nx, ny) && copy[(ny * this.w + nx) * 4 + 3] > 0) {
            this.set(x, y, outlineCol, 30); break;
          }
        }
      }
    }
  }
  toNormalMap(strength = 2.4) {
    const out = new Uint8Array(this.w * this.h * 4);
    const hAt = (x, y) => this.height[Math.max(0, Math.min(this.h - 1, y)) * this.w + Math.max(0, Math.min(this.w - 1, x))] / 255.0;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const tl = hAt(x-1,y-1), t = hAt(x,y-1), tr = hAt(x+1,y-1);
        const l = hAt(x-1,y), r = hAt(x+1,y);
        const bl = hAt(x-1,y+1), b = hAt(x,y+1), br = hAt(x+1,y+1);
        let nx = -((tr + 2*r + br) - (tl + 2*l + bl)) * strength;
        let ny = ((bl + 2*b + br) - (tl + 2*t + tr)) * strength;
        let nz = 1.0;
        const len = Math.hypot(nx, ny, nz) || 1;
        const i = (y * this.w + x) * 4;
        out[i] = Math.round(((nx/len)*0.5+0.5)*255);
        out[i+1] = Math.round(((ny/len)*0.5+0.5)*255);
        out[i+2] = Math.round(((nz/len)*0.5+0.5)*255);
        out[i+3] = 255;
      }
    }
    return out;
  }
}

function writePng(filePath, w, h, data) {
  const png = new PNG({ width: w, height: h });
  png.data.set(data);
  fs.writeFileSync(filePath, PNG.sync.write(png));
}

function saveSprite(name, pc, { hasEmissive = false, normalStrength = 2.4 } = {}) {
  writePng(path.join(OUT_DIR, `${name}.png`), pc.w, pc.h, pc.rgba);
  writePng(path.join(OUT_DIR, `${name}_n.png`), pc.w, pc.h, pc.toNormalMap(normalStrength));
  if (hasEmissive) writePng(path.join(OUT_DIR, `${name}_e.png`), pc.w, pc.h, pc.emissive);
}

// 3D Tileable Wall & Roof Textures (64x64)
function genWallTimber() {
  const pc = new PixelCanvas(64, 64);
  const p = RAMPS.plaster_wall, w = RAMPS.wood_dark, s = RAMPS.stone_cobble;
  pc.rect(0, 0, 64, 64, p[3], 130);
  pc.rect(0, 48, 64, 16, s[2], 150);
  for (let y = 50; y < 64; y += 6) {
    for (let x = ((y % 12) === 2 ? 0 : 6); x < 64; x += 12) pc.rect(x, y, 10, 4, s[3], 165);
  }
  pc.rect(0, 0, 64, 4, w[2], 165);
  pc.rect(0, 26, 64, 4, w[2], 165);
  pc.rect(0, 44, 64, 4, w[2], 165);
  pc.rect(0, 0, 4, 48, w[2], 165);
  pc.rect(60, 0, 4, 48, w[2], 165);
  pc.rect(30, 0, 4, 48, w[2], 165);
  saveSprite('tex_wall_timber', pc, { normalStrength: 2.5 });
}

function genRoofShingles(name, ramp) {
  const pc = new PixelCanvas(64, 64);
  for (let y = 0; y < 64; y++) {
    const row = Math.floor(y / 8);
    for (let x = 0; x < 64; x++) {
      const seam = ((x + (row % 2) * 4) % 8 === 0) || (y % 8 === 7);
      const shade = seam ? 1 : (y % 8 < 3) ? 4 : 3;
      pc.set(x, y, ramp[shade], seam ? 95 : 190 - (y % 8) * 8);
    }
  }
  saveSprite(name, pc, { normalStrength: 2.8 });
}

function genGroundSnow() {
  const rng = makeRng(808);
  const pc = new PixelCanvas(64, 64);
  const p = RAMPS.plaster_wall, w = RAMPS.water;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = Math.sin(x * 0.25) * Math.cos(y * 0.25) + (rng() - 0.5) * 0.4;
      pc.set(x, y, n > 0.2 ? p[4] : n > -0.3 ? p[3] : w[4], 120 + n * 25);
    }
  }
  saveSprite('ground_snow', pc, { normalStrength: 1.5 });
}

function genWindowGlow() {
  const pc = new PixelCanvas(32, 32);
  const w = RAMPS.wood_dark, g = RAMPS.lantern_glow;
  pc.rect(0, 0, 32, 32, w[1], 175);
  pc.rect(3, 3, 26, 26, g[3], 130, true);
  pc.rect(5, 5, 22, 22, g[4], 130, true);
  pc.rect(15, 3, 2, 26, w[2], 185);
  pc.rect(3, 15, 26, 2, w[2], 185);
  saveSprite('tex_window_glow', pc, { hasEmissive: true });
}

// 4-Direction Chibi Female Hero Sprites (front, back, side)
function genChibiDirections() {
  const skin = RAMPS.chibi_skin, hair = RAMPS.flower_gold, hairDark = RAMPS.wood_warm;
  const cloak = RAMPS.chibi_cloak, dress = RAMPS.plaster_wall;
  const scarf = RAMPS.chibi_scarf, wood = RAMPS.wood_dark, glow = RAMPS.lantern_glow;

  // 1. Front View (chibi_hero.png)
  const front = new PixelCanvas(40, 48);
  // Boots
  front.rect(14, 40, 4, 4, wood[1], 110); front.rect(22, 40, 4, 4, wood[1], 110);
  // Flared Tunic Skirt + Dress Apron
  for (let y = 26; y <= 40; y++) {
    const t = (y - 26) / 14.0;
    const hw = Math.round(5.5 + t * 3.5);
    for (let x = 20 - hw; x <= 20 + hw; x++) {
      const isApron = Math.abs(x - 20) <= 2 && y >= 31;
      const col = isApron ? dress[4] : cloak[x < 18 ? 3 : x < 22 ? 2 : 1];
      front.set(x, y, col, 150);
    }
  }
  // Crimson Scarf & Belt
  front.rect(14, 32, 12, 2, wood[2], 160);
  front.ellipse(20, 25.5, 6.8, 2.5, (x, y, dx, dy) => front.set(x, y, scarf[dy < 0 ? 3 : 2], 175));
  front.rect(13, 26, 3, 6, scarf[2], 170);
  // Long Flowing Back Hair framing shoulders
  front.rect(10, 14, 4, 15, hair[1], 160);
  front.rect(26, 14, 4, 15, hair[1], 160);
  // Face (2-head chibi)
  front.ellipse(20, 16.5, 7.8, 7.4, (x, y, dx, dy) => front.set(x, y, skin[dy < -0.2 ? 3 : dx > 0.35 ? 1 : 2], 185));
  // Big sparkling eyes + rosy cheeks
  front.rect(16, 16, 2, 3, wood[0], 190); front.set(16, 16, dress[4], 195);
  front.rect(22, 16, 2, 3, wood[0], 190); front.set(22, 16, dress[4], 195);
  front.set(14, 19, scarf[3], 185); front.set(25, 19, scarf[3], 185);
  // Golden Hair Crown + Cute Bangs + Crimson Hair Ribbon
  front.ellipse(20, 11.5, 9.2, 6.8, (x, y, dx, dy, d2) => {
    if (y > 14 && x > 14 && x < 26) return;
    const shade = dx * 0.4 + dy * 0.6;
    front.set(x, y, hair[shade < -0.2 ? 3 : shade < 0.25 ? 2 : 1], 210 - d2 * 35);
  });
  front.rect(12, 12, 3, 7, hair[2], 205); front.rect(25, 12, 3, 7, hair[2], 205);
  front.rect(17, 11, 2, 3, hair[3], 215); front.rect(21, 11, 2, 3, hair[2], 210);
  // Cute Crimson Ribbon Bow on top-left
  front.rect(12, 6, 4, 2, scarf[3], 220); front.rect(13, 7, 2, 2, scarf[2], 220);
  // Handheld Lantern
  front.rect(27, 27, 4, 2, cloak[3], 165);
  front.rect(29, 30, 5, 5, glow[3], 215, true); front.rect(30, 31, 3, 3, glow[4], 230, true);
  front.addSelectiveOutline(hairDark[0]);
  saveSprite('chibi_hero', front, { hasEmissive: true, normalStrength: 2.2 });

  // 2. Back View (chibi_back.png)
  const back = new PixelCanvas(40, 48);
  back.rect(14, 40, 4, 4, wood[1], 110); back.rect(22, 40, 4, 4, wood[1], 110);
  for (let y = 26; y <= 40; y++) {
    const t = (y - 26) / 14.0;
    const hw = Math.round(5.5 + t * 3.5);
    for (let x = 20 - hw; x <= 20 + hw; x++) back.set(x, y, cloak[x < 20 ? 3 : 2], 150);
  }
  back.ellipse(20, 25.5, 6.8, 2.5, (x, y, dx, dy) => back.set(x, y, scarf[dy < 0 ? 3 : 2], 175));
  // Long Flowing Hair Cape down the back
  back.ellipse(20, 18.0, 9.4, 11.5, (x, y, dx, dy, d2) => {
    const shade = dx * 0.4 + dy * 0.5;
    back.set(x, y, hair[shade < -0.2 ? 3 : shade < 0.25 ? 2 : 1], 205 - d2 * 35);
  });
  back.rect(16, 13, 8, 2, scarf[3], 215); // Ribbon tie at back of head
  back.rect(30, 30, 4, 5, glow[3], 210, true);
  back.addSelectiveOutline(hairDark[0]);
  saveSprite('chibi_back', back, { hasEmissive: true, normalStrength: 2.0 });

  // 3. Side View (chibi_side.png)
  const side = new PixelCanvas(40, 48);
  side.rect(16, 40, 5, 4, wood[1], 110);
  for (let y = 26; y <= 40; y++) {
    const t = (y - 26) / 14.0;
    const hw = Math.round(4.5 + t * 3.0);
    for (let x = 19 - hw; x <= 19 + hw; x++) side.set(x, y, cloak[x > 19 ? 3 : 2], 150);
  }
  side.ellipse(19, 25.5, 6.0, 2.4, (x, y, dx, dy) => side.set(x, y, scarf[dy < 0 ? 3 : 2], 175));
  side.ellipse(19.5, 16.5, 7.0, 7.2, (x, y, dx) => side.set(x, y, skin[dx > 0.2 ? 3 : 2], 185));
  side.rect(22, 16, 2, 3, wood[0], 190); side.set(22, 16, dress[4], 195);
  side.set(23, 19, scarf[3], 185);
  // Flowing side hair & ponytail
  side.ellipse(17.5, 15.0, 8.2, 10.5, (x, y) => {
    if (y > 14 && x > 18) return;
    side.set(x, y, hair[x < 15 ? 1 : 2], 205);
  });
  side.rect(12, 8, 4, 2, scarf[3], 220);
  side.rect(24, 27, 5, 2, cloak[3], 165);
  side.rect(28, 30, 5, 5, glow[3], 215, true); side.rect(29, 31, 3, 3, glow[4], 230, true);
  side.addSelectiveOutline(hairDark[0]);
  saveSprite('chibi_side', side, { hasEmissive: true, normalStrength: 2.2 });
}

function genGrassTuft() {
  const rng = makeRng(515);
  // 1. Tall feathery grass tuft (24x24)
  const tall = new PixelCanvas(24, 24);
  const g = RAMPS.foliage_green;
  for (const [bx, h, leanDir] of [[3,15,-1],[6,19,-1],[9,17,0],[12,21,0],[15,18,1],[18,16,1],[21,13,1]]) {
    for (let y = 23; y >= 23 - h; y--) {
      const t = (23 - y) / h;
      const dx = Math.round(t * t * leanDir * 2.5);
      const colIdx = t > 0.72 ? 5 : t > 0.4 ? 4 : t > 0.15 ? 3 : 2;
      tall.set(bx + dx, y, g[colIdx], 140 + t * 50);
      if (t < 0.5) tall.set(bx + dx + 1, y, g[Math.max(1, colIdx - 1)], 130);
    }
  }
  saveSprite('grass_tall', tall, { normalStrength: 1.4 });

  // 2. Red & Gold Wildflowers (24x24)
  const fRed = new PixelCanvas(24, 24);
  const r = RAMPS.chibi_scarf;
  const fg = RAMPS.flower_gold;
  for (const [bx, h, ramp] of [[5,17,r],[11,20,r],[17,16,fg],[20,14,r]]) {
    for (let y = 23; y >= 23 - h + 3; y--) {
      fRed.set(bx, y, g[3], 130);
    }
    const ty = 23 - h;
    fRed.rect(bx - 1, ty, 3, 3, ramp[3], 190);
    fRed.set(bx, ty + 1, ramp[2], 195);
    fRed.set(bx, ty, fg[3], 205);
  }
  saveSprite('flower_red', fRed, { normalStrength: 1.4 });

  // 3. White/Pink/Blue Wildflowers (24x24)
  const fMix = new PixelCanvas(24, 24);
  const fp = RAMPS.flower_pink;
  const pw = RAMPS.plaster_wall;
  for (const [bx, h, c1, c2] of [[4,16,fp[3],fp[2]],[10,19,pw[4],fg[3]],[15,15,fp[2],fp[3]],[19,18,pw[4],fg[2]]]) {
    for (let y = 23; y >= 23 - h + 3; y--) {
      fMix.set(bx, y, g[4], 130);
    }
    const ty = 23 - h;
    fMix.set(bx, ty, c1, 195);
    fMix.set(bx - 1, ty + 1, c1, 190);
    fMix.set(bx + 1, ty + 1, c1, 190);
    fMix.set(bx, ty + 2, c1, 190);
    fMix.set(bx, ty + 1, c2, 205);
  }
  saveSprite('flower_mix', fMix, { normalStrength: 1.4 });

  // 4. Shoreline Reeds / Cattails (16x32)
  const reeds = new PixelCanvas(16, 32);
  const wd = RAMPS.wood_dark;
  for (const [bx, h, hasHead] of [[3,24,false],[6,29,true],[9,22,false],[12,27,true]]) {
    for (let y = 31; y >= 31 - h; y--) {
      reeds.set(bx, y, g[y < 16 ? 4 : 3], 150);
    }
    if (hasHead) {
      reeds.rect(bx - 1, 31 - h, 3, 5, wd[2], 180);
      reeds.rect(bx, 31 - h, 1, 5, wd[3], 190);
    }
  }
  saveSprite('reeds', reeds, { normalStrength: 1.5 });
}

function genPainterlyCanopiesAndExtras() {
  const rng = makeRng(777);
  // Painterly organic foliage canopy sprite (64x56) with soft leaf-cluster brushwork
  function makeCanopy(name, ramp, accentRamp) {
    const pc = new PixelCanvas(64, 56);
    const blobs = [
      [32, 24, 22, 17, 0.25], [18, 28, 15, 13, 0.0], [46, 28, 15, 13, 0.1],
      [24, 16, 16, 13, 0.4], [40, 16, 16, 13, 0.45], [32, 34, 20, 13, -0.25],
    ];
    for (const [cx, cy, rx, ry, bias] of blobs) {
      pc.ellipse(cx, cy, rx, ry, (x, y, dx, dy, d2) => {
        const edgeNoise = (rng() - 0.5) * 0.35;
        if (d2 + edgeNoise > 0.92) return;
        const light = -dy * 0.55 - dx * 0.25 + bias + (rng() - 0.5) * 0.22;
        const idx = light > 0.5 ? 5 : light > 0.22 ? 4 : light > -0.08 ? 3 : light > -0.38 ? 2 : 1;
        const col = ramp[Math.max(1, Math.min(ramp.length - 1, idx))];
        pc.set(x, y, col, 150 + light * 55);
      });
    }
    // Painterly leaf highlights / blossoms
    for (let i = 0; i < 45; i++) {
      const px = Math.round(10 + rng() * 44);
      const py = Math.round(8 + rng() * 34);
      if (pc.getA(px, py) > 0) {
        pc.set(px, py, accentRamp[accentRamp.length - 1], 195);
        pc.set(px + 1, py, accentRamp[accentRamp.length - 2], 190);
      }
    }
    // Keep foliage edges painterly and open; the former dark outline read like inked balls on 3D trees.
    saveSprite(name, pc, { normalStrength: 2.0 });
  }

  makeCanopy('canopy_oak', RAMPS.foliage_green, RAMPS.foliage_green);
  makeCanopy('canopy_autumn', RAMPS.foliage_autumn, RAMPS.flower_gold);
  makeCanopy('canopy_sakura', RAMPS.flower_pink, RAMPS.plaster_wall);

  // Warm Dirt Footpath Texture (64x64)
  const dirt = new PixelCanvas(64, 64);
  const w = RAMPS.wood_warm, wd = RAMPS.wood_dark;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = Math.sin(x * 0.3) * Math.cos(y * 0.3) + (rng() - 0.5) * 0.7;
      dirt.set(x, y, n > 0.45 ? w[2] : n > -0.25 ? w[1] : wd[2], 95 + n * 30);
    }
  }
  for (let i = 0; i < 24; i++) {
    dirt.rect(Math.floor(rng() * 62), Math.floor(rng() * 62), 2, 2, RAMPS.stone_cobble[2], 140);
  }
  saveSprite('ground_dirt', dirt, { normalStrength: 1.8 });

  // White Snowflake (8x8)
  const snow = new PixelCanvas(8, 8);
  const pw = RAMPS.plaster_wall;
  snow.rect(3, 1, 2, 6, pw[4], 200);
  snow.rect(1, 3, 6, 2, pw[4], 200);
  snow.set(2, 2, pw[3], 190); snow.set(5, 2, pw[3], 190);
  snow.set(2, 5, pw[3], 190); snow.set(5, 5, pw[3], 190);
  saveSprite('snow_flake', snow);

  // Rough Pixel Bark Texture (32x64) with ridges & mossy base
  const bark = new PixelCanvas(32, 64);
  const wdBark = RAMPS.wood_dark, gBark = RAMPS.foliage_green;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 32; x++) {
      const ridge = Math.sin(x * 0.9 + Math.sin(y * 0.25) * 1.4);
      const colIdx = ridge > 0.4 ? 3 : ridge > -0.2 ? 2 : 1;
      const isMoss = y > 50 && (rng() > 0.45 || ridge < 0.0);
      bark.set(x, y, isMoss ? gBark[ridge > 0 ? 3 : 2] : wdBark[colIdx], 120 + ridge * 60);
    }
  }
  saveSprite('tex_bark', bark, { normalStrength: 3.0 });

  // Detailed Painterly Pine Tree (96x160) with irregular drooping boughs
  const pine = new PixelCanvas(96, 160);
  pine.rect(43, 120, 10, 36, wdBark[1], 130);
  pine.rect(45, 120, 4, 36, wdBark[2], 145);
  for (let tier = 0; tier < 6; tier++) {
    const topY = 8 + tier * 21;
    const h = 34;
    const maxW = 14 + tier * 6;
    for (let dy = 0; dy < h; dy++) {
      const t = dy / h;
      const hw = Math.round(t * maxW + Math.sin(dy * 0.7 + tier) * 2.5);
      for (let x = 48 - hw; x <= 48 + hw; x++) {
        const dx = (x - 48) / Math.max(1, hw);
        const tuft = Math.sin(x * 0.65 + dy * 0.4) + (rng() - 0.5) * 0.6;
        if (dy > h - 4 && tuft < -0.15) continue; // ragged bough bottom
        const light = -dx * 0.35 - t * 0.45 + tuft * 0.25;
        const ci = light > 0.25 ? 4 : light > -0.1 ? 3 : light > -0.4 ? 2 : 1;
        pine.set(x, topY + dy, gBark[ci], 145 + light * 45);
      }
    }
  }
  saveSprite('tree_pine', pine, { normalStrength: 2.2 });

  // Tall Wheat/Meadow Grass (24x32)
  const wheat = new PixelCanvas(24, 32);
  const fg = RAMPS.flower_gold;
  for (const [bx, h, lean] of [[3,24,-1],[7,28,-1],[11,30,0],[15,27,1],[19,23,1]]) {
    for (let y = 31; y >= 31 - h; y--) {
      const t = (31 - y) / h;
      const dx = Math.round(t * t * lean * 3.0);
      wheat.set(bx + dx, y, t > 0.78 ? fg[3] : gBark[t > 0.45 ? 4 : 3], 150);
    }
  }
  saveSprite('grass_wheat', wheat, { normalStrength: 1.4 });

  // Broad Lush Fern Fronds (24x20)
  const fern = new PixelCanvas(24, 20);
  for (const [cx, angle] of [[12, -0.7], [12, 0.0], [12, 0.7]]) {
    for (let s = 2; s < 16; s++) {
      const fx = Math.round(cx + Math.sin(angle) * s);
      const fy = Math.round(19 - Math.cos(angle) * s * 0.9);
      const w = Math.max(1, Math.round((1.0 - s / 17.0) * 3));
      for (let wx = -w; wx <= w; wx++) {
        fern.set(fx + wx, fy, gBark[s > 10 ? 5 : s > 5 ? 4 : 3], 150);
      }
    }
  }
  saveSprite('grass_fern', fern, { normalStrength: 1.5 });
}

genWallTimber();
genRoofShingles('tex_roof_terracotta', RAMPS.roof_terracotta);
genRoofShingles('tex_roof_slate', RAMPS.roof_slate);
genGroundSnow();
genWindowGlow();
genChibiDirections();
genGrassTuft();
genPainterlyCanopiesAndExtras();
console.log('Generated 3D building textures, snow ground, and multi-direction chibi sprites!');

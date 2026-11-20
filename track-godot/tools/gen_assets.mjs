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

// Deterministic PRNG (Mulberry32)
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

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  set(x, y, col, hVal = 128, emit = false) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inBounds(x, y)) return;
    const i = (y * this.w + x) * 4;
    this.rgba[i] = col[0];
    this.rgba[i + 1] = col[1];
    this.rgba[i + 2] = col[2];
    this.rgba[i + 3] = col[3] ?? 255;
    this.height[y * this.w + x] = Math.max(0, Math.min(255, Math.round(hVal)));
    if (emit) {
      this.emissive[i] = col[0];
      this.emissive[i + 1] = col[1];
      this.emissive[i + 2] = col[2];
      this.emissive[i + 3] = 255;
    }
  }

  getA(x, y) {
    if (!this.inBounds(x, y)) return 0;
    return this.rgba[(y * this.w + x) * 4 + 3];
  }

  rect(x0, y0, w, h, col, hVal = 128, emit = false) {
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        this.set(x, y, col, hVal, emit);
      }
    }
  }

  ellipse(cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const d2 = dx * dx + dy * dy;
        if (d2 <= 1.0) fn(x, y, dx, dy, d2);
      }
    }
  }

  addSelectiveOutline(outlineCol) {
    const copy = new Uint8Array(this.rgba);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const i = (y * this.w + x) * 4;
        if (copy[i + 3] > 0) continue;
        let touches = false;
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (this.inBounds(nx, ny) && copy[(ny * this.w + nx) * 4 + 3] > 0) {
            touches = true;
            break;
          }
        }
        if (touches) {
          this.set(x, y, outlineCol, 30);
        }
      }
    }
  }

  toNormalMap(strength = 2.4) {
    const out = new Uint8Array(this.w * this.h * 4);
    const hAt = (x, y) => {
      const cx = Math.max(0, Math.min(this.w - 1, x));
      const cy = Math.max(0, Math.min(this.h - 1, y));
      return this.height[cy * this.w + cx] / 255.0;
    };
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const tl = hAt(x - 1, y - 1), t = hAt(x, y - 1), tr = hAt(x + 1, y - 1);
        const l = hAt(x - 1, y), r = hAt(x + 1, y);
        const bl = hAt(x - 1, y + 1), b = hAt(x, y + 1), br = hAt(x + 1, y + 1);
        const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
        const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
        let nx = -dx * strength;
        let ny = dy * strength;
        let nz = 1.0;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;
        const i = (y * this.w + x) * 4;
        out[i] = Math.round((nx * 0.5 + 0.5) * 255);
        out[i + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        out[i + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        out[i + 3] = 255;
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
  if (hasEmissive) {
    writePng(path.join(OUT_DIR, `${name}_e.png`), pc.w, pc.h, pc.emissive);
  }
  return pc;
}

// ---------- 1. GROUND & TILEABLE TEXTURES ----------
function genGroundGrass() {
  const rng = makeRng(101);
  const pc = new PixelCanvas(64, 64);
  const g = RAMPS.foliage_green;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const n = Math.sin(x * 0.35) * Math.cos(y * 0.35) + (rng() - 0.5) * 0.8;
      const idx = n > 0.65 ? 3 : n > -0.2 ? 2 : 1;
      pc.set(x, y, g[idx], 80 + idx * 18);
    }
  }
  // Grass blade tufts
  for (let i = 0; i < 42; i++) {
    const bx = Math.floor(rng() * 64);
    const by = Math.floor(rng() * 64);
    pc.set((bx) % 64, by, g[4], 150);
    pc.set((bx + 1) % 64, (by + 63) % 64, g[5], 175);
    pc.set((bx + 63) % 64, (by + 63) % 64, g[3], 130);
  }
  return saveSprite('ground_grass', pc, { normalStrength: 1.8 });
}

function genGroundCobble() {
  const rng = makeRng(202);
  const pc = new PixelCanvas(64, 64);
  const s = RAMPS.stone_cobble;
  pc.rect(0, 0, 64, 64, s[0], 35);
  const rows = 8, cols = 6;
  const ch = 64 / rows, cw = 64 / cols;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = 0; c < cols; c++) {
      const cx = (c * cw + offset + cw * 0.5) % 64;
      const cy = r * ch + ch * 0.5;
      const tone = 1 + Math.floor(rng() * 2);
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const dist = Math.hypot(dx / 4.3, dy / 3.3);
          if (dist < 0.92) {
            const px = (Math.round(cx + dx) + 64) % 64;
            const py = (Math.round(cy + dy) + 64) % 64;
            const light = dx + dy < -1.5 ? Math.min(4, tone + 1) : dist > 0.72 ? tone - 1 : tone;
            const hVal = Math.round(110 + (1.0 - dist) * 120);
            pc.set(px, py, s[Math.max(1, light)], hVal);
          }
        }
      }
    }
  }
  return saveSprite('ground_cobble', pc, { normalStrength: 3.2 });
}

// ---------- 2. CHIBI HERO (40x48, 2-head proportion + handheld lantern) ----------
function genChibiHero() {
  const pc = new PixelCanvas(40, 48);
  const skin = RAMPS.chibi_skin;
  const hair = RAMPS.chibi_hair;
  const cloak = RAMPS.chibi_cloak;
  const scarf = RAMPS.chibi_scarf;
  const wood = RAMPS.wood_dark;
  const glow = RAMPS.lantern_glow;

  // Boots & legs (y: 38..44)
  pc.rect(14, 39, 4, 5, wood[1], 110);
  pc.rect(21, 39, 4, 5, wood[1], 110);
  pc.rect(14, 42, 4, 2, wood[2], 125);
  pc.rect(21, 42, 4, 2, wood[2], 125);

  // Cloak / Tunic (y: 25..40)
  pc.ellipse(19.5, 33, 7.5, 7.5, (x, y, dx, dy) => {
    if (y < 26 || y > 40) return;
    const shade = dx + dy * 0.4;
    const idx = shade < -0.3 ? 3 : shade < 0.25 ? 2 : 1;
    pc.set(x, y, cloak[idx], 150 - Math.abs(dx) * 35);
  });
  // Cloak front trim & leather belt
  pc.rect(13, 33, 13, 2, wood[2], 160);
  pc.set(19, 33, glow[3], 180);
  pc.rect(18, 28, 3, 11, cloak[4], 165);

  // Cozy crimson scarf (y: 23..28)
  pc.ellipse(19.5, 25.5, 7.2, 2.6, (x, y, dx, dy) => {
    const idx = dy < 0 ? 3 : dx < 0 ? 2 : 1;
    pc.set(x, y, scarf[idx], 175);
  });
  // Scarf trailing tail on left
  pc.rect(12, 26, 3, 7, scarf[2], 170);
  pc.rect(12, 31, 2, 3, scarf[1], 165);

  // Head (2-head chibi! y: 7..24, ~18px tall)
  pc.ellipse(19.5, 16.5, 8.2, 7.6, (x, y, dx, dy) => {
    const idx = dy < -0.2 ? 3 : dx > 0.35 ? 1 : 2;
    pc.set(x, y, skin[idx], 185 - Math.abs(dx) * 30);
  });

  // Big expressive eyes (3/4 facing slightly right)
  // Left eye
  pc.rect(16, 16, 2, 3, hair[0], 190);
  pc.set(16, 16, skin[3], 195); // bright eye highlight
  // Right eye
  pc.rect(22, 16, 2, 3, hair[0], 190);
  pc.set(22, 16, skin[3], 195);
  // Rosy cheek pixels
  pc.set(14, 19, scarf[3], 185);
  pc.set(24, 19, scarf[3], 185);

  // Hair dome & cute bangs (y: 4..18)
  pc.ellipse(19.2, 11.5, 9.2, 6.8, (x, y, dx, dy, d2) => {
    if (y > 14 && x > 14 && x < 25) return; // keep face open
    const shade = dx * 0.5 + dy * 0.7;
    const idx = shade < -0.35 ? 4 : shade < 0.05 ? 3 : shade < 0.45 ? 2 : 1;
    pc.set(x, y, hair[idx], 210 - d2 * 40);
  });
  // Bang tufts & side locks
  pc.rect(13, 12, 3, 4, hair[3], 205);
  pc.rect(17, 11, 2, 3, hair[4], 215);
  pc.rect(20, 11, 2, 3, hair[3], 210);
  pc.rect(24, 12, 3, 5, hair[2], 200);
  // Cute ahoge hair sprout on top
  pc.set(18, 4, hair[3], 205);
  pc.set(19, 3, hair[4], 210);

  // Outstretched right arm + handheld warm lantern (x: 27..35, y: 24..34)
  pc.rect(26, 27, 4, 2, cloak[3], 165);
  pc.rect(30, 27, 2, 2, skin[3], 170);
  // Lantern handle + brass cap + glowing glass core
  pc.rect(31, 28, 1, 2, RAMPS.metal_iron[2], 180);
  pc.rect(29, 30, 5, 1, RAMPS.metal_iron[1], 190);
  pc.rect(29, 31, 5, 4, glow[3], 210, true);
  pc.rect(30, 32, 3, 2, glow[4], 230, true);
  pc.rect(29, 35, 5, 1, RAMPS.metal_iron[1], 190);

  pc.addSelectiveOutline(hair[0]);
  return saveSprite('chibi_hero', pc, { hasEmissive: true, normalStrength: 2.6 });
}

// ---------- 3. MAIN BAKERY/INN HOUSE (224x208 = 14x13 units) ----------
function genHouseInn() {
  const pc = new PixelCanvas(224, 208);
  const plaster = RAMPS.plaster_wall;
  const wood = RAMPS.wood_dark;
  const wWarm = RAMPS.wood_warm;
  const roof = RAMPS.roof_terracotta;
  const stone = RAMPS.stone_cobble;
  const glow = RAMPS.lantern_glow;
  const flower = RAMPS.flower_pink;
  const leaf = RAMPS.foliage_green;

  // Chimney (x: 156..178, y: 8..55)
  pc.rect(156, 12, 22, 46, stone[2], 140);
  pc.rect(154, 8, 26, 5, stone[3], 155);
  for (let y = 14; y < 52; y += 6) {
    pc.rect(156, y, 22, 1, stone[1], 120);
  }

  // Main Plaster Body (x: 22..202, y: 78..204)
  pc.rect(22, 78, 180, 126, plaster[3], 140);
  // Subtle plaster shading
  pc.rect(22, 78, 14, 126, plaster[2], 130);
  pc.rect(188, 78, 14, 126, plaster[2], 130);
  // Stone foundation (y: 178..204)
  pc.rect(20, 178, 184, 26, stone[2], 155);
  for (let y = 180; y < 204; y += 8) {
    for (let x = 22 + ((y % 16) === 0 ? 0 : 8); x < 200; x += 16) {
      pc.rect(x, y, 13, 6, stone[3], 165);
    }
  }

  // Timber Framing Beams
  pc.rect(22, 78, 180, 6, wood[2], 165);
  pc.rect(22, 130, 180, 6, wood[2], 170);
  for (const bx of [22, 74, 146, 196]) {
    pc.rect(bx, 78, 6, 102, wood[2], 165);
  }
  // Diagonal braces
  for (let i = 0; i < 18; i++) {
    pc.rect(28 + i * 2, 126 - i * 2, 3, 3, wood[1], 160);
    pc.rect(192 - i * 2, 126 - i * 2, 3, 3, wood[1], 160);
  }

  // Scalloped Terracotta Roof (y: 16..84)
  for (let y = 16; y <= 84; y++) {
    const t = (y - 16) / 68;
    const halfW = Math.round(14 + t * 96);
    const x0 = 112 - halfW;
    const x1 = 112 + halfW;
    for (let x = x0; x <= x1; x++) {
      const shingleRow = Math.floor(y / 7);
      const scallop = ((x + (shingleRow % 2) * 5) % 10) < 2 || (y % 7 === 0);
      const shade = scallop ? 1 : t < 0.3 ? 4 : t < 0.7 ? 3 : 2;
      pc.set(x, y, roof[shade], 190 - (y % 7) * 5);
    }
  }
  // Roof ridge beam
  pc.rect(96, 14, 32, 5, wood[3], 210);

  // Upper Floor Glowing Windows (x: 42, 100, 158)
  for (const wx of [40, 100, 160]) {
    pc.rect(wx - 2, 92, 24, 28, wood[1], 175);
    pc.rect(wx, 94, 20, 24, glow[3], 135, true);
    pc.rect(wx + 2, 96, 16, 20, glow[4], 135, true);
    // Mullions
    pc.rect(wx + 9, 94, 2, 24, wood[2], 180);
    pc.rect(wx, 105, 20, 2, wood[2], 180);
    // Flower box
    pc.rect(wx - 2, 120, 24, 5, wWarm[2], 185);
    for (let fx = wx; fx < wx + 20; fx += 4) {
      pc.rect(fx, 117, 3, 3, leaf[4], 190);
      pc.set(fx + 1, 117, flower[3], 195);
    }
  }

  // Shopfront Striped Awning (x: 34..126, y: 136..152)
  for (let y = 136; y < 152; y++) {
    const ext = Math.floor((y - 136) * 0.5);
    for (let x = 34 - ext; x < 128 + ext; x++) {
      const stripe = Math.floor(x / 8) % 2 === 0;
      pc.set(x, y, stripe ? RAMPS.chibi_scarf[2] : plaster[4], 205);
    }
  }

  // Shopfront Big Glowing Display Window (x: 44..94, y: 152..182)
  pc.rect(42, 152, 54, 30, wood[1], 175);
  pc.rect(45, 154, 48, 25, glow[3], 140, true);
  pc.rect(48, 157, 42, 19, glow[4], 140, true);
  pc.rect(68, 154, 2, 25, wood[2], 180);

  // Arched Wooden Front Door (x: 148..178, y: 152..204)
  pc.rect(146, 150, 34, 54, stone[3], 170);
  pc.rect(150, 154, 26, 50, wWarm[2], 160);
  for (let dx = 154; dx < 174; dx += 5) {
    pc.rect(dx, 154, 1, 50, wWarm[1], 150);
  }
  // Small glowing door window + brass handle
  pc.rect(158, 162, 10, 10, glow[4], 145, true);
  pc.rect(171, 180, 2, 3, glow[3], 175);

  // Hanging Bakery Sign (x: 112..136, y: 150..168)
  pc.rect(112, 148, 24, 3, RAMPS.metal_iron[2], 180);
  pc.rect(116, 152, 18, 14, wWarm[3], 190);
  pc.rect(120, 156, 10, 6, glow[3], 195);

  pc.addSelectiveOutline(wood[0]);
  return saveSprite('house_inn', pc, { hasEmissive: true, normalStrength: 2.2 });
}

// ---------- 4. RIVERSIDE COTTAGE (160x160 = 10x10 units) ----------
function genHouseCottage() {
  const pc = new PixelCanvas(160, 160);
  const plaster = RAMPS.plaster_wall;
  const wood = RAMPS.wood_dark;
  const wWarm = RAMPS.wood_warm;
  const roof = RAMPS.roof_slate;
  const stone = RAMPS.stone_cobble;
  const glow = RAMPS.lantern_glow;

  // Chimney
  pc.rect(112, 10, 16, 36, stone[2], 140);
  pc.rect(110, 6, 20, 4, stone[3], 155);

  // Body
  pc.rect(20, 64, 120, 92, plaster[2], 140);
  pc.rect(20, 132, 120, 24, stone[2], 155);
  pc.rect(20, 64, 120, 5, wood[2], 165);
  pc.rect(20, 64, 5, 92, wood[2], 165);
  pc.rect(135, 64, 5, 92, wood[2], 165);

  // Slate Roof
  for (let y = 14; y <= 70; y++) {
    const t = (y - 14) / 56;
    const hw = Math.round(10 + t * 68);
    for (let x = 80 - hw; x <= 80 + hw; x++) {
      const row = Math.floor(y / 6);
      const edge = ((x + (row % 2) * 4) % 8) < 1 || (y % 6 === 0);
      const shade = edge ? 1 : t < 0.35 ? 4 : t < 0.7 ? 3 : 2;
      pc.set(x, y, roof[shade], 190 - (y % 6) * 5);
    }
  }

  // Lit Windows & Door
  for (const wx of [38, 98]) {
    pc.rect(wx - 2, 82, 22, 24, wood[1], 175);
    pc.rect(wx, 84, 18, 20, glow[3], 135, true);
    pc.rect(wx + 2, 86, 14, 16, glow[4], 135, true);
    pc.rect(wx + 8, 84, 2, 20, wood[2], 180);
    pc.rect(wx, 93, 18, 2, wood[2], 180);
  }
  pc.rect(68, 114, 24, 42, wWarm[2], 165);
  pc.rect(75, 122, 10, 10, glow[4], 145, true);

  pc.addSelectiveOutline(roof[0]);
  return saveSprite('house_cottage', pc, { hasEmissive: true, normalStrength: 2.2 });
}

// ---------- 5. DISTANT COTTAGE (112x112) ----------
function genHouseDistant() {
  const pc = new PixelCanvas(112, 112);
  const plaster = RAMPS.plaster_wall;
  const roof = RAMPS.roof_slate;
  const glow = RAMPS.lantern_glow;
  pc.rect(18, 48, 76, 60, plaster[1], 130);
  for (let y = 14; y <= 52; y++) {
    const hw = Math.round(8 + ((y - 14) / 38) * 44);
    for (let x = 56 - hw; x <= 56 + hw; x++) {
      pc.set(x, y, roof[y < 30 ? 3 : 2], 170);
    }
  }
  pc.rect(34, 66, 12, 14, glow[3], 130, true);
  pc.rect(66, 66, 12, 14, glow[3], 130, true);
  pc.addSelectiveOutline(roof[0]);
  return saveSprite('house_distant', pc, { hasEmissive: true, normalStrength: 1.5 });
}

// ---------- 6. TREES (Hero Oak, Autumn Maple, Pine) ----------
function drawLeafCluster(pc, cx, cy, rx, ry, ramp, rng) {
  pc.ellipse(cx, cy, rx, ry, (x, y, dx, dy, d2) => {
    const noise = (rng() - 0.5) * 0.25;
    if (d2 + noise > 0.96) return;
    const light = -dx * 0.35 - dy * 0.55 + (rng() - 0.5) * 0.2;
    const idx = light > 0.45 ? 5 : light > 0.15 ? 4 : light > -0.15 ? 3 : light > -0.45 ? 2 : 1;
    const clamped = Math.min(ramp.length - 1, Math.max(1, idx));
    pc.set(x, y, ramp[clamped], 150 + light * 60);
  });
}

function genTreeHero() {
  const rng = makeRng(303);
  const pc = new PixelCanvas(192, 240);
  const wood = RAMPS.wood_dark;
  const g = RAMPS.foliage_green;

  // Gnarled Trunk & Roots (y: 120..236)
  for (let y = 120; y < 236; y++) {
    const t = (y - 120) / 116;
    const hw = Math.round(12 + Math.pow(t, 2.2) * 18);
    const sway = Math.round(Math.sin(t * 3.1) * 4);
    for (let x = 96 + sway - hw; x <= 96 + sway + hw; x++) {
      const dx = (x - (96 + sway)) / hw;
      const bark = ((x + y) % 5 === 0) ? -1 : 0;
      const idx = Math.max(1, Math.min(4, (dx < -0.2 ? 3 : dx < 0.3 ? 2 : 1) + bark));
      pc.set(x, y, wood[idx], 155 - Math.abs(dx) * 35);
    }
  }
  // Foliage Clusters (5 overlapping lush spheres)
  const clusters = [
    [62, 108, 42, 34], [130, 108, 42, 34],
    [52, 76, 38, 32], [140, 76, 38, 32],
    [96, 62, 54, 42]
  ];
  for (const [cx, cy, rx, ry] of clusters) {
    drawLeafCluster(pc, cx, cy, rx, ry, g, rng);
  }
  pc.addSelectiveOutline(g[0]);
  return saveSprite('tree_hero', pc, { normalStrength: 2.5 });
}

function genTreeAutumn() {
  const rng = makeRng(404);
  const pc = new PixelCanvas(128, 176);
  const wood = RAMPS.wood_dark;
  const a = RAMPS.foliage_autumn;
  for (let y = 90; y < 172; y++) {
    const t = (y - 90) / 82;
    const hw = Math.round(7 + Math.pow(t, 2.0) * 10);
    for (let x = 64 - hw; x <= 64 + hw; x++) {
      pc.set(x, y, wood[x < 62 ? 3 : 2], 140);
    }
  }
  const clusters = [[42, 78, 28, 24], [86, 78, 28, 24], [64, 48, 36, 30]];
  for (const [cx, cy, rx, ry] of clusters) {
    drawLeafCluster(pc, cx, cy, rx, ry, a, rng);
  }
  pc.addSelectiveOutline(a[0]);
  return saveSprite('tree_autumn', pc, { normalStrength: 2.3 });
}

function genTreePine() {
  const rng = makeRng(505);
  const pc = new PixelCanvas(80, 144);
  const wood = RAMPS.wood_dark;
  const g = RAMPS.foliage_green;
  pc.rect(36, 112, 8, 28, wood[1], 120);
  for (let tier = 0; tier < 4; tier++) {
    const topY = 14 + tier * 24;
    const h = 38;
    const maxW = 18 + tier * 6;
    for (let dy = 0; dy < h; dy++) {
      const hw = Math.round((dy / h) * maxW);
      for (let x = 40 - hw; x <= 40 + hw; x++) {
        const shade = (x < 40 ? 3 : 2) - (dy > h - 5 ? 1 : 0) + (rng() > 0.8 ? 1 : 0);
        pc.set(x, topY + dy, g[Math.max(1, Math.min(4, shade))], 145);
      }
    }
  }
  pc.addSelectiveOutline(g[0]);
  return saveSprite('tree_pine', pc, { normalStrength: 2.0 });
}

// ---------- 7. BRIDGE, DOCK, BOAT, PROPS ----------
function genBridge() {
  const pc = new PixelCanvas(128, 64);
  const s = RAMPS.stone_cobble;
  const w = RAMPS.wood_warm;
  const wd = RAMPS.wood_dark;
  // Arched deck
  for (let x = 4; x < 124; x++) {
    const t = (x - 64) / 60;
    const archY = Math.round(28 + t * t * 14);
    pc.rect(x, archY, 1, 8, w[3], 180);
    pc.rect(x, archY + 8, 1, 10, s[2], 160);
    // Railing
    pc.set(x, archY - 10, wd[3], 195);
    pc.set(x, archY - 9, wd[2], 190);
    if (x % 20 === 4) {
      pc.rect(x - 1, archY - 13, 3, 15, wd[3], 205);
    }
  }
  pc.addSelectiveOutline(s[0]);
  return saveSprite('bridge', pc);
}

function genDock() {
  const pc = new PixelCanvas(96, 48);
  const w = RAMPS.wood_warm;
  const wd = RAMPS.wood_dark;
  for (const px of [12, 46, 80]) {
    pc.rect(px, 16, 6, 30, wd[2], 150);
  }
  pc.rect(4, 14, 88, 7, w[3], 185);
  for (let x = 8; x < 90; x += 8) {
    pc.rect(x, 14, 1, 7, wd[1], 160);
  }
  pc.addSelectiveOutline(wd[0]);
  return saveSprite('dock', pc);
}

function genRowboat() {
  const pc = new PixelCanvas(64, 32);
  const w = RAMPS.wood_warm;
  const wd = RAMPS.wood_dark;
  for (let y = 12; y < 26; y++) {
    const t = (y - 12) / 14;
    const hw = Math.round(26 - t * 8);
    pc.rect(32 - hw, y, hw * 2, 1, w[t < 0.3 ? 4 : t < 0.7 ? 3 : 2], 170);
  }
  pc.rect(28, 12, 8, 3, wd[3], 185);
  pc.addSelectiveOutline(wd[0]);
  return saveSprite('rowboat', pc);
}

function genStreetlamp() {
  const pc = new PixelCanvas(24, 64);
  const m = RAMPS.metal_iron;
  const g = RAMPS.lantern_glow;
  pc.rect(10, 56, 4, 6, m[2], 170);
  pc.rect(11, 14, 2, 44, m[2], 165);
  pc.rect(11, 12, 9, 2, m[3], 175);
  // Hanging lantern
  pc.rect(18, 14, 1, 3, m[2], 170);
  pc.rect(15, 17, 7, 2, m[3], 190);
  pc.rect(16, 19, 5, 7, g[3], 220, true);
  pc.rect(17, 20, 3, 5, g[4], 235, true);
  pc.rect(15, 26, 7, 2, m[2], 190);
  pc.addSelectiveOutline(m[0]);
  return saveSprite('streetlamp', pc, { hasEmissive: true });
}

function genFlowerBush(name, flowerRamp, seed) {
  const rng = makeRng(seed);
  const pc = new PixelCanvas(48, 36);
  const g = RAMPS.foliage_green;
  drawLeafCluster(pc, 16, 22, 13, 11, g, rng);
  drawLeafCluster(pc, 32, 22, 13, 11, g, rng);
  drawLeafCluster(pc, 24, 16, 15, 12, g, rng);
  for (let i = 0; i < 14; i++) {
    const fx = Math.round(10 + rng() * 28);
    const fy = Math.round(8 + rng() * 18);
    if (pc.getA(fx, fy) > 0) {
      pc.set(fx, fy, flowerRamp[3], 210);
      pc.set(fx + 1, fy, flowerRamp[2], 200);
      pc.set(fx, fy + 1, flowerRamp[1], 195);
    }
  }
  pc.addSelectiveOutline(g[0]);
  return saveSprite(name, pc);
}

function genFence() {
  const pc = new PixelCanvas(64, 28);
  const w = RAMPS.wood_warm;
  const wd = RAMPS.wood_dark;
  pc.rect(2, 10, 60, 3, w[2], 155);
  pc.rect(2, 19, 60, 3, w[2], 155);
  for (let x = 4; x < 62; x += 12) {
    pc.rect(x, 4, 4, 22, w[3], 175);
    pc.rect(x + 1, 3, 2, 1, w[4], 185);
  }
  pc.addSelectiveOutline(wd[0]);
  return saveSprite('fence', pc);
}

function genBarrel() {
  const pc = new PixelCanvas(24, 28);
  const w = RAMPS.wood_warm;
  const m = RAMPS.metal_iron;
  pc.ellipse(12, 14, 9, 11, (x, y, dx, dy) => {
    const idx = dx < -0.3 ? 4 : dx < 0.2 ? 3 : 2;
    pc.set(x, y, w[idx], 180 - Math.abs(dx) * 40);
  });
  pc.rect(4, 8, 16, 2, m[2], 195);
  pc.rect(4, 18, 16, 2, m[2], 195);
  pc.addSelectiveOutline(RAMPS.wood_dark[0]);
  return saveSprite('barrel', pc);
}

function genJar() {
  const pc = new PixelCanvas(18, 24);
  const r = RAMPS.roof_terracotta;
  pc.ellipse(9, 14, 6, 7, (x, y, dx) => {
    pc.set(x, y, r[dx < -0.2 ? 4 : dx < 0.3 ? 3 : 2], 185 - Math.abs(dx) * 40);
  });
  pc.rect(6, 5, 6, 3, r[3], 190);
  pc.addSelectiveOutline(r[0]);
  return saveSprite('jar', pc);
}

function genCrate() {
  const pc = new PixelCanvas(28, 24);
  const w = RAMPS.wood_warm;
  const wd = RAMPS.wood_dark;
  pc.rect(3, 4, 22, 18, w[3], 175);
  pc.rect(3, 4, 22, 2, w[4], 185);
  pc.rect(3, 20, 22, 2, w[1], 165);
  pc.rect(3, 4, 2, 18, w[2], 170);
  pc.rect(23, 4, 2, 18, w[2], 170);
  for (let i = 0; i < 16; i++) {
    pc.set(6 + i, 6 + i, wd[2], 180);
  }
  pc.addSelectiveOutline(wd[0]);
  return saveSprite('crate', pc);
}

function genBench() {
  const pc = new PixelCanvas(48, 24);
  const w = RAMPS.wood_warm;
  const m = RAMPS.metal_iron;
  pc.rect(6, 13, 4, 9, m[2], 160);
  pc.rect(38, 13, 4, 9, m[2], 160);
  pc.rect(4, 6, 40, 6, w[3], 175);
  pc.rect(3, 12, 42, 4, w[4], 185);
  pc.addSelectiveOutline(m[0]);
  return saveSprite('bench', pc);
}

function genSignpost() {
  const pc = new PixelCanvas(24, 40);
  const w = RAMPS.wood_warm;
  const wd = RAMPS.wood_dark;
  pc.rect(10, 6, 4, 32, wd[2], 165);
  pc.rect(4, 10, 16, 6, w[3], 180);
  pc.rect(6, 18, 14, 5, w[4], 180);
  pc.addSelectiveOutline(wd[0]);
  return saveSprite('signpost', pc);
}

function genBanner() {
  const pc = new PixelCanvas(96, 24);
  const s = RAMPS.chibi_scarf;
  const g = RAMPS.flower_gold;
  const p = RAMPS.plaster_wall;
  const cols = [s[2], g[3], RAMPS.chibi_cloak[3], p[4]];
  for (let x = 2; x < 94; x++) {
    const sag = Math.round(Math.sin((x / 96) * Math.PI) * 5);
    pc.set(x, 3 + sag, RAMPS.wood_dark[2], 160);
    if (x % 12 >= 2 && x % 12 <= 9) {
      const idx = Math.floor(x / 12) % cols.length;
      const h = 8 - Math.abs((x % 12) - 5.5);
      for (let dy = 1; dy <= h; dy++) {
        pc.set(x, 3 + sag + dy, cols[idx], 175);
      }
    }
  }
  return saveSprite('banner', pc);
}

function genSmallCreatures() {
  // Bird
  const bird = new PixelCanvas(12, 10);
  const p = RAMPS.plaster_wall;
  const c = RAMPS.chibi_cloak;
  bird.rect(3, 4, 5, 3, p[4], 180);
  bird.rect(7, 3, 2, 2, p[3], 185);
  bird.set(9, 4, RAMPS.flower_gold[3], 190);
  bird.rect(1, 3, 3, 2, c[3], 185);
  bird.addSelectiveOutline(c[0]);
  saveSprite('bird', bird);

  // Butterfly
  const bf = new PixelCanvas(10, 8);
  const g = RAMPS.flower_gold;
  bf.rect(4, 2, 2, 4, RAMPS.wood_dark[0], 170);
  bf.rect(1, 1, 3, 3, g[3], 190);
  bf.rect(6, 1, 3, 3, g[3], 190);
  bf.rect(2, 4, 2, 2, g[2], 180);
  bf.rect(6, 4, 2, 2, g[2], 180);
  saveSprite('butterfly', bf);

  // Leaf
  const leaf = new PixelCanvas(6, 6);
  const a = RAMPS.foliage_autumn;
  leaf.rect(1, 2, 4, 2, a[3], 170);
  leaf.set(2, 1, a[4], 180);
  leaf.set(3, 4, a[2], 160);
  saveSprite('leaf', leaf);
}

// ---------- GENERATE ALL + 4X ASSETS SHEET ----------
const generated = [
  ['ground_grass', genGroundGrass()],
  ['ground_cobble', genGroundCobble()],
  ['chibi_hero', genChibiHero()],
  ['house_inn', genHouseInn()],
  ['house_cottage', genHouseCottage()],
  ['house_distant', genHouseDistant()],
  ['tree_hero', genTreeHero()],
  ['tree_autumn', genTreeAutumn()],
  ['tree_pine', genTreePine()],
  ['bridge', genBridge()],
  ['dock', genDock()],
  ['rowboat', genRowboat()],
  ['streetlamp', genStreetlamp()],
  ['bush_pink', genFlowerBush('bush_pink', RAMPS.flower_pink, 606)],
  ['bush_gold', genFlowerBush('bush_gold', RAMPS.flower_gold, 707)],
  ['fence', genFence()],
  ['barrel', genBarrel()],
  ['jar', genJar()],
  ['crate', genCrate()],
  ['bench', genBench()],
  ['signpost', genSignpost()],
  ['banner', genBanner()],
];
genSmallCreatures();

// Build 1920x1080 G2-assets-sheet.png (4x Nearest zoom on neutral #2a2c38 background)
const sheetW = 1920, sheetH = 1080;
const sheet = new Uint8Array(sheetW * sheetH * 4);
for (let i = 0; i < sheetW * sheetH * 4; i += 4) {
  sheet[i] = 42; sheet[i + 1] = 44; sheet[i + 2] = 56; sheet[i + 3] = 255;
}

const scale = 2; // 2x crisp zoom fits all large houses + trees + chibi neatly on 1920x1080
let curX = 32, curY = 32, rowMaxH = 0;
for (const [, pc] of generated) {
  if (curX + pc.w * scale + 24 > sheetW) {
    curX = 32;
    curY += rowMaxH + 24;
    rowMaxH = 0;
  }
  if (curY + pc.h * scale + 24 > sheetH) continue;
  for (let y = 0; y < pc.h; y++) {
    for (let x = 0; x < pc.w; x++) {
      const si = (y * pc.w + x) * 4;
      const a = pc.rgba[si + 3];
      if (a === 0) continue;
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const dx = curX + x * scale + sx;
          const dy = curY + y * scale + sy;
          const di = (dy * sheetW + dx) * 4;
          sheet[di] = pc.rgba[si];
          sheet[di + 1] = pc.rgba[si + 1];
          sheet[di + 2] = pc.rgba[si + 2];
          sheet[di + 3] = 255;
        }
      }
    }
  }
  curX += pc.w * scale + 24;
  rowMaxH = Math.max(rowMaxH, pc.h * scale);
}
writePng(path.join(SHOTS_DIR, 'G2-assets-sheet.png'), sheetW, sheetH, sheet);
console.log(`Generated ${generated.length + 3} sprites + normal/emissive maps and shots/G2-assets-sheet.png`);

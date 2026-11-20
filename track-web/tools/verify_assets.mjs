import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PALETTE = JSON.parse(fs.readFileSync(path.resolve(ROOT, '../shared/palette.json'), 'utf8'));
const SPRITES_DIR = path.resolve(ROOT, 'assets/sprites');

const allowed = new Set();
for (const hexList of Object.values(PALETTE.ramps)) {
  for (const h of hexList) allowed.add(h.toLowerCase());
}

let errors = 0;
let checked = 0;
for (const file of fs.readdirSync(SPRITES_DIR)) {
  if (!file.endsWith('.png') || file.endsWith('_n.png') || file.endsWith('_e.png')) continue;
  const png = PNG.sync.read(fs.readFileSync(path.join(SPRITES_DIR, file)));
  let bad = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] === 0) continue;
    const hex = '#' + [png.data[i], png.data[i + 1], png.data[i + 2]]
      .map(v => v.toString(16).padStart(2, '0')).join('');
    if (!allowed.has(hex)) bad++;
  }
  checked++;
  if (bad > 0) {
    console.error(`FAIL ${file}: ${bad} off-palette pixels`);
    errors++;
  } else {
    console.log(`OK   ${file} (${png.width}x${png.height})`);
  }
}
if (errors > 0) process.exit(1);
console.log(`Palette audit passed: ${checked}/${checked} sprites 100% on-palette.`);

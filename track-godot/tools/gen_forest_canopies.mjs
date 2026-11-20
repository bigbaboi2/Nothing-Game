import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/sprites');
fs.mkdirSync(OUT, { recursive: true });
const W = 512, H = 416;
function random(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hex(c) { return [parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)]; }
function dab(png,x,y,rx,ry,color,alpha=1) {
  const [r,g,b]=hex(color); const x0=Math.max(0,Math.floor(x-rx)),x1=Math.min(W-1,Math.ceil(x+rx)),y0=Math.max(0,Math.floor(y-ry)),y1=Math.min(H-1,Math.ceil(y+ry));
  for(let py=y0;py<=y1;py++) for(let px=x0;px<=x1;px++) { const dx=(px-x)/rx,dy=(py-y)/ry; if(dx*dx+dy*dy>1)continue; const i=(py*W+px)*4,a=alpha; png.data[i]=r*a+png.data[i]*(1-a);png.data[i+1]=g*a+png.data[i+1]*(1-a);png.data[i+2]=b*a+png.data[i+2]*(1-a);png.data[i+3]=255*a+png.data[i+3]*(1-a); }
}
function leaf(png,rng,x,y,scale,color,alpha=1) { const len=(5+rng()*17)*scale,wide=(2+rng()*6)*scale,ang=-.55+rng()*1.1; const steps=Math.ceil(len/2); for(let i=0;i<steps;i++){const t=i/steps;dab(png,x+Math.cos(ang)*len*t,y+Math.sin(ang)*len*t,wide*(1-t*.72),wide*.5*(1-t*.65),color,alpha);} }
function layer(name,seed,palette,mode) {
  const rng=random(seed),png=new PNG({width:W,height:H});
  const clusters=[]; const n=mode==='shadow'?15:mode==='base'?17:mode==='mid'?13:mode==='sun'?8:10;
  for(let i=0;i<n;i++){const a=rng()*Math.PI*2,rad=Math.sqrt(rng())*.77;clusters.push([256+Math.cos(a)*198*rad,205+Math.sin(a)*142*rad,25+rng()*38,20+rng()*29]);}
  for(const [cx,cy,rx,ry] of clusters){ const base=palette[Math.floor(rng()*palette.length)];
    for(let k=0;k<48;k++){const a=rng()*Math.PI*2,r=Math.sqrt(rng());dab(png,cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r,3+rng()*8,3+rng()*7,base,.78);}
    if(mode!=='shadow') for(let k=0;k<(mode==='base'?42:mode==='mid'?34:24);k++){const a=rng()*Math.PI*2,r=Math.sqrt(rng());const x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;leaf(png,rng,x,y,.75+rng()*.6,palette[Math.min(palette.length-1,Math.max(0,Math.floor(rng()*palette.length)))],mode==='sun'?.88:.82);}
  }
  const file=path.join(OUT,`${name}.png`);fs.writeFileSync(file,PNG.sync.write(png));console.log(file);
}
layer('tree_paint_shadow',1201,['#18372f','#244a37','#31563b'],'shadow');
layer('tree_paint_base',1202,['#315a3d','#416f46','#537d4a','#678c50'],'base');
layer('tree_paint_mid',1203,['#477848','#5c914e','#74a556','#83ad5d'],'mid');
layer('tree_paint_sun',1204,['#88b85c','#a6ca68','#c1d979','#dfdf91'],'sun');
layer('tree_paint_clump',1205,['#3c6d43','#57884a','#75a451','#a8c96b'],'mid');

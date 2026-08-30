#!/usr/bin/env node
/* GLB 실측 도구 — 헤롯 성전 모델을 고고학 치수와 대조할 때 쓴다.
 *
 * 왜 필요한가: 모델이 맞는지 눈으로만 보면 못 잡는다. 2026-08-24 조사에서
 * 새로 받은 herod-temple-interior.glb 는 겉보기에 훌륭했지만, 재어 보니
 * 주랑이 단열 8.6 m(요세푸스는 이중 주랑 25규빗=13.13 m)이고 왕의 주랑
 * 기둥이 70주(요세푸스 162주)였다. 수치를 내야 드러난다.
 *
 * 사용:
 *   node tools/herod-temple/measure-glb.mjs <파일.glb> groups
 *       이름 접두사별 월드 바운딩 박스
 *   node tools/herod-temple/measure-glb.mjs <파일.glb> find <정규식> [개수]
 *       이름이 맞는 노드의 월드 바운딩 박스
 *   node tools/herod-temple/measure-glb.mjs <파일.glb> levels [노드이름]
 *       정점이 몰린 높이 — 병합 메시에서 바닥·지붕 층을 찾는다
 *   node tools/herod-temple/measure-glb.mjs <파일.glb> ortho <plan|east> \
 *        <out.ppm> <가로0> <가로1> <세로0> <세로1> <픽셀폭> [색최소] [색최대]
 *       직교투영 렌더 — 형태를 눈으로 확인한다. PPM 은 PIL 로 PNG 변환.
 *
 * 노드 변환(TRS)을 곱한 월드 좌표로 잰다. accessor 의 min/max 를 그냥 읽으면
 * 부모 변환이 빠져 값이 틀린다.
 */
'use strict';
import fs from 'node:fs';

const [,, FILE, MODE, ...rest] = process.argv;
if (!FILE || !MODE) { console.error('사용법은 파일 머리말 참조'); process.exit(2); }

function load(p){
  const b = fs.readFileSync(p);
  let o = 12, g = null, bin = null;
  while (o < b.length){
    const l = b.readUInt32LE(o), t = b.readUInt32LE(o+4), d = b.subarray(o+8, o+8+l);
    if (t === 0x4E4F534A) g = JSON.parse(d.toString('utf8').replace(/\0+$/,'').trim());
    if (t === 0x004E4942) bin = d;
    o += 8 + l + ((4 - (l % 4)) % 4);
  }
  return { g, bin };
}
function nodeMatrix(n){
  if (n.matrix) return n.matrix;
  const t = n.translation||[0,0,0], r = n.rotation||[0,0,0,1], s = n.scale||[1,1,1];
  const [x,y,z,w] = r;
  const m = [1-2*(y*y+z*z),2*(x*y+z*w),2*(x*z-y*w),0, 2*(x*y-z*w),1-2*(x*x+z*z),2*(y*z+x*w),0,
             2*(x*z+y*w),2*(y*z-x*w),1-2*(x*x+y*y),0, 0,0,0,1];
  for (let c=0;c<3;c++) for (let k=0;k<3;k++) m[c*4+k] *= s[c];
  m[12]=t[0]; m[13]=t[1]; m[14]=t[2];
  return m;
}
const mul = (a,b) => { const o = new Array(16).fill(0);
  for (let c=0;c<4;c++) for (let r=0;r<4;r++) for (let k=0;k<4;k++) o[c*4+r] += a[k*4+r]*b[c*4+k];
  return o; };
const xf = (m,p) => [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12], m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
                     m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
const I4 = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

const { g, bin } = load(FILE);
function acc3(i){
  const a = g.accessors[i], bv = g.bufferViews[a.bufferView];
  const st = bv.byteStride || 12, base = (bv.byteOffset||0) + (a.byteOffset||0);
  const out = new Array(a.count);
  for (let k=0;k<a.count;k++){ const o = base + k*st;
    out[k] = [bin.readFloatLE(o), bin.readFloatLE(o+4), bin.readFloatLE(o+8)]; }
  return out;
}
function accIdx(i){
  const a = g.accessors[i], bv = g.bufferViews[a.bufferView];
  const sz = a.componentType===5123 ? 2 : a.componentType===5125 ? 4 : 1;
  const base = (bv.byteOffset||0) + (a.byteOffset||0), out = new Array(a.count);
  for (let k=0;k<a.count;k++){ const o = base + k*sz;
    out[k] = sz===2 ? bin.readUInt16LE(o) : sz===4 ? bin.readUInt32LE(o) : bin.readUInt8(o); }
  return out;
}
/* 노드를 훑으며 월드 좌표 메시를 모은다 */
function eachMesh(fn){
  (function walk(list, P){
    for (const i of [].concat(list)){
      const n = g.nodes[i], M = mul(P, nodeMatrix(n));
      if (n.mesh != null) for (const p of g.meshes[n.mesh].primitives) fn(n, p, M);
      for (const c of n.children||[]) walk(c, M);
    }
  })(g.scenes[g.scene ?? 0].nodes, I4);
}
function bbox(prim, M){
  const a = g.accessors[prim.attributes.POSITION];
  const mn = [1e9,1e9,1e9], mx = [-1e9,-1e9,-1e9];
  if (!a || !a.min) return null;
  for (const X of [a.min[0],a.max[0]]) for (const Y of [a.min[1],a.max[1]]) for (const Z of [a.min[2],a.max[2]]){
    const w = xf(M, [X,Y,Z]);
    for (let k=0;k<3;k++){ mn[k]=Math.min(mn[k],w[k]); mx[k]=Math.max(mx[k],w[k]); }
  }
  return { mn, mx };
}
const f = (v) => v.toFixed(2).padStart(9);

if (MODE === 'groups'){
  const gr = {};
  eachMesh((n, p, M) => {
    const key = (n.name||'?').replace(/(_\d+)+$/, '');
    const b = bbox(p, M); if (!b) return;
    const e = gr[key] || (gr[key] = { n:0, mn:[1e9,1e9,1e9], mx:[-1e9,-1e9,-1e9] });
    e.n++;
    for (let k=0;k<3;k++){ e.mn[k]=Math.min(e.mn[k],b.mn[k]); e.mx[k]=Math.max(e.mx[k],b.mx[k]); }
  });
  const rows = Object.entries(gr).sort((a,b) => b[1].n - a[1].n);
  console.log('  이름군                              개수        X                Y                Z');
  for (const [k,v] of rows)
    console.log(`  ${k.padEnd(34)} ${String(v.n).padStart(5)} ${f(v.mn[0])}~${f(v.mx[0])} ${f(v.mn[1])}~${f(v.mx[1])} ${f(v.mn[2])}~${f(v.mx[2])}`);
}
else if (MODE === 'find'){
  const re = new RegExp(rest[0], 'i'), lim = Number(rest[1] || 40);
  let n = 0;
  eachMesh((node, p, M) => {
    if (!re.test(node.name||'') || n >= lim) return;
    const b = bbox(p, M); if (!b) return;
    n++;
    console.log(`  ${(node.name||'').padEnd(30)} X${f(b.mn[0])}~${f(b.mx[0])} Y${f(b.mn[1])}~${f(b.mx[1])} Z${f(b.mn[2])}~${f(b.mx[2])}` +
                `  크기 ${(b.mx[0]-b.mn[0]).toFixed(2)}×${(b.mx[1]-b.mn[1]).toFixed(2)}×${(b.mx[2]-b.mn[2]).toFixed(2)}`);
  });
  console.log(`  ${n}개`);
}
else if (MODE === 'levels'){
  const want = rest[0];
  const hist = {};
  let total = 0;
  eachMesh((node, p, M) => {
    if (want && !(node.name||'').includes(want)) return;
    for (const v of acc3(p.attributes.POSITION)){
      const y = xf(M, v)[1];
      const b = (Math.round(y*2)/2).toFixed(1);
      hist[b] = (hist[b]||0) + 1; total++;
    }
  });
  const top = Object.entries(hist).sort((a,b) => b[1]-a[1]).slice(0, 20)
    .sort((a,b) => Number(a[0]) - Number(b[0]));
  const max = top.length ? Math.max(...top.map(t => t[1])) : 1;
  console.log(`  정점 ${total}개 · 몰린 높이 (0.5 m 구간)`);
  for (const [y,c] of top)
    console.log(`    Y ${String(y).padStart(8)}  ${String(c).padStart(6)} ${'█'.repeat(Math.round(c/max*34))}`);
}
else if (MODE === 'ortho'){
  /* 형태를 눈으로 본다. z 버퍼 소프트웨어 래스터라이저 — 높이로 색을 준다.
     단색으로 칠하면 지붕과 포장면이 구분되지 않아 아무것도 안 보인다. */
  const [view, out, X0, X1, Z0, Z1, WPX, CMIN0, CMAX0] = rest;
  const x0=+X0, x1=+X1, z0=+Z0, z1=+Z1, W=+WPX|0;
  const CMIN = CMIN0 != null ? +CMIN0 : -5, CMAX = CMAX0 != null ? +CMAX0 : 60;
  const H = Math.round(W*(z1-z0)/(x1-x0));
  const proj = view === 'plan' ? (p)=>[ (p[0]-x0)/(x1-x0)*W, H-(p[2]-z0)/(z1-z0)*H, p[1] ]
                               : (p)=>[ (p[0]-x0)/(x1-x0)*W, H-(p[1]-z0)/(z1-z0)*H, -p[2] ];
  const zbuf = new Float32Array(W*H).fill(-1e9), col = new Uint8Array(W*H*3);
  for (let i=0;i<W*H;i++){ col[i*3]=11; col[i*3+1]=26; col[i*3+2]=36; }
  let tris = 0;
  eachMesh((node, p, M) => {
    const P3 = acc3(p.attributes.POSITION).map(v => xf(M, v));
    const idx = p.indices != null ? accIdx(p.indices) : P3.map((_,k)=>k);
    for (let k=0;k+2<idx.length;k+=3){ tris++; raster(P3[idx[k]], P3[idx[k+1]], P3[idx[k+2]]); }
  });
  function raster(a,b,c){
    const A=proj(a), B=proj(b), C=proj(c);
    const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
    const nx=u[1]*v[2]-u[2]*v[1], ny=u[2]*v[0]-u[0]*v[2], nz=u[0]*v[1]-u[1]*v[0];
    const L=Math.hypot(nx,ny,nz)||1;
    const s = 0.30 + 0.70*Math.abs((nx*0.4 + ny*0.82 + nz*0.4)/L);
    const minx=Math.max(0,Math.floor(Math.min(A[0],B[0],C[0]))), maxx=Math.min(W-1,Math.ceil(Math.max(A[0],B[0],C[0])));
    const miny=Math.max(0,Math.floor(Math.min(A[1],B[1],C[1]))), maxy=Math.min(H-1,Math.ceil(Math.max(A[1],B[1],C[1])));
    const d=(B[0]-A[0])*(C[1]-A[1])-(C[0]-A[0])*(B[1]-A[1]);
    if (!d) return;
    for (let y=miny;y<=maxy;y++) for (let x=minx;x<=maxx;x++){
      const px=x+0.5, py=y+0.5;
      const w0=((B[0]-px)*(C[1]-py)-(C[0]-px)*(B[1]-py))/d;
      const w1=((C[0]-px)*(A[1]-py)-(A[0]-px)*(C[1]-py))/d;
      const w2=1-w0-w1;
      if (w0<0||w1<0||w2<0) continue;
      const z=w0*A[2]+w1*B[2]+w2*C[2], o=y*W+x;
      if (z<=zbuf[o]) continue;
      zbuf[o]=z;
      const t=Math.max(0,Math.min(1,(z-CMIN)/(CMAX-CMIN)));
      col[o*3]=Math.min(255,(40+215*t)*s);
      col[o*3+1]=Math.min(255,(60+180*Math.pow(t,0.7))*s);
      col[o*3+2]=Math.min(255,(110+60*(1-t))*s);
    }
  }
  fs.writeFileSync(out, Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`), Buffer.from(col)]));
  console.log(`  삼각형 ${tris} · ${out} ${W}×${H}  (PNG 로: python3 -c "from PIL import Image; Image.open('${out}').save('${out.replace(/\.ppm$/,'.png')}')")`);
}
else { console.error(`모르는 모드: ${MODE}`); process.exit(2); }

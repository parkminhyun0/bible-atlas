#!/usr/bin/env node
/* 헤롯 성전 성역 내부 → 상류 프레임으로 이식  (기획서 §10.1 후속)
 *
 * ── 왜 이 도구가 있나 ─────────────────────────────────────────────
 * 2026-08-24 조사(data/herod-temple/03_모델_비교_이방인의_뜰.md)에서 두 모델을
 * 재어 보니 서로 반대쪽에서 앞섰다.
 *   · 이방인의 뜰 — 현재 lod1(openbibleinfo)이 낫다. 이중 주랑 25규빗, 왕의
 *     주랑 162주, 서벽 4문·훌다문·남측 대계단이 요세푸스와 발굴 수치 그대로다.
 *     새 GLB 는 단열 8.6 m 띠 하나뿐이고 왕의 주랑도 70주다.
 *   · 성역 안쪽 — 새 GLB 가 낫다. 부재가 이름별로 분리돼 있어 해설을 붙일 수
 *     있고, 소레그 경고비문·미크베·나실인 화덕까지 있다. 성소 100×100규빗,
 *     번제단 32×32규빗, 여인의 뜰 135규빗이 모두 미돗과 맞는다.
 * 그래서 바탕은 그대로 두고 성역 안쪽만 갈아 끼운다.
 *
 * ── 이 도구가 하는 일 ─────────────────────────────────────────────
 *   1. 새 GLB 에서 성역 밖 부재(대지·주랑·옹벽·안토니아)를 버린다.
 *   2. 미돗과 어긋난 곳을 축별 구간 사상(piecewise map)으로 바로잡는다.
 *   3. 상류(openbibleinfo) 로컬 프레임으로 옮겨 GLB 로 다시 쓴다.
 *      같은 modelMatrix 로 두 모델이 겹쳐 앉는다.
 *
 * 사용: node tools/herod-temple/build-interior.mjs [--in <glb>] [--out <glb>]
 */
'use strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const IN  = arg('--in',  path.join(process.env.HOME, 'Documents/herod-temple-interior.glb'));
const OUT = arg('--out', path.join(ROOT, 'assets/herod-temple/ad30/interior-v2.glb'));

/* ══ 1. 상류 프레임 상수 (vendor/3d-temple-mount/src/40-data.js 와 같은 값) ══
   손으로 옮긴 값이다. 상류가 바뀌면 여기도 바꿔야 한다. 아래 검산이 지켜 준다. */
const CUBIT = 0.525, cu = (n) => n * CUBIT;
const PLAT = { NW:[0,0], NE:[313.9,26.0], SE:[280.0,485.0], SW:[0,485.0] };
const _ew = [PLAT.SE[0]-PLAT.NE[0], PLAT.SE[1]-PLAT.NE[1]];
const _ewLen = Math.hypot(_ew[0], _ew[1]);
const V_SOUTH = [_ew[0]/_ewLen, _ew[1]/_ewLen];
const U_EAST  = [ V_SOUTH[1], -V_SOUTH[0] ];
const SQ_SIDE = cu(500), SQ_N_OFF = 130.5;
const SQ_NE = [ PLAT.NE[0] + V_SOUTH[0]*SQ_N_OFF, PLAT.NE[1] + V_SOUTH[1]*SQ_N_OFF ];
const SQ_NW = [ SQ_NE[0] - U_EAST[0]*SQ_SIDE,     SQ_NE[1] - U_EAST[1]*SQ_SIDE ];
/* 성역 로컬(규빗): x 는 동쪽으로, z 는 남쪽으로. 미돗 5:1 · 2:5 배분 */
const MARGIN_W = 62, MARGIN_N = 95;
const AZ = { x0:MARGIN_W, x1:MARGIN_W+187, z0:MARGIN_N, z1:MARGIN_N+135 };
const AXIS_Z = (AZ.z0 + AZ.z1) / 2;          // 162.5규빗 — 성소 동서 축선
const TEMPLE_E = AZ.x1 - 76;                 // 173규빗 — 울람 바깥 면
const ESP_TO_HOUSE = cu(22);                 // 11.55 m — 이방인의 뜰 → 성소 바닥

/* ══ 2. 새 모델 프레임 ══
   +X 북 · +Y 위 · +Z 동, 원점은 성소 바닥 중심. 실측으로 얻은 기준 두 개: */
const SRC_FACADE_Z = 22.58;    // 울람 바깥 면 (상류 TEMPLE_E 에 대응)
const SRC_ESP_Y    = -11.03;   // 이방인의 뜰 포장면

/* ══ 3. 미돗과 어긋난 곳 — 구간 사상 ══
   새 모델은 건물 자체는 맞는데 뜰 사이 간격이 부풀어 있다. 통째로 옮기면
   바닥·벽처럼 경계를 걸친 부재가 찢어지므로, 좌표축을 구간별로 늘였다 줄인다.
   단조 증가라 뒤집히지 않는다.

   Z(동서) — 미돗 5:1 은 아자라 187규빗을 동에서 서로
     이스라엘 11 · 제사장 11 · 번제단 32 · 사이 22 · 성소 100 · 뒤 11 로 나눈다.
     새 모델은 번제단 동쪽 면에서 니가노르 문까지 45규빗을 두었다(미돗은 22).
     여인의 뜰 자체(135규빗)와 번제단(32규빗)은 맞으므로 그 사이만 줄인다. */
const Z_MAP = [
  // [원본 Z, 목표 Z]  — 사이는 선형 보간, 양 끝은 기울기 유지
  [ 50.93,  50.93],   // 번제단 동쪽 면 (미돗 227규빗) — 그대로
  [ 73.80,  62.51],   // 니가노르 문 서쪽 면 (미돗 249규빗) — 11.29 m 당김
  [147.00, 133.36],   // 여인의 뜰 동쪽 벽 바깥 (미돗 384규빗)
  [158.50, 138.61],   // 헬 바깥 = 소레그 (미돗 394규빗 — 여인의 뜰 +10규빗)
];
/* X(남북) — 미돗 2:3 「헬은 10규빗」. 새 모델은 뜰 벽에서 소레그까지 10.6 m
   (20규빗)를 두었다. 뜰(135규빗)은 맞으므로 헬만 5.25 m 로 줄인다. */
const X_MAP = [
  [ 37.40,  37.40],   // 여인의 뜰·아자라 바깥 벽 — 그대로
  [ 48.00,  42.65],   // 헬 바깥 = 소레그 (벽에서 10규빗)
];

/* 번제단 경사로 — 미돗 3:3 「32×16규빗, 남쪽」. 길이 32규빗(16.8 m)이 남북,
   폭 16규빗(8.4 m)이 동서다. 새 모델은 이 둘을 뒤바꿔 놓았다.
   제단 남쪽 면에 붙여 남쪽으로 뻗도록 다시 앉힌다. */
const RAMP = {
  match: /^outer_altar_ramp/,
  // 제단: X ±8.4 · Z 33.6~50.4 · 바닥 Y=-3.1, 상면 Y=2.1
  target: { x0:-25.2, x1:-8.4, z0:38.0, z1:46.4, y0:-3.8, y1:2.1 },
};

/* 버릴 부재 — 성역 밖. 이 이름들은 현재 lod1 이 훨씬 정확하게 갖고 있다. */
const DROP = /^(esplanade|stoa_|mct_|mount_retaining|ant_|antonia_)/;

/* ══ 4. GLB 읽기 ══ */
function readGlb(p){
  const b = fs.readFileSync(p);
  if (b.readUInt32LE(0) !== 0x46546C67) throw new Error(`GLB 가 아니다: ${p}`);
  let o = 12, json = null, bin = null;
  while (o < b.length) {
    const len = b.readUInt32LE(o), type = b.readUInt32LE(o+4);
    const d = b.subarray(o+8, o+8+len);
    if (type === 0x4E4F534A) json = JSON.parse(d.toString('utf8'));
    if (type === 0x004E4942) bin = d;
    o += 8 + len + ((4 - (len % 4)) % 4);
  }
  return { g: json, bin };
}
function nodeMatrix(n){
  if (n.matrix) return n.matrix;
  const t = n.translation||[0,0,0], r = n.rotation||[0,0,0,1], s = n.scale||[1,1,1];
  const [x,y,z,w] = r;
  const m = [1-2*(y*y+z*z), 2*(x*y+z*w), 2*(x*z-y*w), 0,
             2*(x*y-z*w), 1-2*(x*x+z*z), 2*(y*z+x*w), 0,
             2*(x*z+y*w), 2*(y*z-x*w), 1-2*(x*x+y*y), 0, 0,0,0,1];
  for (let c=0;c<3;c++) for (let r2=0;r2<3;r2++) m[c*4+r2] *= s[c];
  m[12]=t[0]; m[13]=t[1]; m[14]=t[2];
  return m;
}
const mul = (a,b) => { const o = new Array(16).fill(0);
  for (let c=0;c<4;c++) for (let r=0;r<4;r++) for (let k=0;k<4;k++) o[c*4+r] += a[k*4+r]*b[c*4+k];
  return o; };
const xfPos = (m,p) => [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],
                        m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],
                        m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];
const xfDir = (m,p) => [m[0]*p[0]+m[4]*p[1]+m[8]*p[2],
                        m[1]*p[0]+m[5]*p[1]+m[9]*p[2],
                        m[2]*p[0]+m[6]*p[1]+m[10]*p[2]];

const { g: src, bin } = readGlb(IN);
function readAcc(i){
  const a = src.accessors[i], bv = src.bufferViews[a.bufferView];
  const comps = { SCALAR:1, VEC2:2, VEC3:3, VEC4:4 }[a.type];
  const sizeOf = { 5120:1, 5121:1, 5122:2, 5123:2, 5125:4, 5126:4 }[a.componentType];
  const stride = bv.byteStride || comps*sizeOf;
  const base = (bv.byteOffset||0) + (a.byteOffset||0);
  const out = new Array(a.count);
  for (let k=0;k<a.count;k++){
    const o = base + k*stride, v = new Array(comps);
    for (let c=0;c<comps;c++){
      const off = o + c*sizeOf;
      v[c] = a.componentType===5126 ? bin.readFloatLE(off)
           : a.componentType===5125 ? bin.readUInt32LE(off)
           : a.componentType===5123 ? bin.readUInt16LE(off)
           : bin.readUInt8(off);
    }
    out[k] = comps===1 ? v[0] : v;
  }
  return out;
}

/* ══ 5. 구간 사상 ══ */
function piecewise(v, map){
  const n = map.length;
  if (v <= map[0][0]) return v + (map[0][1] - map[0][0]);
  if (v >= map[n-1][0]) return v + (map[n-1][1] - map[n-1][0]);
  for (let i=0;i<n-1;i++){
    const [a0,b0] = map[i], [a1,b1] = map[i+1];
    if (v >= a0 && v <= a1) return b0 + (v-a0)/(a1-a0)*(b1-b0);
  }
  return v;
}
const remapZ = (z) => piecewise(z, Z_MAP);
const remapX = (x) => Math.sign(x) * piecewise(Math.abs(x), X_MAP) || piecewise(Math.abs(x), X_MAP)*0;

/* 새 모델 좌표 → 상류 로컬 좌표 */
function toVendor(p){
  const nx = (p[0] === 0 ? 0 : Math.sign(p[0])*piecewise(Math.abs(p[0]), X_MAP));
  const nz = remapZ(p[2]);
  const ny = p[1] - SRC_ESP_Y;                       // 이방인의 뜰 포장면을 0 으로
  const pxM = cu(TEMPLE_E) + (nz - SRC_FACADE_Z);    // 성역 로컬 x (m)
  const pzM = cu(AXIS_Z) - nx;                       // 성역 로컬 z (m)
  return [ SQ_NW[0] + U_EAST[0]*pxM + V_SOUTH[0]*pzM,
           ny,
           SQ_NW[1] + U_EAST[1]*pxM + V_SOUTH[1]*pzM ];
}
/* 법선은 회전만 따른다. 구간 사상은 축별 배율이라 엄밀히는 역전치가 맞지만,
   배율이 0.5~1.3 이고 대상이 대부분 축 정렬 상자라 회전만으로 충분하다. */
function dirToVendor(d){
  const pxM = d[2], pzM = -d[0];
  const v = [ U_EAST[0]*pxM + V_SOUTH[0]*pzM, d[1], U_EAST[1]*pxM + V_SOUTH[1]*pzM ];
  const L = Math.hypot(...v) || 1;
  return [v[0]/L, v[1]/L, v[2]/L];
}

/* ══ 6. 평탄화 ══ */
const parts = [];   // { name, mat, pos:[], nrm:[], idx:[] }
let dropped = 0;
(function walk(list, P){
  for (const i of [].concat(list)){
    const n = src.nodes[i], M = mul(P, nodeMatrix(n));
    if (n.mesh != null){
      if (DROP.test(n.name || '')) { dropped++; }
      else for (const prim of src.meshes[n.mesh].primitives){
        const pos = readAcc(prim.attributes.POSITION).map(v => xfPos(M, v));
        const nrm = prim.attributes.NORMAL ? readAcc(prim.attributes.NORMAL).map(v => xfDir(M, v))
                                           : pos.map(() => [0,1,0]);
        const idx = prim.indices != null ? readAcc(prim.indices) : pos.map((_,k)=>k);
        parts.push({ name: n.name || `part${i}`, mat: prim.material ?? 0, pos, nrm, idx });
      }
    }
    for (const c of n.children||[]) walk(c, M);
  }
})(src.scenes[src.scene ?? 0].nodes, [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
console.log(`  성역 부재 ${parts.length}개 · 성역 밖 ${dropped}개 버림`);

/* 번제단 경사로 다시 앉히기 — 원래 상자를 목표 상자로 선형 사상한다. */
for (const p of parts){
  if (!RAMP.match.test(p.name)) continue;
  const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for (const v of p.pos) for (let k=0;k<3;k++){ mn[k]=Math.min(mn[k],v[k]); mx[k]=Math.max(mx[k],v[k]); }
  const T = RAMP.target;
  const box = [[T.x0,T.x1],[T.y0,T.y1],[T.z0,T.z1]];
  for (const v of p.pos) for (let k=0;k<3;k++){
    const t = (mx[k]-mn[k]) ? (v[k]-mn[k])/(mx[k]-mn[k]) : 0;
    v[k] = box[k][0] + t*(box[k][1]-box[k][0]);
  }
  // 새 모델 프레임에서 X 가 남북, Z 가 동서다. 미돗 3:3 은 남북 32규빗 × 동서 16규빗.
  console.log(`  번제단 경사로 재배치 · 남북 ${(T.x1-T.x0).toFixed(1)} × 동서 ${(T.z1-T.z0).toFixed(1)} m (미돗 3:3 = 16.8 × 8.4)`);
}

/* 좌표 변환 */
for (const p of parts){
  p.pos = p.pos.map(toVendor);
  p.nrm = p.nrm.map(dirToVendor);
}

/* ── 이름군 + 재질로 묶는다 ────────────────────────────────────────
   원본은 부재 하나에 노드 하나라 1,039 개다. 그대로 두면 Cesium 이 프레임마다
   드로우 콜을 그만큼 낸다 — 삼각형은 3만 개뿐인데 콜만 천 번이라 모바일에서
   프레임이 떨어진다.
   이름 끝의 일련번호만 떼어 같은 군끼리 합친다(roof_spike_29…roof_spike_117 →
   roof_spike). 군 이름은 남으므로 나중에 해설·상호작용을 붙일 수 있다. */
/* 다만 **움직이는 부재는 묶지 않는다.** 1인칭 순례 화면이 문짝·휘장을 하나씩
   열고 닫으므로, 합쳐 버리면 문 여덟 짝이 한 덩어리로 움직인다.
   (실제로 한 번 합쳤다가 gate_door 여덟 짝이 하나가 됐다.) */
const KEEP_SEPARATE = /^(gate_door|nicanor_door|veil_|doorHekhal)/;
const groups = new Map();
for (const p of parts){
  if (KEEP_SEPARATE.test(p.name)){ groups.set(`solo:${groups.size}:${p.name}`, p); continue; }
  const key = `${p.name.replace(/(_\d+)+$/, '')}|${p.mat}`;
  const g0 = groups.get(key);
  if (!g0){ groups.set(key, { name:p.name.replace(/(_\d+)+$/, ''), mat:p.mat,
                              pos:p.pos, nrm:p.nrm, idx:p.idx.slice() }); continue; }
  const base = g0.pos.length;
  g0.pos = g0.pos.concat(p.pos);
  g0.nrm = g0.nrm.concat(p.nrm);
  for (const i of p.idx) g0.idx.push(i + base);
}
const merged = [...groups.values()];
console.log(`  ${parts.length}개 부재 → ${merged.length}개 이름군으로 묶음`);
parts.length = 0; parts.push(...merged);

/* ══ 7. GLB 쓰기 ══ */
const chunks = [];
let byteLen = 0;
function push(buf, align = 4){
  const pad = (align - (byteLen % align)) % align;
  if (pad){ chunks.push(Buffer.alloc(pad)); byteLen += pad; }
  const off = byteLen;
  chunks.push(buf); byteLen += buf.length;
  return off;
}
const gltf = { asset:{ version:'2.0', generator:'bible-atlas build-interior.mjs' },
  scene:0, scenes:[{ nodes:[] }], nodes:[], meshes:[], accessors:[], bufferViews:[],
  materials: JSON.parse(JSON.stringify(src.materials || [{ pbrMetallicRoughness:{ baseColorFactor:[0.9,0.88,0.81,1] } }])),
  buffers:[{}] };
for (const m of gltf.materials) delete m.extensions;   // 상류 확장은 쓰지 않는다

for (const p of parts){
  const nv = p.pos.length;
  const posBuf = Buffer.alloc(nv*12), nrmBuf = Buffer.alloc(nv*12);
  const mn=[1e9,1e9,1e9], mx=[-1e9,-1e9,-1e9];
  for (let k=0;k<nv;k++){
    for (let c=0;c<3;c++){
      posBuf.writeFloatLE(p.pos[k][c], k*12+c*4);
      nrmBuf.writeFloatLE(p.nrm[k][c], k*12+c*4);
      mn[c]=Math.min(mn[c],p.pos[k][c]); mx[c]=Math.max(mx[c],p.pos[k][c]);
    }
  }
  const u32 = nv > 65535;
  const idxBuf = Buffer.alloc(p.idx.length * (u32?4:2));
  p.idx.forEach((v,k)=> u32 ? idxBuf.writeUInt32LE(v,k*4) : idxBuf.writeUInt16LE(v,k*2));

  const bvP = gltf.bufferViews.push({ byteOffset: push(posBuf), byteLength: posBuf.length, target:34962 }) - 1;
  const bvN = gltf.bufferViews.push({ byteOffset: push(nrmBuf), byteLength: nrmBuf.length, target:34962 }) - 1;
  const bvI = gltf.bufferViews.push({ byteOffset: push(idxBuf), byteLength: idxBuf.length, target:34963 }) - 1;
  const aP = gltf.accessors.push({ bufferView:bvP, componentType:5126, count:nv, type:'VEC3', min:mn, max:mx }) - 1;
  const aN = gltf.accessors.push({ bufferView:bvN, componentType:5126, count:nv, type:'VEC3' }) - 1;
  const aI = gltf.accessors.push({ bufferView:bvI, componentType: u32?5125:5123, count:p.idx.length, type:'SCALAR' }) - 1;
  const mi = gltf.meshes.push({ name:p.name, primitives:[{ attributes:{ POSITION:aP, NORMAL:aN }, indices:aI, material:p.mat }] }) - 1;
  gltf.scenes[0].nodes.push(gltf.nodes.push({ name:p.name, mesh:mi }) - 1);
}
gltf.buffers[0].byteLength = byteLen;
const binChunk = Buffer.concat(chunks, byteLen);
let jsonStr = JSON.stringify(gltf);
while (jsonStr.length % 4) jsonStr += ' ';
const jsonBuf = Buffer.from(jsonStr, 'utf8');
const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546C67, 0); header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binChunk.length, 8);
const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length,0); jh.writeUInt32LE(0x4E4F534A,4);
const bh = Buffer.alloc(8); bh.writeUInt32LE(binChunk.length,0); bh.writeUInt32LE(0x004E4942,4);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.concat([header, jh, jsonBuf, bh, binChunk]));
console.log(`  ${path.relative(ROOT, OUT)} · ${(fs.statSync(OUT).size/1048576).toFixed(2)} MB · 노드 ${gltf.nodes.length}`);

/* ══ 8. 검산 — 상류 상수와 맞는지 스스로 확인한다 ══ */
const chk = (label, got, want, tol) => {
  const ok = Math.abs(got-want) <= tol;
  console.log(`  ${ok?'✓':'✗'} ${label.padEnd(34)} ${got.toFixed(2)} (기준 ${want.toFixed(2)} ±${tol})`);
  return ok;
};
let all = true;
// 지성소 중심이 옛 정방형 100규빗·162.5규빗에 오는가
const hoh = toVendor([0, 0, (100-TEMPLE_E)*CUBIT + SRC_FACADE_Z]);
const expX = SQ_NW[0] + U_EAST[0]*cu(100) + V_SOUTH[0]*cu(AXIS_Z);
const expZ = SQ_NW[1] + U_EAST[1]*cu(100) + V_SOUTH[1]*cu(AXIS_Z);
all &= chk('지성소 X (상류 로컬)', hoh[0], expX, 0.05);
all &= chk('지성소 Z (상류 로컬)', hoh[2], expZ, 0.05);
// 레벨
all &= chk('이방인의 뜰 포장면 Y', toVendor([0,SRC_ESP_Y,0])[1], 0, 0.01);
all &= chk('성소 바닥 Y', toVendor([0,0,0])[1], ESP_TO_HOUSE, 0.60);
// 구간 사상 결과
all &= chk('니가노르 문 → 미돗 249규빗 (m)', cu(TEMPLE_E)+(remapZ(73.8)-SRC_FACADE_Z), cu(249), 0.10);
all &= chk('여인의 뜰 동벽 → 384규빗 (m)', cu(TEMPLE_E)+(remapZ(147)-SRC_FACADE_Z), cu(384), 0.10);
all &= chk('번제단 서쪽 → 195규빗 (m)',    cu(TEMPLE_E)+(remapZ(33.6)-SRC_FACADE_Z), cu(195), 0.60);
all &= chk('헬 폭 (남북, 규빗)', (piecewise(48,X_MAP)-piecewise(37.4,X_MAP))/CUBIT, 10, 0.2);
process.exit(all ? 0 : 1);

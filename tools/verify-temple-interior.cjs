#!/usr/bin/env node
/* interior-v2.glb 검증 — 성역 안쪽이 미돗 치수와 상류 프레임에 맞는가.
 *
 * 왜 있나: 이 파일은 tools/herod-temple/build-interior.mjs 가 외부 모델을
 * 옮겨 심어 만든다. 원본 모델은 건물 자체는 맞았지만 뜰 사이 간격이 부풀어
 * 있었다(아자라가 미돗 187규빗 대신 209규빗). 구간 사상으로 바로잡았는데,
 * 그 사상은 원본 좌표에 걸어 둔 상수라 원본이 바뀌면 조용히 틀어진다.
 * 여기서 결과물을 직접 재서 막는다.
 *
 * 좌표는 상류 로컬 프레임(원점 = 대지 북서 모서리 · +X 동 · +Z 남 · +Y 위).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'assets', 'herod-temple', 'ad30', 'interior-v2.glb');
if (!fs.existsSync(FILE)) {
  console.error('FAIL  interior-v2.glb 이 없다. node tools/herod-temple/build-interior.mjs 를 먼저 돌려라.');
  process.exit(1);
}
const buf = fs.readFileSync(FILE);
if (buf.readUInt32LE(0) !== 0x46546c67 || buf.readUInt32LE(4) !== 2) {
  console.error('FAIL  glTF 2.0 바이너리가 아니다');
  process.exit(1);
}
let off = 12, gltf = null, bin = null;
while (off < buf.length) {
  const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
  if (type === 0x4e4f534a) gltf = JSON.parse(buf.subarray(off + 8, off + 8 + len).toString('utf8').replace(/\0+$/, '').trim());
  if (type === 0x004e4942) bin = buf.subarray(off + 8, off + 8 + len);
  off += 8 + len + ((4 - (len % 4)) % 4);
}

/* 노드별 월드 바운딩은 accessor 의 min/max 로 충분하다 — build-interior 가
   변환을 정점에 구워 넣고 노드 변환을 남기지 않기 때문이다. */
const box = (name) => {
  const n = (gltf.nodes || []).find(x => x.name === name);
  if (n == null || n.mesh == null) return null;
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (const p of gltf.meshes[n.mesh].primitives) {
    const a = gltf.accessors[p.attributes.POSITION];
    if (!a || !a.min) continue;
    for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], a.min[k]); mx[k] = Math.max(mx[k], a.max[k]); }
  }
  return Number.isFinite(mn[0]) ? { mn, mx } : null;
};
/* 성역 로컬(규빗)로 되돌린다. 상류 40-data.js 와 같은 식이다. */
const CUBIT = 0.525;
const PLAT = { NE: [313.9, 26.0], SE: [280.0, 485.0] };
const _ew = [PLAT.SE[0] - PLAT.NE[0], PLAT.SE[1] - PLAT.NE[1]];
const _l = Math.hypot(_ew[0], _ew[1]);
const V_SOUTH = [_ew[0] / _l, _ew[1] / _l];
const U_EAST = [V_SOUTH[1], -V_SOUTH[0]];
const SQ_NE = [PLAT.NE[0] + V_SOUTH[0] * 130.5, PLAT.NE[1] + V_SOUTH[1] * 130.5];
const SQ_NW = [SQ_NE[0] - U_EAST[0] * CUBIT * 500, SQ_NE[1] - U_EAST[1] * CUBIT * 500];
const toU = (x, z) => ((x - SQ_NW[0]) * U_EAST[0] + (z - SQ_NW[1]) * U_EAST[1]) / CUBIT;
const toV = (x, z) => ((x - SQ_NW[0]) * V_SOUTH[0] + (z - SQ_NW[1]) * V_SOUTH[1]) / CUBIT;

/* 성역은 대지 축에 대해 4.22° 돌아 있다. 축 정렬 바운딩 박스(min/max)로
   길이를 재면 회전분만큼 부풀어 성소 100규빗이 112규빗으로 나온다.
   그래서 길이는 정점을 직접 읽어 성역 축(u, v) 위에서 잰다. */
function verts(name){
  const n = (gltf.nodes || []).find(x => x.name === name);
  if (n == null || n.mesh == null || !bin) return null;
  const out = [];
  for (const p of gltf.meshes[n.mesh].primitives) {
    const a = gltf.accessors[p.attributes.POSITION];
    const bv = gltf.bufferViews[a.bufferView];
    const stride = bv.byteStride || 12, base = (bv.byteOffset || 0) + (a.byteOffset || 0);
    for (let k = 0; k < a.count; k++) {
      const o = base + k * stride;
      out.push([bin.readFloatLE(o), bin.readFloatLE(o + 4), bin.readFloatLE(o + 8)]);
    }
  }
  return out;
}
function spanU(...names){
  let lo = Infinity, hi = -Infinity;
  for (const nm of names) for (const v of (verts(nm) || [])) {
    const u = toU(v[0], v[2]); if (u < lo) lo = u; if (u > hi) hi = u;
  }
  return Number.isFinite(lo) ? { lo, hi } : null;
}

const results = [];
const check = (label, got, want, tol, unit) => {
  const ok = got != null && Math.abs(got - want) <= tol;
  results.push([ok, label, got == null ? '없음' : `${got.toFixed(2)}${unit || ''}`, `${want}${unit || ''} ±${tol}`]);
};
const present = (label, name) => results.push([!!box(name), label, box(name) ? '있음' : '없음', '있음']);

/* 1. 있어야 할 부재 — 성소 안쪽과 성역의 핵심 */
present('성소 정면(울람)', 'facade_upper');
present('성소 본체', 'sanctuary_upper_mass');
present('휘장 바깥(트락신)', 'veil_outer');
present('휘장 안쪽(트락신)', 'veil_inner');
present('메노라', 'menorah_branch');
present('진설병 상', 'showbread_loaf');
present('번제단', 'outer_altar_body');
present('번제단 경사로', 'outer_altar_ramp');
present('니가노르 문루', 'nicanor_tower');
present('여인의 뜰 남벽', 'women_wall_s');
present('소레그 격자', 'soreg_lattice_panel');
present('경고 비문', 'soreg_stele');

/* 2. 미돗 치수 */
const house = spanU('sanctuary_upper_mass', 'facade_upper', 'sanctuary_rear_lower');
if (house) {
  check('성소 동서 총장 (미돗 4:7 100규빗)', house.hi - house.lo, 100, 2, '규빗');
  check('울람 바깥 면 (미돗 5:1 기준 173규빗)', house.hi, 173, 1.5, '규빗');
  check('성소 뒷벽 (미돗 5:1 기준 73규빗)', house.lo, 73, 1.5, '규빗');
}
const veil = box('veil_outer');
if (veil) check('휘장 위치 (미돗 4:7 트락신)', toU((veil.mn[0] + veil.mx[0]) / 2, (veil.mn[2] + veil.mx[2]) / 2), 110, 3, '규빗');
const altar = box('outer_altar_body'), altarU = spanU('outer_altar_base');
if (altarU) check('번제단 동서 (미돗 3:1 32규빗)', altarU.hi - altarU.lo, 32, 2, '규빗');
if (altarU) check('번제단 동쪽 면 (미돗 5:1 기준 227규빗)', altarU.hi, 227, 2, '규빗');
/* 미돗 3:1 은 높이 10규빗이지만 그중 6규빗이 기단 위 본체다. 본체만 잰다. */
if (altar) check('번제단 본체 높이 (미돗 3:1)', (altar.mx[1] - altar.mn[1]) / CUBIT, 6.1, 1, '규빗');
const ramp = box('outer_altar_ramp');
if (ramp && altar) {
  /* 미돗 3:3 — 경사로는 남쪽으로 32규빗 뻗고 폭 16규빗. 남북이 더 길어야 한다. */
  const ns = Math.abs(toV(ramp.mx[0], ramp.mx[2]) - toV(ramp.mn[0], ramp.mn[2]));
  const ew = Math.abs(toU(ramp.mx[0], ramp.mx[2]) - toU(ramp.mn[0], ramp.mn[2]));
  results.push([ns > ew, '번제단 경사로 방향 (미돗 3:3 남쪽으로 32규빗)',
                `남북 ${ns.toFixed(0)}규빗 · 동서 ${ew.toFixed(0)}규빗`, '남북이 더 길 것']);
}
const women = box('women_wall_s'), womenN = box('women_wall_n');
if (women && womenN) {
  const a = toV((women.mn[0] + women.mx[0]) / 2, (women.mn[2] + women.mx[2]) / 2);
  const b = toV((womenN.mn[0] + womenN.mx[0]) / 2, (womenN.mn[2] + womenN.mx[2]) / 2);
  check('여인의 뜰 남북 폭 (미돗 2:5 135규빗)', Math.abs(a - b), 137, 4, '규빗');
}

/* 3. 상류 프레임 정합 — 레벨과 앵커 */
const espParts = ['soreg_post', 'podium_step'].map(box).filter(Boolean);
if (espParts.length) {
  const lo = Math.min(...espParts.map(b => b.mn[1]));
  check('가장 낮은 부재 Y (이방인의 뜰 포장면 0)', lo, 0, 0.6, ' m');
}
const roof = box('roof_spike');
if (roof) check('성소 꼭대기 Y (상류 64.05 m)', roof.mx[1], 64.05, 1.2, ' m');

/* 4. 성역 밖 부재가 섞여 들어오지 않았는가 — 이방인의 뜰은 mount-outer 담당 */
const strayNames = (gltf.nodes || []).map(n => n.name || '')
  .filter(n => /^(esplanade|stoa_|mct_|mount_retaining|ant_|antonia_)/.test(n));
results.push([strayNames.length === 0, '성역 밖 부재가 섞이지 않았는가',
              strayNames.length ? strayNames.slice(0, 3).join(', ') : '없음', '없음']);
results.push([(gltf.nodes || []).length <= 400, '노드 수 (드로우 콜)',
              String((gltf.nodes || []).length), '400 이하']);

let bad = 0;
for (const [ok, label, got, want] of results) {
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${got} (기준 ${want})`);
}
console.log(bad ? `\n${bad}개 실패` : `\n${results.length}개 전부 통과`);
process.exit(bad ? 1 : 0);

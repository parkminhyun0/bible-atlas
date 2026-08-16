#!/usr/bin/env node
/* 헤롯 성전 재구성 기하 검증
   data/herod-temple/cmux/TASK_BRIEF.md §2 의 규칙과, 생성된 폴리곤의
   지상 실측 치수·방위·포함 관계를 확인한다.

   실행:  node tools/verify-temple.cjs
   나가는 값: 실패가 하나라도 있으면 종료 코드 1 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'scripts/data/15-temple.js'), 'utf8') + '\n' +
            fs.readFileSync(path.join(ROOT, 'scripts/data/20-buildings.js'), 'utf8') +
            '\n;module.exports={TEMPLE_BLD,TEMPLE_SPEC,TEMPLE_ANCHOR,TEMPLE_INNER_NORTH_DEG,' +
            'TEMPLE_OUTER_NORTH_DEG,templeInner,templeOuter,BLD};';
const mod = { exports: {} };
new Function('module', 'exports', src)(mod, mod.exports);
const T = mod.exports;

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ✓ ${name}${detail ? '  ' + detail : ''}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? '  ' + detail : ''}`); }
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* 지상 거리 (m) */
const R = Math.PI / 180;
function dist(p, q){
  const mLat = 111320, mLng = 111320 * Math.cos((p[1] + q[1]) / 2 * R);
  return Math.hypot((q[0] - p[0]) * mLng, (q[1] - p[1]) * mLat);
}
function bearing(p, q){
  const mLat = 111320, mLng = 111320 * Math.cos((p[1] + q[1]) / 2 * R);
  const e = (q[0] - p[0]) * mLng, n = (q[1] - p[1]) * mLat;
  let az = Math.atan2(e, n) / R; if (az < 0) az += 360;
  return az;
}
const find = (name) => T.TEMPLE_BLD.find(b => b.name === name);
/* 폴리곤(사각형)의 두 변 길이 */
function sides(poly){
  return { a: dist(poly[0], poly[1]), b: dist(poly[1], poly[2]) };
}
/* 점이 폴리곤 안에 있는가 */
function inside(pt, poly){
  let c = false;
  for (let i = 0, j = poly.length - 2; i < poly.length - 1; j = i++){
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > pt[1]) !== (yj > pt[1])) &&
        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi)) c = !c;
  }
  return c;
}

console.log('\n■ 미돗 합산 규칙 (TASK_BRIEF §2)');
ok('미돗 4:6  성소 동서 100규빗', 6+40+(1+2+1+1)+40+(1+2+1+1)+3+1 === 100, '= ' + (6+40+(1+2+1+1)+40+(1+2+1+1)+3+1));
ok('미돗 4:7  정면 폭 100규빗', 5+11+6+40+1+20+6+6+5 === 100, '= ' + (5+11+6+40+1+20+6+6+5));
ok('미돗 4:7  후면 폭 70규빗', 5+3+5+6+6+20+6+6+5+3+5 === 70, '= ' + (5+3+5+6+6+20+6+6+5+3+5));
ok('미돗 5:1  아자라 동서 187규빗', 11+11+32+22+100+11 === 187, '= ' + (11+11+32+22+100+11));
ok('미돗 5:2  아자라 남북 135규빗 이내', 62+8+24+4+4+8 <= 135, '= ' + (62+8+24+4+4+8));
ok('성소 정면 100 = 2×15 + 70', 2*15 + 70 === 100);
ok('리트마이어 500규빗 = 262.5 m', near(500 * T.TEMPLE_SPEC.cubit_m, 262.5, 0.5),
   '= ' + (500 * T.TEMPLE_SPEC.cubit_m).toFixed(2) + ' m');
ok('왕실 규빗 0.525 m', T.TEMPLE_SPEC.cubit_m === 0.525);

console.log('\n■ 생성된 폴리곤의 지상 실측 치수');
const C = T.TEMPLE_SPEC.cubit_m;
const checks = [
  ['여인의 뜰 바닥', 135 * C, 135 * C, 0.6, '미돗 2:5 — 135×135규빗'],
  ['번제단', 32 * C, 32 * C, 0.4, '미돗 3:1 — 32×32규빗'],
  ['번제단 경사로', 16 * C, 30 * C, 0.6, '미돗 3:3 — 32×16규빗(남측)'],
  ['성소 · 울람(현관)', 22 * C, 100 * C, 0.8, '미돗 4:7 — 정면 폭 100규빗'],
  ['성소 · 헤칼/지성소 본체', 78 * C, 70 * C, 0.8, '미돗 4:7 — 후면 폭 70규빗'],
];
checks.forEach(([name, wx, wy, tol, note]) => {
  const b = find(name);
  if (!b) return ok(name, false, '항목 없음');
  const s = sides(b.poly);
  // 링 감김 방향에 따라 첫 변이 달라지므로 순서를 따지지 않고 짝을 맞춘다
  const okDims = (near(s.a, wx, tol) && near(s.b, wy, tol)) ||
                 (near(s.a, wy, tol) && near(s.b, wx, tol));
  ok(`${name}  ${s.a.toFixed(2)} × ${s.b.toFixed(2)} m`, okDims,
     `기대 ${wx.toFixed(2)} × ${wy.toFixed(2)} · ${note}`);
});

console.log('\n■ 아자라 · 성전산 전체 규모');
const az = find('아자라 · 제사장의 뜰 단');
if (az){
  const s = sides(az.poly);
  ok(`아자라 ${s.a.toFixed(1)} × ${s.b.toFixed(1)} m`,
     near(s.a, 135 * C, 1.0) || near(s.b, 135 * C, 1.0),
     `남북 기대 ${(135*C).toFixed(1)} m (미돗 5:2)`);
}
const plat = find('성전산 포장면');
if (plat){
  const p = plat.poly;
  const south = dist(p[0], p[1]), east = dist(p[1], p[2]), north = dist(p[2], p[3]), west = dist(p[3], p[0]);
  ok(`옹벽 남 ${south.toFixed(0)} m`, near(south, 280, 2), '스펙 280 m');
  ok(`옹벽 동 ${east.toFixed(0)} m`, near(east, 470, 6), '스펙 470 m');
  ok(`옹벽 북 ${north.toFixed(0)} m`, near(north, 315, 3), '스펙 315 m');
  ok(`옹벽 서 ${west.toFixed(0)} m`, near(west, 485, 2), '스펙 485 m');
}

console.log('\n■ 위치와 방위');
const ulam = find('성소 · 울람(현관)');
const hoh = T.templeInner(149.1, 0);
ok(`지성소 중심이 바위 돔 위`, dist(hoh, [T.TEMPLE_ANCHOR.lng, T.TEMPLE_ANCHOR.lat]) < 0.5,
   `오차 ${(dist(hoh, [T.TEMPLE_ANCHOR.lng, T.TEMPLE_ANCHOR.lat])).toFixed(2)} m`);
const axisA = T.templeInner(149.1, 0), axisB = T.templeInner(0, 0);   // 지성소 → 여인의 뜰 동단
const axisAz = bearing(axisA, axisB);
ok(`성소 축 방위 ${axisAz.toFixed(2)}° (동향)`, near(axisAz, 86.8, 0.6), '기대 86.8° = 외벽 방위 + 스큐 4.2°');
ok(`외벽 북 방위 ${(360 + T.TEMPLE_OUTER_NORTH_DEG).toFixed(1)}°`,
   near(T.TEMPLE_OUTER_NORTH_DEG, -7.4, 0.01), 'OSM 서벽·동벽 실측');
ok('스큐 4.2° 적용', near(T.TEMPLE_INNER_NORTH_DEG - T.TEMPLE_OUTER_NORTH_DEG, 4.2, 0.01));

console.log('\n■ 성역이 성전산 대지 안에 들어가는가');
if (plat){
  const innerNames = T.TEMPLE_SPEC.boxes.map(b => b.id).concat('소레그 (이방인 출입 금지 담)');
  let outCount = 0, worst = null;
  innerNames.forEach(n => {
    const b = find(n); if (!b) return;
    b.poly.forEach(pt => { if (!inside(pt, plat.poly)) { outCount++; worst = n; } });
  });
  ok('성역 요소가 모두 옹벽 안', outCount === 0,
     outCount ? `밖으로 나간 꼭짓점 ${outCount}개 (예: ${worst})` : `${innerNames.length}개 요소 전부 포함`);
}

console.log('\n■ 폴리곤 감김 방향 (Cesium 돌출 폴리곤은 시계방향 링을 못 그린다)');
{
  let cw = 0, worst = null;
  T.TEMPLE_BLD.forEach(b => {
    const rings = b.rings || [b.poly];
    rings.forEach((r, idx) => {
      let a = 0;
      for (let i = 0; i < r.length - 1; i++) a += r[i][0]*r[i+1][1] - r[i+1][0]*r[i][1];
      // 바깥 링은 반시계(+), 구멍은 시계(-) 여야 한다
      const wantPositive = idx === 0;
      if ((a > 0) !== wantPositive) { cw++; worst = b.name; }
    });
  });
  ok('모든 링의 감김 방향이 올바름', cw === 0, cw ? `잘못된 링 ${cw}개 (예: ${worst})` : `${T.TEMPLE_BLD.length}개 요소 정상`);
}

console.log('\n■ OSM 실측 옹벽선과의 대조');
{
  const mLat = 111320, mLng = 111320 * Math.cos(31.778 * R);
  const A = [T.TEMPLE_ANCHOR.lng, T.TEMPLE_ANCHOR.lat];
  const p = find('성전산 포장면').poly;
  const n = (c) => (c[1] - A[1]) * mLat;
  const southN = (n(p[0]) + n(p[1])) / 2, northN = (n(p[2]) + n(p[3])) / 2;
  ok(`남벽 위치 n=${southN.toFixed(0)} m`, near(southN, -215.2, 25), 'OSM 동벽 남단 -215.2 m');
  ok(`북벽 위치 n=${northN.toFixed(0)} m`, near(northN, 254.0, 25), 'OSM 동벽 북단 +254.0 m');
  ok(`남북 길이 ${(northN - southN).toFixed(0)} m`, near(northN - southN, 469.2, 20), 'OSM 실측 469.2 m · 스펙 470 m');
}

console.log('\n■ 층위(z) 누적');
const L = T.TEMPLE_SPEC.levels_m;
ok('여인의 뜰 +3.15 m', near(L.chel_and_court_of_women, 6 * C, 0.01));
ok('제사장의 뜰 +8.4 m', near(L.court_of_priests, 16 * C, 0.01));
ok('아자라 성전 바닥 +11.55 m', near(L.azarah_temple_floor, 22 * C, 0.01));
ok('번제단 상면 +13.65 m', near(L.altar_top, 26 * C, 0.01));
const sanc = find('성소 · 울람(현관)');
ok(`성소 높이 ${(sanc.h - L.azarah_temple_floor).toFixed(2)} m`,
   near(sanc.h - L.azarah_temple_floor, 100 * C, 0.05), '미돗 4:6 — 100규빗');

console.log(`\n합계  통과 ${pass} · 실패 ${fail}\n`);
process.exit(fail ? 1 : 0);

#!/usr/bin/env node
/* 헤롯 성전산 3D 모델 ↔ 실제 세계좌표 정합 (기획서 §4.3)

   모델(openbibleinfo/3D-Temple-Mount, MIT)의 로컬 프레임은
     원점 = 성전산 대지 북서 모서리, +X = 동, +Z = 남, +Y = 위 (m)
   이것을 현존 고고학 지점(A급 앵커)에 최소제곱으로 맞춘다.

   scale 은 1.000 으로 잠근다. 모델 치수가 안 맞는다고 축척을 늘리지 않는다
   (기획서 §4.3). 회전과 평행이동만 푼다 — 2D Procrustes.

   실행:  node tools/herod-temple/solve-alignment.cjs
   출력:  data/herod-temple/validation/anchor-residuals.json
          data/herod-temple/spec/world_alignment.json
*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const R = Math.PI / 180;

/* ── 앵커 ────────────────────────────────────────────────────────────
   world  : OpenStreetMap 에 등록된 현존 고고학 지점 (지도 정렬 보조용 좌표.
            기획서 §3.3 — OSM 은 학술 근거가 아니라 정렬 보조다)
   model  : 위 모델의 로컬 좌표. 문(gate)은 GATES 상수의 '어느 벽, 모서리에서
            몇 m' 정의로 계산했다. 대지 모서리는 PLAT 상수 그대로.
   grade  : A = 현존 유구, B = 발굴로 위치가 좁혀진 것
   sigma_m: 이 지점의 대응 불확실성(추정) — 잔차 해석에 쓴다              */
const ANCHORS = [
  { id:'sw_corner',   name:'남서 모서리 (나팔 부는 곳 비문 출토)',
    world:[31.77573, 35.23468], model:[0, 485],   grade:'A', sigma_m:6,
    use_in_fit:true,
    note:'모델의 로빈슨 아치 간격(12 m)과 OSM 실측(13.1 m)이 1 m 안에서 맞아, 이 점은 모서리에 가깝다' },
  { id:'robinson',    name:"로빈슨 아치",
    world:[31.77582, 35.23459], model:[0, 473],   grade:'A', sigma_m:5,
    use_in_fit:true,
    note:'서벽, 남서 모서리에서 북으로 12 m (GATES.robinson)' },
  { id:'wilson',      name:'윌슨 아치 (사슬문 아래)',
    world:[31.77727, 35.23430], model:[0, 335],   grade:'A', sigma_m:8,
    use_in_fit:false,
    note:'OSM 점은 지상의 사슬문이고 윌슨 아치는 그 아래다. 대응이 느슨해 검사용으로만 쓴다' },
  { id:'hulda_double',name:'훌다 이중문',
    world:[31.77584, 35.23588], model:[84, 485],  grade:'A', sigma_m:5,
    use_in_fit:false,
    note:'OSM 이중문↔삼중문 간격이 67 m 인데 모델·발굴 도면은 86 m 다. OSM 점 정밀도가 낮아 검사용' },
  { id:'hulda_triple',name:'훌다 삼중문',
    world:[31.77595, 35.23658], model:[170, 485], grade:'A', sigma_m:5,
    use_in_fit:false,
    note:'위와 같은 이유로 검사용' },
  { id:'east_seam',   name:'동벽 이음매 (straight joint)',
    world:[31.77635, 35.23758], model:[282.4, 453.1], grade:'A', sigma_m:6,
    use_in_fit:true,
    note:'남동 모서리에서 북으로 약 32 m. 헤롯 확장부와 그 이전 벽의 경계' },
];

/* ── 로컬 미터 좌표계 (ENU) ───────────────────────────────────────── */
const LAT0 = 31.7780, LNG0 = 35.2353;          // 계산 기준점(성전산 부근)
const M_LAT = 111320, M_LNG = 111320 * Math.cos(LAT0 * R);
const toEN = ([lat, lng]) => [(lng - LNG0) * M_LNG, (lat - LAT0) * M_LAT];

/* 모델 (X 동, Z 남) → 회전 전 평면 (u 동, v 북) */
const toUV = ([x, z]) => [x, -z];

/* ── 2D Procrustes (scale 고정 1.0) ──────────────────────────────────
   sum |R·(p_i - p̄) + t - q_i|² 를 최소화하는 회전각을 닫힌 형태로 구한다. */
function solve(pairs){
  const n = pairs.length;
  const P = pairs.map(p => toUV(p.model));
  const Q = pairs.map(p => toEN(p.world));
  const mean = (a) => [a.reduce((s, v) => s + v[0], 0) / n, a.reduce((s, v) => s + v[1], 0) / n];
  const pm = mean(P), qm = mean(Q);
  let sumSin = 0, sumCos = 0;
  for (let i = 0; i < n; i++){
    const px = P[i][0] - pm[0], py = P[i][1] - pm[1];
    const qx = Q[i][0] - qm[0], qy = Q[i][1] - qm[1];
    sumSin += px * qy - py * qx;      // 외적
    sumCos += px * qx + py * qy;      // 내적
  }
  const phi = Math.atan2(sumSin, sumCos);
  const c = Math.cos(phi), s = Math.sin(phi);
  const t = [qm[0] - (c * pm[0] - s * pm[1]), qm[1] - (s * pm[0] + c * pm[1])];
  return { phi, t };
}

/* 측량 관행대로 나눈다 — control point 로만 정합을 풀고, check point 는
   풀린 해에 대한 독립 검증으로만 쓴다(기획서 §4.3). */
const CONTROL = ANCHORS.filter(a => a.use_in_fit);
const CHECK   = ANCHORS.filter(a => !a.use_in_fit);
const fit = solve(CONTROL);
const c = Math.cos(fit.phi), s = Math.sin(fit.phi);
const apply = (model) => {
  const [u, v] = toUV(model);
  return [fit.t[0] + c * u - s * v, fit.t[1] + s * u + c * v];   // [E, N] m
};
const toLngLat = ([e, n]) => [LNG0 + e / M_LNG, LAT0 + n / M_LAT];

/* ── 잔차 ────────────────────────────────────────────────────────── */
const residuals = ANCHORS.map(a => {
  const got = apply(a.model), want = toEN(a.world);
  const dE = got[0] - want[0], dN = got[1] - want[1];
  return { id:a.id, name:a.name, grade:a.grade, sigma_m:a.sigma_m, role:a.use_in_fit?'control':'check',
           dE_m:+dE.toFixed(2), dN_m:+dN.toFixed(2),
           residual_m:+Math.hypot(dE, dN).toFixed(2), note:a.note };
});
const ctlRes = residuals.filter(r => r.role === 'control');
const rms = Math.sqrt(ctlRes.reduce((s, r) => s + r.residual_m ** 2, 0) / ctlRes.length);
const worst = ctlRes.reduce((a, b) => a.residual_m > b.residual_m ? a : b);

/* 모델 +Z(남쪽 방향)의 실제 방위 — Cesium heading 계산에 쓴다 */
const zAz = (() => {
  const a = apply([0, 0]), b = apply([0, 100]);          // 서벽을 따라 남쪽으로
  let az = Math.atan2(b[0] - a[0], b[1] - a[1]) / R;
  return (az + 360) % 360;
})();
/* 모델 원점(대지 북서 모서리)의 실제 좌표 */
const originLngLat = toLngLat(apply([0, 0]));

console.log('\n■ 앵커 정합 결과 (scale 1.000 고정)');
console.log('  control 앵커 ', CONTROL.length, '· check 앵커', CHECK.length);
console.log('  RMS 수평잔차 ', rms.toFixed(2), 'm');
console.log('  최대 잔차    ', worst.residual_m, 'm  ←', worst.name);
console.log('  모델 +Z 방위 ', zAz.toFixed(3) + '°  (남쪽을 향하는 축)');
console.log('  모델 원점    ', originLngLat[1].toFixed(6) + ' N, ' + originLngLat[0].toFixed(6) + ' E  (대지 북서 모서리)');

console.log('\n■ 앵커별 잔차  (control = 정합에 사용 · check = 독립 검증)');
residuals.sort((a, b) => b.residual_m - a.residual_m).forEach(r => {
  const flag = r.residual_m <= r.sigma_m ? '  ' : '! ';
  const tag = r.role === 'control' ? '정합' : '검사';
  console.log(`  ${flag}[${tag}] ${r.name.padEnd(30)} ${String(r.residual_m).padStart(6)} m   (허용 ±${r.sigma_m} m)`);
});

/* ── QA Gate (기획서 §4.3) ─────────────────────────────────────────
   목표: RMS ≤ 1.0 m, 단일 최대 ≤ 2.0 m.
   다만 이 목표는 '측량 등급 좌표'를 전제한다. 지금 앵커는 OSM 기여자가 찍은
   점이라 그 자체 정밀도가 수 m 다. 그래서 목표 Gate 와 함께
   '앵커 자체 불확실성 대비' 판정을 나란히 낸다. */
const GATE = { rms_m: 1.0, max_m: 2.0 };
const withinSigma = ctlRes.every(r => r.residual_m <= r.sigma_m);
console.log('\n■ QA Gate');
console.log(`  기획서 목표 (RMS ≤ ${GATE.rms_m} m, 최대 ≤ ${GATE.max_m} m):`,
  (rms <= GATE.rms_m && worst.residual_m <= GATE.max_m) ? 'PASS' : 'FAIL — 측량 등급 좌표 필요');
console.log('  앵커 불확실성 대비 (각 잔차 ≤ 해당 σ):', withinSigma ? 'PASS' : 'FAIL');
console.log('  ※ 현재 앵커는 OSM 점이라 자체 정밀도가 수 m 다. 측량 좌표를 확보하기');
console.log('     전까지 이 정합은 alignment-provisional 상태로 둔다 (기획서 §4.3).');

/* ── 산출물 ──────────────────────────────────────────────────────── */
const status = (rms <= GATE.rms_m && worst.residual_m <= GATE.max_m) ? 'alignment-approved'
             : withinSigma ? 'alignment-provisional' : 'alignment-review';

const out = {
  generated_by: 'tools/herod-temple/solve-alignment.cjs',
  model_source: { repo:'openbibleinfo/3D-Temple-Mount', license:'MIT',
                  frame:'origin = platform NW corner, +X east, +Z south, +Y up, metres' },
  method: '2D Procrustes, scale locked to 1.000',
  scale: 1.0,
  anchors: ANCHORS.map(a => ({ id:a.id, name:a.name, grade:a.grade, role:a.use_in_fit?'control':'check', world:a.world,
                               model:a.model, sigma_m:a.sigma_m, source:'OpenStreetMap', note:a.note })),
  solution: {
    origin_lat: +originLngLat[1].toFixed(8),
    origin_lng: +originLngLat[0].toFixed(8),
    model_south_axis_azimuth_deg: +zAz.toFixed(4),
    heading_deg_for_cesium: +(((zAz + 180) % 360)).toFixed(4),
    vertical_datum: null,
    platform_reference_height_m: null,
    z_offset_m: null,
    vertical_sources: [],
    vertical_uncertainty_m: null,
  },
  residuals,
  rms_horizontal_m: +rms.toFixed(3),
  max_residual_m: worst.residual_m,
  gate: GATE,
  status,
};

const vdir = path.join(ROOT, 'data/herod-temple/validation');
const sdir = path.join(ROOT, 'data/herod-temple/spec');
fs.mkdirSync(vdir, { recursive: true });
fs.mkdirSync(sdir, { recursive: true });
fs.writeFileSync(path.join(vdir, 'anchor-residuals.json'), JSON.stringify({ residuals, rms_horizontal_m:+rms.toFixed(3), max_residual_m:worst.residual_m, status }, null, 2));
fs.writeFileSync(path.join(sdir, 'world_alignment.json'), JSON.stringify(out, null, 2));
console.log('\n  기록: data/herod-temple/spec/world_alignment.json');
console.log('        data/herod-temple/validation/anchor-residuals.json');
console.log('  상태:', status, '\n');

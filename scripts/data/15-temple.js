/* ══════════════ 헤롯 성전 · 성전산 재구성 (AD 30 무렵) ══════════════
   SOURCE 미쉬나 『미돗(Middot)』 · 요세푸스 『유대 전쟁사』/『유대 고대사』 ·
          리트마이어(L. Ritmeyer) 재구성 · 워렌(1867-70)·B.마자르(1968-78) 발굴
   치수 원본 data/herod-temple/spec/temple_spec.json v0.1.0

   성전 건물 자체는 발굴된 적이 없다. 하람 알샤리프 아래는 조사가 불가능했다.
   그래서 성역 안쪽(뜰·번제단·성소)은 문헌 재구성이고, 바깥 옹벽·문·계단·주랑은
   발굴 근거가 있다. 요소마다 confidence 로 그 차이를 밝힌다.
     A 고고학 앵커 · B 문헌+고고학 근사 · C 전승/위치 논쟁

   ── 좌표 기준 ──────────────────────────────────────────────────────
   스펙의 로컬 좌표계는 x=+서, y=+북, z=+위(m), 원점은 여인의 뜰 동쪽 벽
   안쪽 면(성소 축선 위). 이것을 실제 지도에 올리기 위해 두 가지를 고정한다.

     ① 앵커  지성소(debir) 중심을 바위 돔 중심에 둔다.
              바위 돔 중심 31.778015 N, 35.235295 E — OpenStreetMap 실측
              (way 4709536)의 외곽 중심값. 리트마이어의 지성소=사크라 바위 견해.
     ② 방위  성전산 옹벽의 실제 방위를 OSM 서벽(way 817206833, 주축 172.59°)과
              동벽(way 391433907, 174.23°)에서 최소제곱으로 실측했다. 옹벽의
              북 방위는 약 352.6°(진북에서 서로 7.4°). 성역 축은 리트마이어의
              옛 500규빗 정방형에 평행하고, 그 정방형은 헤롯 외벽에 대해 4.2°
              스큐를 가진다. 진동에 가까워지는 쪽으로 보정해 성역 북 방위를
              356.8°로 둔다(= 성소 축 방위 86.8°, 거의 정동).

   같은 실측에서 서벽은 바위 돔 서쪽 105.2 m 다. 동벽(way 391433907)의 남북
   양 끝은 바위 돔 기준 남 215.2 m ~ 북 254.0 m 로, 길이 469.2 m 는 스펙의 동벽
   470 m 와 0.8 m 안에서 맞는다. 이 두 값으로 대지의 남북 위치를 고정한다.
   (동서 위치는 서벽선을 기준으로 잡는다 — 통곡의 벽은 현존 유구라 가장 확실하다.)
   (두 벽 사이 286 m — 스펙의 남 280 m·북 315 m 사다리꼴과 맞는다).
   이 값으로 대지를 놓으면 성역(첼 179.6×81.4 m)이 옹벽 안에 정확히 들어간다.
   ================================================================= */
'use strict';

/* ── 스펙 값 (temple_spec.json 에서 옮긴 것 — 값을 손으로 고치지 말 것) ── */
const TEMPLE_SPEC = {
  cubit_m: 0.525,                       // 리트마이어 왕실 규빗. 500규빗=262.5 m
  levels_m: {                           // 이방인의 뜰 포장면(0) 기준 각 뜰의 바닥
    court_of_gentiles: 0, chel_and_court_of_women: 3.15, court_of_israel: 7.088,
    court_of_priests: 8.4, azarah_temple_floor: 11.55, altar_top: 13.65,
  },
  /* LOD2 매싱 박스 — center[x,y,z] / size[x,y,z] (m, 로컬 프레임)
     spec/primitives_boxes.json 을 그대로 옮겼다. */
  boxes: [
    { id:'첼 단(테라스)',        center:[84.525,0,1.575],    size:[179.55,81.375,3.15], mat:'limestone_meleke', src:'미돗 2:3', conf:'C' },
    { id:'여인의 뜰 바닥',       center:[35.438,0,1.575],    size:[70.875,70.875,3.15], mat:'limestone_meleke', src:'미돗 2:5', conf:'A' },
    { id:'이스라엘의 뜰 단',     center:[73.763,0,3.544],    size:[5.775,70.875,7.088], mat:'limestone_meleke', src:'미돗 2:6', conf:'A' },
    { id:'아자라 · 제사장의 뜰 단', center:[119.963,0,4.2],  size:[98.175,70.875,8.4],  mat:'limestone_meleke', src:'미돗 5:1', conf:'A' },
    { id:'나실인의 방 (남동)',   center:[10.5,-24.938,8.4],  size:[21,21,10.5],         mat:'limestone_meleke', src:'미돗 2:5(높이는 해석)', conf:'C' },
    { id:'나무의 방 (북동)',     center:[10.5,24.938,8.4],   size:[21,21,10.5],         mat:'limestone_meleke', src:'미돗 2:5(높이는 해석)', conf:'C' },
    { id:'나병환자의 방 (북서)', center:[60.375,24.938,8.4], size:[21,21,10.5],         mat:'limestone_meleke', src:'미돗 2:5(높이는 해석)', conf:'C' },
    { id:'기름의 방 (남서)',     center:[60.375,-24.938,8.4],size:[21,21,10.5],         mat:'limestone_meleke', src:'미돗 2:5(높이는 해석)', conf:'C' },
    { id:'번제단',               center:[90.825,-4.725,11.025], size:[16.8,16.8,5.25],  mat:'limestone_worn',   src:'미돗 3:1 — 32×32규빗, 높이 10규빗', conf:'A' },
    { id:'번제단 경사로',        center:[90.825,-21,10.763], size:[8.4,15.75,4.725],    mat:'limestone_worn',   src:'미돗 3:3 — 남쪽 32×16규빗', conf:'A' },
    { id:'물두멍(키요르)',       center:[101.325,-5.25,9.188], size:[2.1,2.1,1.575],    mat:'corinthian_bronze',src:'미돗 3:6(크기는 해석)', conf:'C' },
    { id:'성소 · 울람(현관)',    center:[116.55,0,36.225],   size:[11.55,52.5,55.65],   mat:'limestone_meleke', src:'미돗 4:6-7 — 정면 100×100규빗', conf:'A' },
    { id:'성소 · 헤칼/지성소 본체', center:[142.8,0,36.225], size:[40.95,36.75,55.65],  mat:'limestone_meleke', src:'미돗 4:7 — 후면 폭 70규빗(요세푸스는 60)', conf:'B' },
    { id:'성소 정면 금장',       center:[112.088,0,37.8],    size:[2.625,52.5,52.5],    mat:'gold_plate',       src:'전쟁사 5.208-224 — 금판 정면', conf:'C' },
    { id:'니가노르 문루',        center:[72.45,0,18.244],    size:[3.15,10.5,30.188],   mat:'corinthian_bronze',src:'미돗 2:3 · 전쟁사 5.201 — 고린도 청동문', conf:'B' },
  ],
  outer: {
    walls_m: { west:485, east:470, north:315, south:280 },
    colonnade_width_m: 30 * 0.525,      // 이중 주랑 안길이 30규빗
    colonnade_height_m: 25 * 0.525,     // 흰 대리석 단일석 기둥 25규빗 (전쟁사 5.190-192)
    royal_stoa: { nave_h_m: 30.5, aisle_h_m: 15.2, rows:4, columns:162, src:'고대사 15.411-416' },
    antonia_towers_cubits: [50, 50, 50, 70],
    southern_stair: { steps:30, width_m:65.5 },
    robinsons_arch_span_m: 15.2,
  },
  materials: {                          // spec.materials 의 hex 를 그대로 쓴다
    limestone_meleke:'#e9e2cf', limestone_worn:'#d8cdb4', marble_white:'#f2f0ea',
    gold_plate:'#d4af37', corinthian_bronze:'#8c6b3e', cedar:'#8b5a2b',
  },
};

/* ── 지도 위 배치 상수 (위 주석 ①② 참조) ────────────────────────────
   민감한 값이다. 성전 위치 가설·규빗·제단 위치를 바꾸려면 근거를 함께 남길 것. */
const TEMPLE_ANCHOR = { lng: 35.235295, lat: 31.778015 };  // 바위 돔 중심 = 지성소 중심
const TEMPLE_HOH_LOCAL = { x: 149.1, y: 0 };               // 지성소 중심의 로컬 좌표
const TEMPLE_OUTER_NORTH_DEG = -7.4;                       // 옹벽 북 방위 (진북 대비, OSM 실측)
const TEMPLE_SKEW_DEG = 4.2;                               // 옛 정방형이 헤롯 외벽에 갖는 스큐
const TEMPLE_INNER_NORTH_DEG = TEMPLE_OUTER_NORTH_DEG + TEMPLE_SKEW_DEG;  // 성역 북 방위 = -3.2°
const TEMPLE_WEST_WALL_OFFSET_M = 105.2;                   // 바위 돔 → 서벽 (OSM 실측)
const TEMPLE_EAST_WALL_OFFSET_M = 181.1;                   // 바위 돔 → 동벽 (OSM 실측)
const TEMPLE_SOUTH_WALL_OFFSET_M = 215.2;                  // 바위 돔 → 남벽 (OSM 동벽 남단 실측)

/* ── 로컬(m) → 경위도 ─────────────────────────────────────────────
   dx = +서, dy = +북 (앵커 기준). northDeg 는 그 프레임의 북 방위(진북 대비). */
function templeToLngLat(dx, dy, northDeg){
  const R = Math.PI / 180;
  const t = (northDeg || 0) * R;
  const east  = -dx * Math.cos(t) + dy * Math.sin(t);
  const north =  dx * Math.sin(t) + dy * Math.cos(t);
  const mLat = 111320, mLng = 111320 * Math.cos(TEMPLE_ANCHOR.lat * R);
  return [TEMPLE_ANCHOR.lng + east / mLng, TEMPLE_ANCHOR.lat + north / mLat];
}

/* 성역 로컬 좌표(원점=여인의 뜰 동벽) → 경위도. 지성소를 앵커에 맞춘다. */
function templeInner(x, y){
  return templeToLngLat(x - TEMPLE_HOH_LOCAL.x, y - TEMPLE_HOH_LOCAL.y, TEMPLE_INNER_NORTH_DEG);
}
/* 성전산 로컬 좌표(원점=바위 돔, x=+서 y=+북) → 경위도 */
function templeOuter(x, y){ return templeToLngLat(x, y, TEMPLE_OUTER_NORTH_DEG); }

/* 경위도 링의 감김 방향을 반시계로 맞춘다.
   이 파일의 로컬 x 축은 '서쪽'이라, 경위도(동·북)로 옮기면 좌우가 뒤집혀
   시계방향 링이 나온다. Cesium 의 돌출 폴리곤은 시계방향 외곽선을 받으면
   면을 만들지 못하고 통째로 사라진다(실측 확인). 그래서 부호를 보고 뒤집는다. */
function templeCCW(ring){
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++)
    a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a < 0 ? ring.slice().reverse() : ring;
}

/* 축에 정렬된 상자 하나를 폴리곤으로. project 는 두 프레임 중 하나. */
function templeBox(cx, cy, sx, sy, project){
  const hx = sx / 2, hy = sy / 2;
  return templeCCW([[cx - hx, cy - hy], [cx + hx, cy - hy], [cx + hx, cy + hy],
          [cx - hx, cy + hy], [cx - hx, cy - hy]].map(p => project(p[0], p[1])));
}
/* 두 점을 잇는 벽체 폴리곤 (폭 wM). 20-buildings.js 의 wallSeg 와 같은 계산이지만
   이 파일이 먼저 로드되므로 의존하지 않고 따로 둔다. */
function templeWallSeg(a, b, wM){
  const mLat = 111320, mLng = 111320 * Math.cos((a[1] + b[1]) / 2 * Math.PI / 180);
  const dx = (b[0] - a[0]) * mLng, dy = (b[1] - a[1]) * mLat, L = Math.hypot(dx, dy) || 1;
  const oLng = (-dy / L * wM / 2) / mLng, oLat = (dx / L * wM / 2) / mLat;
  return templeCCW([[a[0]+oLng,a[1]+oLat],[b[0]+oLng,b[1]+oLat],
          [b[0]-oLng,b[1]-oLat],[a[0]-oLng,a[1]-oLat],[a[0]+oLng,a[1]+oLat]]);
}

/* 가운데가 뚫린 사각 띠 — 뜰 벽처럼 안이 보여야 하는 것에 쓴다 */
function templeRing(cx, cy, sx, sy, thick, project){
  // 바깥은 반시계, 구멍은 그 반대여야 한다
  return [ templeBox(cx, cy, sx, sy, project),
           templeBox(cx, cy, sx - 2 * thick, sy - 2 * thick, project).slice().reverse() ];
}

/* ── 건축물 목록 생성 ──────────────────────────────────────────── */
const TEMPLE_BLD = (function buildTemple(){
  const S = TEMPLE_SPEC, M = S.materials, out = [];
  const push = (o) => { out.push(o); return o; };

  /* ① 성전산 대지 — 실측 옹벽선 안쪽. 남 280 m·북 315 m 사다리꼴(스펙),
        동서 위치는 OSM 실측 벽선에 맞춘다. */
  /* 대지는 사다리꼴이다 — 남 280 m, 북 315 m (스펙). 서벽은 실측 직선을
     그대로 쓰고(통곡의 벽 구간이 가장 확실한 기준선), 동벽을 폭에 맞춰 벌린다.
     이렇게 두면 바위 돔 위도에서의 폭이 288.5 m 로, OSM 실측 286.3 m 와 2 m 안에서 맞는다. */
  const W = TEMPLE_WEST_WALL_OFFSET_M;                       // x=+서, 서벽(실측)
  const yS = -TEMPLE_SOUTH_WALL_OFFSET_M;                    // 남벽
  const yNw = yS + S.outer.walls_m.west;                     // 북서 모서리
  const yNe = yS + S.outer.walls_m.east;                     // 북동 모서리
  const eastAt = (y) => W - (S.outer.walls_m.south +
    (S.outer.walls_m.north - S.outer.walls_m.south) * (y - yS) / (yNw - yS));
  const E = eastAt(0);                                       // 바위 돔 위도의 동벽
  const platform = [
    templeOuter(W, yS), templeOuter(eastAt(yS), yS), templeOuter(eastAt(yNe), yNe),
    templeOuter(W, yNw), templeOuter(W, yS),
  ];
  push({ name:'성전산 포장면', c:'#c9b995', b:0, h:0.65, confidence:'A',
    note:'현대 DEM 상면과 겹쳐 올라가지 않도록 얇은 포장으로 표현. 옹벽선은 OSM 실측',
    source:'워렌·마자르 발굴 · 리트마이어', poly:platform });

  /* ② 옹벽 네 면 — 헤롯기 드래프트 마진 애슐러. 노출 높이는 지형 위 15 m. */
  const wallPts = platform;
  for (let i = 0; i < wallPts.length - 1; i++){
    const a = wallPts[i], b = wallPts[i + 1];
    const side = ['남벽 280 m','동벽 470 m','북벽 315 m','서벽 485 m'][i] || '옹벽';
    push({ name:`헤롯 성전산 옹벽 · ${side}`, c:'#a99878', b:0, h:15, confidence:'A',
      source:'현존 유구(통곡의 벽·로빈슨 아치·워렌 조사)',
      poly:templeWallSeg(a, b, 7.5) });
  }

  /* ③ 이중 주랑 — 북·동·서 삼면. 흰 대리석 단일석 기둥 25규빗. */
  const cw = S.outer.colonnade_width_m, ch = S.outer.colonnade_height_m;
  const inset = cw / 2;
  [['북쪽 주랑', (W + E) / 2, yNe - inset, Math.abs(W - E), cw],
   ['동쪽 주랑', E + inset, (yS + yNe) / 2, cw, yNe - yS],
   ['서쪽 주랑', W - inset, (yS + yNw) / 2, cw, yNw - yS],
  ].forEach(([name, cx, cy, sx, sy]) => {
    push({ name:`솔로몬 행각 · ${name}`, c:M.marble_white, b:0, h:ch, confidence:'B',
      source:'전쟁사 5.190-192 — 이중 주랑, 25규빗 대리석 기둥',
      poly:templeBox(cx, cy, sx, sy, templeOuter) });
  });

  /* ④ 왕의 주랑 — 남벽을 따라. 가운데 신랑이 측랑보다 두 배 높다. */
  const stoaLen = Math.abs(W - E);
  push({ name:'왕의 주랑 · 측랑', c:M.limestone_meleke, b:0, h:S.outer.royal_stoa.aisle_h_m,
    confidence:'B', source:S.outer.royal_stoa.src + ' — 기둥 162개, 4열 3랑',
    poly:templeBox((W + E) / 2, yS + 16, stoaLen, 32, templeOuter) });
  push({ name:'왕의 주랑 · 중앙 신랑', c:M.limestone_meleke, b:0, h:S.outer.royal_stoa.nave_h_m,
    confidence:'B', source:S.outer.royal_stoa.src + ' — 신랑 높이 100피트',
    poly:templeBox((W + E) / 2, yS + 16, stoaLen, 13, templeOuter) });

  /* ⑤ 안토니아 요새 — 북서 모서리. 세 탑 50규빗, 남동 탑 70규빗(전쟁사 5.238-247). */
  const aC = S.cubit_m;
  const ax = W - 40, ay = yNw - 35;
  push({ name:'안토니아 요새 · 본체', c:'#bfae8d', b:0, h:40 * aC, confidence:'B',
    source:'전쟁사 5.238-247', poly:templeBox(ax, ay, 80, 70, templeOuter) });
  S.outer.antonia_towers_cubits.forEach((c, i) => {
    const dx = (i % 2 ? 1 : -1) * 34, dy = (i < 2 ? 1 : -1) * 29;
    push({ name:`안토니아 요새 · ${c === 70 ? '남동 큰 탑' : '탑'}`, c:'#c6b493', b:0, h:c * aC,
      confidence:'B', source:'전쟁사 5.238-247 — 세 탑 50규빗, 한 탑 70규빗',
      poly:templeBox(ax + dx, ay + dy, 14, 14, templeOuter) });
  });

  /* ⑥ 남측 대계단과 로빈슨 아치 — 발굴로 확인된 요소. */
  push({ name:'남측 대계단 (30단)', c:'#cbbb96', b:0, h:1.2, confidence:'A',
    source:'B. 마자르 발굴 — 폭 65.5 m, 깊고 얕은 단이 번갈아',
    poly:templeBox((W + E) / 2 + 20, yS - 16, S.outer.southern_stair.width_m, 30, templeOuter) });
  push({ name:'로빈슨 아치', c:'#b3a184', b:8, h:16, confidence:'A',
    source:'현존 아치 기공석 — 경간 15.2 m, 왕의 주랑으로 오르는 계단',
    poly:templeBox(W + 6, yS + 34, 14, S.outer.robinsons_arch_span_m, templeOuter) });

  /* ⑦ 소레그 — 이방인은 넘지 못하는 낮은 격자 담(10 손바닥 ≈ 0.88 m).
        경고 비문이 실물로 남아 있다(1871년 클레르몽가노 발견). */
  const soreg = templeRing(84.525, 0, 182.7, 84.53, 0.4, templeInner);
  push({ name:'소레그 (이방인 출입 금지 담)', c:'#d5c8a6', b:0, h:0.88, confidence:'B',
    source:'미돗 2:3 · 전쟁사 5.193-194 · 현존 경고 비문', rings:soreg, poly:soreg[0] });

  /* ⑧ 성역 내부 — spec/primitives_boxes.json 의 LOD2 박스를 그대로 세운다. */
  S.boxes.forEach(b => {
    const [cx, cy, cz] = b.center, [sx, sy, sz] = b.size;
    const r3 = (v) => Math.round(v * 1000) / 1000;
    push({ name:b.id, c:M[b.mat] || '#e9e2cf', b:r3(cz - sz / 2), h:r3(cz + sz / 2),
      confidence:(b.conf || 'B')[0], source:b.src,
      poly:templeBox(cx, cy, sx, sy, templeInner) });
  });

  return out;
})();

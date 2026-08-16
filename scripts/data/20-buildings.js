/* ══════════════ 1세기 건축 재구성 데이터 (엔진 비의존) ══════════════
   폴리곤 생성 헬퍼(rect·wall·circlePoly 등)와 BLD 배열.
   MapLibre 판은 fill-extrusion 으로, Cesium 판은 extrudedHeight 로 그린다.
   b = 지면 기준 시작 높이(m), h = 지면 기준 상단 높이(m). */

function rect(cLng, cLat, wM, hM, rotDeg){ // 중심·폭(EW,m)·깊이(NS,m)·회전
  const mLat = 111320, mLng = 111320 * Math.cos(cLat * Math.PI/180);
  const hw = wM/2/mLng, hh = hM/2/mLat, r = (rotDeg||0) * Math.PI/180;
  return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh],[-hw,-hh]].map(([x,y]) =>
    [cLng + x*Math.cos(r) - y*Math.sin(r)*(mLat/mLng),
     cLat + (x*Math.sin(r)*(mLng/mLat) + y*Math.cos(r))]);
}
function wallSeg(a, b, wM){ // 두 점 사이 성벽 폴리곤
  const mLat = 111320, mLng = 111320 * Math.cos((a[1]+b[1])/2 * Math.PI/180);
  const dx = (b[0]-a[0]) * mLng, dy = (b[1]-a[1]) * mLat, L = Math.hypot(dx, dy) || 1;
  const oLng = (-dy/L * wM/2) / mLng, oLat = (dx/L * wM/2) / mLat;
  return [[a[0]+oLng,a[1]+oLat],[b[0]+oLng,b[1]+oLat],
          [b[0]-oLng,b[1]-oLat],[a[0]-oLng,a[1]-oLat],[a[0]+oLng,a[1]+oLat]];
}
function wall(pts, wM, h, c, name, base){
  const out = [];
  for (let i=0;i<pts.length-1;i++)
    out.push({ name, c, b:base||0, h, poly:wallSeg(pts[i], pts[i+1], wM) });
  return out;
}
// 뜰 벽체: 바깥 사각형 − 안쪽 구멍 (안이 보이는 뜰)
function rectRing(cLng, cLat, wM, hM, rot, inset){
  return [ rect(cLng, cLat, wM, hM, rot),
           rect(cLng, cLat, wM - 2*inset, hM - 2*inset, rot).slice().reverse() ];
}
function circlePoly(cLng,cLat,rM,n=12){
  const mLat=111320, mLng=111320*Math.cos(cLat*Math.PI/180), out=[];
  for(let i=0;i<=n;i++){ const a=Math.PI*2*i/n; out.push([cLng+Math.cos(a)*rM/mLng,cLat+Math.sin(a)*rM/mLat]); }
  return out;
}
function columnRow(a,b,count,rM,height,color,name,base=0){
  const out=[];
  for(let i=0;i<count;i++){
    const t=count===1?.5:i/(count-1), lng=a[0]+(b[0]-a[0])*t, lat=a[1]+(b[1]-a[1])*t;
    out.push({name,c:color,b:base,h:height,poly:circlePoly(lng,lat,rM,10),confidence:'B'});
  }
  return out;
}
const CUBIT = 0.525;
// ── 제1성벽 (하스모니안): 세 망대 → 성전 / 서쪽 언덕 외곽 → 실로암 → 다윗성 동편
const FIRST_WALL_N = [[35.22770,31.77660],[35.23050,31.77625],[35.23434,31.77585]];
const FIRST_WALL_OUTER = [[35.22735,31.77655],[35.22650,31.77480],[35.22660,31.77300],
  [35.22750,31.77120],[35.22950,31.77020],[35.23200,31.76980],[35.23470,31.77045],
  [35.23560,31.77250],[35.23640,31.77430],[35.23710,31.77598]];
// ── 제2성벽 (경로 논쟁 — 개략선): 겐낫 문 부근 → 북 → 안토니아
const SECOND_WALL = [[35.23050,31.77630],[35.23060,31.77820],[35.23200,31.77900],
  [35.23390,31.77985],[35.23400,31.78035]];

const BLD = [
  /* ─── 성전산: 현대 DEM 표면을 기준면으로 사용. 30m 통짜리 플랫폼 extrusion은 제거 ─── */
  { name:'성전산 포장면', c:'#c9b995', b:0, h:0.65, confidence:'A', note:'현대 DEM의 성전산 상면과 중복 상승하지 않도록 얇은 포장면으로 표현',
    poly:[[35.23434,31.77571],[35.23375,31.77997],[35.23685,31.78013],[35.23710,31.77598],[35.23434,31.77571]] },
  ...wall([[35.23434,31.77571],[35.23375,31.77997],[35.23685,31.78013],[35.23710,31.77598],[35.23434,31.77571]], 7.5, 15, '#a99878', '헤롯 성전산 옹벽', 0),

  /* 사방 주랑 — 남쪽은 왕의 주랑으로 별도 */
  ...(() => {
    const SW=[35.23434,31.77571], NW=[35.23375,31.77997], NE=[35.23685,31.78013], SE=[35.23710,31.77598];
    const PC=[35.23551,31.77795], ins=p=>[p[0]+(PC[0]-p[0])*.075,p[1]+(PC[1]-p[1])*.075];
    return [
      ...wall([ins(SW),ins(NW)], 11, 12, '#dfd3b2', '서편 주랑', .65),
      ...wall([ins(NW),ins(NE)], 11, 12, '#dfd3b2', '북편 주랑', .65),
      ...wall([ins(NE),ins(SE)], 11, 12, '#e7dbbd', '솔로몬 행각 (요 10:23)', .65),
    ];
  })(),
  /* 왕의 주랑: 남쪽 전장을 따라가는 바실리카 */
  { name:'왕의 주랑 · 측랑 지붕', c:'#d9c9a3', b:10.8, h:13.0, confidence:'B',
    note:'요세푸스 묘사와 남벽 고고학을 바탕으로 한 바실리카형 재구성', poly:rect(35.23570,31.77618, 250, 35, 6) },
  { name:'왕의 주랑 · 중앙 신랑', c:'#e2d3b4', b:13.0, h:21.0, confidence:'B', poly:rect(35.23570,31.77618, 250, 14.8, 6) },
  ...columnRow([35.23458,31.77605],[35.23680,31.77628],24,1.25,10.8,'#efe4ca','왕의 주랑 열주 1',.65),
  ...columnRow([35.23459,31.77613],[35.23681,31.77636],24,1.25,10.8,'#efe4ca','왕의 주랑 열주 2',.65),
  ...columnRow([35.23460,31.77621],[35.23682,31.77644],24,1.25,10.8,'#efe4ca','왕의 주랑 열주 3',.65),
  ...columnRow([35.23461,31.77629],[35.23683,31.77652],24,1.25,10.8,'#efe4ca','왕의 주랑 열주 4',.65),

  /* 내부 성역: 높이값은 이제 지표 위 실제 구조물 높이로 직접 표현 */
  { name:'소레그·내부 성역 테라스', c:'#d8cbaa', b:.65, h:1.7, confidence:'B', poly:rect(35.23557,31.77804,165,92,7) },
  { name:'여인의 뜰 외벽', c:'#cfc09c', b:1.7, h:10.5, confidence:'B', rings:rectRing(35.23612,31.77812,135*CUBIT,135*CUBIT,7,7) },
  { name:'니가노르 문', c:'#e8dcb8', b:1.7, h:18, confidence:'B', poly:rect(35.23574,31.77806,11,22,7) },
  { name:'이스라엘·제사장의 뜰 외벽', c:'#d4c6a1', b:1.7, h:11.5, confidence:'B', rings:rectRing(35.23520,31.77800,187*CUBIT,135*CUBIT,7,7) },
  { name:'번제단', c:'#b8a173', b:1.7, h:5.2, confidence:'B', poly:rect(35.23550,31.77802,32*CUBIT,32*CUBIT,7) },
  { name:'번제단 경사로', c:'#ad9769', b:1.7, h:3.7, confidence:'B', poly:rect(35.23552,31.77789,8,15,7) },

  /* 성소 — 100규빗 높이 전승을 외관 최대높이 약 52.5m로 직접 적용 */
  { name:'성소 정면 · 울람', c:'#f5efe1', b:1.7, h:52.5, confidence:'B', note:'미쉬나 미돗의 100규빗 높이를 0.525m/규빗으로 시각화', poly:rect(35.23517,31.77800,11,100*CUBIT,7) },
  { name:'성소 본당 · 헤칼/지성소', c:'#eee5d2', b:1.7, h:45, confidence:'B', poly:rect(35.23494,31.77797,36,70*CUBIT,7) },
  { name:'성소 금장 지붕선', c:'#d7aa43', b:45, h:47.2, confidence:'C', note:'금장 외관을 구분하기 위한 시각적 재구성 요소', poly:rect(35.23494,31.77797,34,68*CUBIT,7) },
  { name:'성소 금장 정면띠', c:'#e0b95a', b:47.2, h:50.2, confidence:'C', poly:rect(35.23517,31.77800,10,96*CUBIT,7) },

  /* 안토니아: 위치·규모 세부는 논쟁적이므로 단순화 */
  { name:'안토니아 요새 본체', c:'#b9a67f', b:0, h:28, confidence:'C', note:'북서부 배치는 일반적이나 정확한 평면·높이는 논쟁적', poly:rect(35.23400,31.78042,85,55,7) },
  { name:'안토니아 NW탑', c:'#c3b189', b:0, h:35, confidence:'C', poly:rect(35.23362,31.78063,14,14,7) },
  { name:'안토니아 NE탑', c:'#c3b189', b:0, h:35, confidence:'C', poly:rect(35.23439,31.78068,14,14,7) },
  { name:'안토니아 SW탑', c:'#c3b189', b:0, h:35, confidence:'C', poly:rect(35.23358,31.78023,14,14,7) },
  { name:'안토니아 SE탑', c:'#cbb992', b:0, h:42, confidence:'C', poly:rect(35.23435,31.78019,14,14,7) },

  /* 서쪽 언덕: 헤롯 궁전 + 세 망대 */
  { name:'헤롯 궁전 기단', c:'#c7b48c', b:0, h:5, confidence:'B', poly:rect(35.22720,31.77450,55,300,4) },
  { name:'궁전 북관', c:'#d5c49e', b:5, h:24, confidence:'B', poly:rect(35.22726,31.77560,50,80,4) },
  { name:'궁전 남관', c:'#d5c49e', b:5, h:24, confidence:'B', poly:rect(35.22714,31.77340,50,80,4) },
  { name:'바사엘 망대 (~44m)', c:'#e3d6b4', b:0, h:44, confidence:'B', poly:rect(35.22770,31.77662,20,20,0) },
  { name:'히피쿠스 망대 (~40m)', c:'#e3d6b4', b:0, h:40, confidence:'B', poly:rect(35.22733,31.77655,18,18,0) },
  { name:'마리암네 망대 (~22m)', c:'#e3d6b4', b:0, h:22, confidence:'B', poly:rect(35.22808,31.77666,16,16,0) },

  ...wall(FIRST_WALL_N,4.5,12,'#a99877','제1성벽'),
  ...wall(FIRST_WALL_OUTER,4.5,12,'#a99877','제1성벽'),
  ...wall(SECOND_WALL,4.0,10,'#a08e6d','제2성벽(개략)'),

  { name:'베데스다 못 (북)', c:'#3e7f86', b:0, h:1.2, confidence:'A', poly:rect(35.23620,31.78175,52,40,7) },
  { name:'베데스다 못 (남)', c:'#3e7f86', b:0, h:1.2, confidence:'A', poly:rect(35.23615,31.78135,55,45,7) },
  { name:'실로암 못', c:'#3e7f86', b:0, h:1.0, confidence:'A', poly:rect(35.23465,31.77040,60,40,20) },

  ...[[35.2308,31.7748],[35.2318,31.7742],[35.2300,31.7756],[35.2325,31.7752],[35.2313,31.7758],[35.2295,31.7742]].map((p,i) =>
    ({name:'상부도시 대표 가옥',c:'#c2b088',b:0,h:7+(i%3),confidence:'C',poly:rect(p[0],p[1],16,13,(i*31)%70)})),
  ...[[35.2352,31.7738],[35.2357,31.7727],[35.2360,31.7717],[35.2354,31.7708],[35.2348,31.7730]].map((p,i) =>
    ({name:'하부도시 대표 가옥',c:'#bda87e',b:0,h:4+(i%2),confidence:'C',poly:rect(p[0],p[1],10,9,(i*27)%60)})),
  ...[[35.2580,31.7710],[35.2590,31.7716],[35.2598,31.7709],[35.2585,31.7720]].map((p,i) =>
    ({name:'베다니 대표 가옥',c:'#c9b68e',b:0,h:4+(i%2),confidence:'C',poly:rect(p[0],p[1],9,8,(i*23)%60)})),
  { name:'여리고 궁전 북관', c:'#d8c39a', b:0, h:10, confidence:'B', poly:rect(35.4335,31.8542,29,19,-15) },
  { name:'여리고 궁전 남관', c:'#cdb894', b:0, h:7, confidence:'B', poly:rect(35.4341,31.8531,40,22,-15) },
];

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
  /* ─── 헤롯 성전 · 성전산 ───────────────────────────────────────────
     scripts/data/15-temple.js 에서 사료 치수(미돗·요세푸스·리트마이어)로 생성한다.
     좌표는 바위 돔 실측점에 지성소를 맞추고, 옹벽 방위는 OSM 실측값을 쓴다.
     치수를 고치려면 그 파일의 TEMPLE_SPEC 을 고칠 것 — 여기서 손대지 말 것. */
  ...(typeof TEMPLE_BLD !== 'undefined' ? TEMPLE_BLD : []),

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

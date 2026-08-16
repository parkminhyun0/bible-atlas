/* ══════════════ 기본 상수 ══════════════ */
const JERUSALEM = [35.2345, 31.7767];
const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const SAMPLE_N = 240;        // 단면 샘플 수
const SAMPLE_Z = 14;         // 고도 샘플링용 타일 줌

const POINTS = {
  temple: { n:'예루살렘 · 성전산', name:'예루살렘 · 성전산', lng:35.2354, lat:31.7780, grade:'A',
    refElev:743.7, refText:'돔 바위 기반암 743.7 m (고고학 조사값)', note:'성전산 표면은 지점별로 다르며, 743.7m는 돔 바위 기반암 기준점입니다.' },
  olivet: { n:'감람산', name:'감람산 정상부', lng:35.2458, lat:31.7784, grade:'A', note:'정상부 좌표. 실제 능선은 넓은 영역입니다.' },
  bethphage: { n:'벳바게', name:'벳바게 (막 11:1)', lng:35.2508, lat:31.7787, grade:'C', note:'전승·지명 비정에 따른 근사점입니다.' },
  bethany: { n:'베다니', name:'베다니 · 엘아자리야 (요 11장)', lng:35.2586, lat:31.7714, grade:'B', note:'고대 베다니 마을 범위의 대표점입니다.' },
  samaritan: { n:'아둠밈', name:'아둠밈 오르막 · 선한 사마리아인 전승지', lng:35.3283, lat:31.8167, grade:'C', note:'눅 10장의 정확한 여관 위치가 아니라 예루살렘–여리고 고대 도로 회랑의 전승지입니다.' },
  jerichoHerod: { n:'신약 여리고', name:'신약 여리고 · 헤롯 겨울궁전', lng:35.4337, lat:31.8537, grade:'A', note:'툴룰 아부 엘-알라이크의 헤롯 궁전군을 대표합니다.' },
  jerichoTell: { n:'텔 에스-술탄', name:'구약 여리고 · 텔 에스-술탄', lng:35.4442, lat:31.8703, grade:'A', note:'신약기 도시 중심과 구별해 표시합니다.' },
  baptism: { n:'요단 세례지', name:'요단 건너편 베다니 · 알마그타스 권역 (요 1:28)', lng:35.5500, lat:31.8370, grade:'B', note:'UNESCO 알마그타스 고고학 권역과 요단강 세례 전승을 대표하는 회랑점입니다. 정확한 신약 지점은 논의가 남아 있습니다.' },
  bethlehem: { n:'베들레헴', name:'베들레헴', lng:35.2024, lat:31.7054, grade:'A' },
  nazareth: { n:'나사렛', name:'나사렛', lng:35.2978, lat:32.7021, grade:'A' },
  cana: { n:'가나', name:'가나 (요 2) · 비정 논쟁', lng:35.3397, lat:32.7469, grade:'C', note:'가나의 정확한 비정은 논쟁적이므로 대표 후보 지점으로만 표시합니다.' },
  capernaum: { n:'가버나움', name:'가버나움 · 사역 본거지', lng:35.5753, lat:32.8809, grade:'A' },
  bethsaida: { n:'벳새다', name:'벳새다 · 비정 논쟁', lng:35.6308, lat:32.9097, grade:'C', note:'주요 후보지 사이에 논쟁이 있어 대표점으로만 표시합니다.' },
  caesareaPhilippi: { n:'가이사랴 빌립보', name:'가이사랴 빌립보 (막 8:27)', lng:35.6944, lat:33.2486, grade:'A' },
  tyre: { n:'두로', name:'두로 지방 (막 7:24)', lng:35.2038, lat:33.2705, grade:'B' },
  gerasa: { n:'거라사 권역', name:'거라사인/가다라 지방 (막 5) · 위치 논쟁', lng:35.6858, lat:32.6533, grade:'C' },
  sychar: { n:'수가', name:'수가 · 야곱의 우물 권역 (요 4)', lng:35.2856, lat:32.2094, grade:'B' },
  temptation: { n:'시험산', name:'시험산 전승지 (마 4)', lng:35.4280, lat:31.8740, grade:'C' },
  aenon: { n:'아이논', name:'아이논 (요 3:23) · 위치 논쟁', lng:35.4700, lat:32.3500, grade:'C' },
  machaerus: { n:'마케루스', name:'마케루스 · 요한 투옥·순교 전승/요세푸스', lng:35.62417, lat:31.56722, grade:'A' },
  golgotha: { n:'골고다', name:'골고다 전승지 · 성묘교회', lng:35.22955, lat:31.77847, grade:'B', note:'1세기 성벽 밖 채석장·매장지 맥락과 전승을 함께 반영한 지점입니다.' },
  herodPalace: { n:'헤롯 궁전', name:'헤롯 서부 궁전 · 총독 관저 유력지', lng:35.2272, lat:31.7745, grade:'B', note:'빌라도 재판 장소는 학계 논의가 있어 유력지로 표기합니다.' },
  bethesda: { n:'베데스다', name:'베데스다 못 (요 5)', lng:35.23620, lat:31.78155, grade:'A' },
  siloam: { n:'실로암', name:'실로암 못 (요 9)', lng:35.23465, lat:31.77040, grade:'A' },
};

const MARKS_MAIN = [POINTS.temple, POINTS.olivet, POINTS.bethphage, POINTS.bethany,
  POINTS.samaritan, POINTS.jerichoHerod, POINTS.baptism];

const ROUTES = {
  jj:   { name:'지중해 해안 → 예루살렘 → 요단강 → 베레아 고원 (전체 단면)',
          marks:[{n:'지중해 해안',lng:34.72,lat:31.79,grade:'B'},
                 {n:'쉐펠라',lng:34.98,lat:31.785,grade:'B'},
                 ...MARKS_MAIN,
                 {n:'베레아 고원',lng:35.79,lat:31.925,grade:'B'}],
          pts:[[34.72,31.79],[34.90,31.785],[35.05,31.782],[35.15,31.780],
               [35.2354,31.7780],[35.2447,31.7777],[35.2508,31.7787],[35.2586,31.7714],
               [35.2760,31.7900],[35.3010,31.8060],[35.3283,31.8167],[35.3760,31.8330],
               [35.4080,31.8440],[35.4337,31.8537],[35.4900,31.8480],[35.5500,31.8370],
               [35.6300,31.8600],[35.7100,31.8950],[35.7900,31.9250]] },
  ew:   { name:'지중해 → 암몬 고원',
          marks:[{n:'지중해',lng:34.70,lat:31.79,grade:'B'},POINTS.temple,
                 {n:'요단 계곡',lng:35.47,lat:31.80},{n:'암몬 고원',lng:35.95,lat:31.85}],
          pts:[[34.70,31.79],[35.2354,31.7780],[35.95,31.85]] },
  rift: { name:'갈릴리 호수 → 사해',
          marks:[{n:'갈릴리 호수',lng:35.585,lat:32.83},{n:'벧산',lng:35.556,lat:32.50},
                 {n:'사해',lng:35.47,lat:31.45}],
          pts:[[35.585,32.83],[35.556,32.20],[35.47,31.45]] },
};

/* ══════════════ 지도 초기화 ══════════════ */
const map = new maplibregl.Map({
  container:'map',
  center: JERUSALEM,
  zoom: 11.6, pitch: 62, bearing: -18,
  /* 지면 근접 관찰: 피치는 라이브러리 상한 85°까지 허용한다.
     줌 상한 18.5 는 실측으로 정한 값이다 — 그 이상에서는 카메라가 지형 안으로
     들어가 화면이 검게 변하고(감람산·사해·갈릴리 재현), 위성 영상도 z19 가
     원본 한계라 더 확대해도 선명해지지 않는다. */
  maxPitch: 85, maxZoom: 18.5,
  /* 한글 지명은 글리프 서버 없이 브라우저 글꼴로 그린다
     (MapLibre 는 한글·CJK 를 로컬 폰트로 렌더한다) */
  localIdeographFontFamily: "'Noto Sans KR','Apple SD Gothic Neo','Malgun Gothic',sans-serif",
  style:{
    version:8,
    glyphs:'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources:{
      // maxzoom 19 — 그 이상은 오버줌으로 확대되어 지면까지 접근할 수 있다
      sat:{ type:'raster', tileSize:256,
        tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        attribution:'Imagery © Esri · DEM tiles © Mapzen/AWS Terrarium · Historical reconstruction: BibleAtlas' , maxzoom:19 },
      // Terrarium 은 z15 까지 제공 — 지형 해상도를 한 단계 올린다
      dem:{ type:'raster-dem', tiles:[DEM_URL], encoding:'terrarium', tileSize:256, maxzoom:15 },
      demHill:{ type:'raster-dem', tiles:[DEM_URL], encoding:'terrarium', tileSize:256, maxzoom:15 },
      /* OpenStreetMap — 도로·지명·수계가 그려진 벡터 기반 래스터 타일.
         위성 영상만으로는 읽기 어려운 길·마을 경계를 확인하는 용도로 겹쳐 쓴다.
         (구글 지도 타일은 API 키 없이 직접 가져다 쓰는 것이 이용약관 위반이라 쓰지 않는다) */
      osm:{ type:'raster', tileSize:256,
        tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        attribution:'© OpenStreetMap contributors', maxzoom:19 },
    },
    layers:[
      { id:'ancient-bg', type:'background', paint:{ 'background-color':'#8f7758' } },
      // 위성 원색 그대로 — 색보정을 최소화해 실제 지형색에 가깝게 둔다
      { id:'sat', type:'raster', source:'sat', paint:{ 'raster-opacity':1, 'raster-saturation':0, 'raster-contrast':0, 'raster-brightness-min':0, 'raster-brightness-max':1, 'raster-resampling':'linear' } },
      // OSM 지형·도로 오버레이 — 기본은 꺼짐, 상단 버튼으로 켠다
      { id:'osm', type:'raster', source:'osm', layout:{ visibility:'none' },
        paint:{ 'raster-opacity':0.55, 'raster-saturation':-0.15, 'raster-contrast':0.05 } },
      /* v19 사실감 패스: 힐셰이드를 2겹으로 —
         hill      : 넓은 지형 명암 (사면 방향에 따른 밝고 어두움, 항상)
         hillFine  : 골짜기·능선 강조 (기드론·힌놈·와디 켈트의 절벽감, 확대할수록 강해짐)
         광원 방향(illumination-direction)은 카메라 방위와 연동해 회전 시 명암이 살아 움직임 */
      /* v20: 힐셰이드 3겹 — 강한 사면 명암 + 골짜기 심도 + 능선 하이라이트.
         낮은 태양(오후 4시경)이 긴 그림자를 만드는 느낌으로 강도를 올림 */
      { id:'hill', type:'hillshade', source:'demHill',
        paint:{ 'hillshade-exaggeration':['interpolate',['linear'],['zoom'], 8,0.34, 12,0.30, 16,0.22],
                'hillshade-shadow-color':'#2b2822',
                'hillshade-highlight-color':'#fffdf8',
                'hillshade-accent-color':'#6f675a',
                'hillshade-illumination-direction':315,
                'hillshade-illumination-anchor':'viewport' } },
      { id:'hillFine', type:'hillshade', source:'demHill',
        paint:{ 'hillshade-exaggeration':['interpolate',['linear'],['zoom'], 9,0.05, 12,0.14, 15,0.18],
                'hillshade-shadow-color':'#26231d',
                'hillshade-highlight-color':'rgba(255,255,255,0)',
                'hillshade-accent-color':'#5d564a',
                'hillshade-illumination-direction':315,
                'hillshade-illumination-anchor':'viewport' } },
      { id:'hillRim', type:'hillshade', source:'demHill',
        paint:{ 'hillshade-exaggeration':['interpolate',['linear'],['zoom'], 9,0.0, 12,0.06, 15,0.10],
                'hillshade-shadow-color':'rgba(0,0,0,0)',
                'hillshade-highlight-color':'#fffaf0',
                'hillshade-accent-color':'rgba(0,0,0,0)',
                'hillshade-illumination-direction':315,
                'hillshade-illumination-anchor':'viewport' } },
    ]
  }
});
map.addControl(new maplibregl.NavigationControl({visualizePitch:true}), 'bottom-right');

/* 타일 로드 실패 감지: 치명적이지 않으면 토스트, 초기부터 전부 막히면 안내 */
let tileErrors = 0, anyTileLoaded = false;
map.on('data', e => { if (e.tile){ anyTileLoaded = true; window.__mapReady = true; } });
map.on('error', e => {
  console.warn('map error:', e && e.error);
  tileErrors++;
  if (!anyTileLoaded && tileErrors > 6){
    fatal('지도 타일 서버에 접근할 수 없습니다.<br>이 파일을 <b>다운로드해 브라우저에서 직접</b> 열었는지, 인터넷이 연결되어 있는지 확인해 주세요.',
      (e && e.error && e.error.message) || '타일 요청 차단됨');
  }
});
/* ── 정오 하늘 ──────────────────────────────────────────────
   태양이 높은 정오의 하늘: 천정은 진한 파랑, 지평선으로 갈수록 옅어진다.
   MapLibre 의 sky 는 그라데이션만 그리므로. */


/* ── 지면 근접 카메라 보정 ──────────────────────────────────
   [문제] 줌을 높이면 화면이 검게 변하는 구간이 있었다. 카메라가 과장된 지형
   안으로 파고들어 지형 메시의 뒷면을 보기 때문이다(감람산 z18.5 이상에서 재현).
   [해법] ① 지면에 다가갈수록 시야각을 넓혀 하늘을 확보하고 ② 지형 과장을
   1:1 로 되돌린다. 실측 결과 두 조치 각각만으로도 검은 화면이 사라진다. */
const clamp01 = v => Math.min(1, Math.max(0, v));
let baseExag = 1.6;          // 지형 과장 토글이 정하는 기본값
let lastFov = null, lastExag = null;
function updateCameraFeel(){
  const z = map.getZoom();
  // 시야각: 원경 37°(왜곡 최소) → 지면 근접 60°(하늘까지 열림, MapLibre 상한)
  const fov = 37 + 23 * clamp01((z - 14) / 3);
  try{
    if (map.transform && typeof map.transform.fov === 'number' &&
        (lastFov === null || Math.abs(fov - lastFov) > 0.3)){
      map.transform.fov = fov; lastFov = fov;
      if (map._update) map._update(true);
    }
  }catch(err){ /* 내부 API를 못 쓰는 환경에서는 조용히 건너뛴다 */ }
  // 지형 과장: z15.5 부터 줄여 z17.5 에서 1:1
  const exag = baseExag + (1 - baseExag) * clamp01((z - 15.5) / 2);
  if (lastExag === null || Math.abs(exag - lastExag) > 0.02){
    lastExag = exag;
    if (map.getTerrain()) map.setTerrain({ source:'dem', exaggeration: exag });
  }
}
map.on('zoom', updateCameraFeel);

function applyNoonSky(){
  try{
    /* v19: 건조지대 대기 — 천정은 깊은 파랑, 지평선은 먼지 섞인 황회백,
       원경 능선이 겹겹이 물러나도록 fog를 지면 쪽으로 조금 더 내림 */
    /* v20: 구름·흰 안개 띠 제거 — 맑고 건조한 하늘, 지평선 선명.
       원경 깊이는 fog가 아니라 힐셰이드 명암으로 낸다 */
    map.setSky({
      'sky-color': '#2a63b8',
      'sky-horizon-blend': 0.55,
      'horizon-color': '#a9bfd6',
      'horizon-fog-blend': 0.25,
      'fog-color': '#c9c2b0',
      'fog-ground-blend': 0.02,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.35, 11, 0.20, 14, 0.10, 20, 0.04],
    });
  }catch(err){ console.warn('sky 미지원:', err && err.message); }
}
map.on('load', () => {
  map.setTerrain({ source:'dem', exaggeration:1.6 });
  applyNoonSky();

  /* v19: 광원 방향을 카메라 방위와 연동 — 태양은 남서(지리 방위 225°)에 고정,
     화면 기준 광원각 = 태양 방위 − 카메라 방위. 회전하면 그림자가 실제처럼 반대로 돈다 */
  const SUN_AZIMUTH = 240;   // 오후 늦은 태양 — 그림자 길게
  let lightRAF = null;
  function updateLight(){
    lightRAF = null;
    if (!map.getLayer('hill')) return;
    const dir = ((SUN_AZIMUTH - map.getBearing()) % 360 + 360) % 360;
    map.setPaintProperty('hill', 'hillshade-illumination-direction', dir);
    if (map.getLayer('hillFine')) map.setPaintProperty('hillFine', 'hillshade-illumination-direction', dir);
    if (map.getLayer('hillRim'))  map.setPaintProperty('hillRim',  'hillshade-illumination-direction', dir);
  }
  map.on('rotate', () => { if (!lightRAF) lightRAF = requestAnimationFrame(updateLight); });
  updateLight();

  updateCameraFeel();
  map.addSource('secLine', { type:'geojson', data:emptyFC() });
  map.addLayer({ id:'secLine-casing', type:'line', source:'secLine',
    paint:{ 'line-color':'#171310','line-width':6,'line-opacity':.75 } });
  map.addLayer({ id:'secLine', type:'line', source:'secLine',
    paint:{ 'line-color':'#d9a353','line-width':2.5 } });
  map.addSource('secPts', { type:'geojson', data:emptyFC() });
  map.addLayer({ id:'secPts', type:'circle', source:'secPts',
    paint:{ 'circle-radius':5,'circle-color':'#d9a353','circle-stroke-color':'#171310','circle-stroke-width':2 } });
  map.addSource('hoverPt', { type:'geojson', data:emptyFC() });
  map.addLayer({ id:'hoverPt', type:'circle', source:'hoverPt',
    paint:{ 'circle-radius':7,'circle-color':'#ede4d3','circle-stroke-color':'#d9a353','circle-stroke-width':3 } });
});
function emptyFC(){ return { type:'FeatureCollection', features:[] }; }

/* ══════════════ 고도 샘플링 (Terrarium 타일 직접 디코드) ══════════════ */
const tileCache = new Map();
function lngLatToTilePx(lng, lat, z){
  const n = 2 ** z;
  const x = (lng + 180) / 360 * n;
  const latR = lat * Math.PI / 180;
  const y = (1 - Math.log(Math.tan(latR) + 1/Math.cos(latR)) / Math.PI) / 2 * n;
  return { tx:Math.floor(x), ty:Math.floor(y),
           px:(x - Math.floor(x)) * 256, py:(y - Math.floor(y)) * 256 };
}
async function getTileData(z, tx, ty){
  const key = `${z}/${tx}/${ty}`;
  if (tileCache.has(key)) return tileCache.get(key);
  const p = (async () => {
    const url = DEM_URL.replace('{z}',z).replace('{x}',tx).replace('{y}',ty);
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('DEM 타일 로드 실패'));
      im.src = url;
    });
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const cx = cv.getContext('2d', { willReadFrequently:true });
    cx.drawImage(img, 0, 0);
    return cx.getImageData(0, 0, 256, 256).data;
  })();
  tileCache.set(key, p);
  return p;
}
function terrariumDecode(data, px, py){
  const i = (py * 256 + px) * 4;
  return (data[i] * 256 + data[i+1] + data[i+2] / 256) - 32768;
}
async function terrainPixel(z, tx, ty, px, py){
  while (px < 0){ tx--; px += 256; }
  while (px > 255){ tx++; px -= 256; }
  while (py < 0){ ty--; py += 256; }
  while (py > 255){ ty++; py -= 256; }
  const data = await getTileData(z, tx, ty);
  return terrariumDecode(data, px, py);
}
async function elevationAt(lng, lat){
  const { tx, ty, px, py } = lngLatToTilePx(lng, lat, SAMPLE_Z);
  const x0 = Math.floor(px), y0 = Math.floor(py), fx = px - x0, fy = py - y0;
  const [e00,e10,e01,e11] = await Promise.all([
    terrainPixel(SAMPLE_Z,tx,ty,x0,y0), terrainPixel(SAMPLE_Z,tx,ty,x0+1,y0),
    terrainPixel(SAMPLE_Z,tx,ty,x0,y0+1), terrainPixel(SAMPLE_Z,tx,ty,x0+1,y0+1)
  ]);
  const top = e00*(1-fx) + e10*fx, bot = e01*(1-fx) + e11*fx;
  return top*(1-fy) + bot*fy;
}

/* ══════════════ 거리·보간 유틸 ══════════════ */
function haversine(a, b){
  const R = 6371000, d = Math.PI/180;
  const dLat = (b[1]-a[1])*d, dLng = (b[0]-a[0])*d;
  const s = Math.sin(dLat/2)**2 +
    Math.cos(a[1]*d)*Math.cos(b[1]*d)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
function samplePath(pts, n){
  const segLen = [], cum = [0];
  for (let i=0;i<pts.length-1;i++){ segLen.push(haversine(pts[i],pts[i+1])); cum.push(cum[i]+segLen[i]); }
  const total = cum[cum.length-1];
  const out = [];
  for (let k=0;k<n;k++){
    const target = total * k / (n-1);
    let s = 0;
    while (s < segLen.length-1 && cum[s+1] < target) s++;
    const t = segLen[s] === 0 ? 0 : (target - cum[s]) / segLen[s];
    out.push({
      lng: pts[s][0] + (pts[s+1][0]-pts[s][0])*t,
      lat: pts[s][1] + (pts[s+1][1]-pts[s][1])*t,
      dist: target
    });
  }
  return { samples:out, total };
}

/* ══════════════ 단면 계산 & 표시 ══════════════ */
let currentProfile = null;
async function buildSection(pts, name, marks){
  showToast('고도 데이터를 읽는 중…');
  try{
    const { samples, total } = samplePath(pts, SAMPLE_N);
    const elevs = [];
    for (let i=0;i<samples.length;i+=24){
      const chunk = samples.slice(i, i+24);
      elevs.push(...await Promise.all(chunk.map(s => elevationAt(s.lng, s.lat))));
    }
    // 주요 지점: 단면 위 x위치는 최근접 샘플, 고도는 지점 자체 좌표 실측
    //             (지도 라벨과 동일한 값이 되도록 — 표기 불일치 방지)
    const mk = await Promise.all((marks || []).map(async m => {
      let best = 0, bd = Infinity;
      samples.forEach((s, i) => {
        const d = (s.lng - m.lng)**2 + (s.lat - m.lat)**2;
        if (d < bd){ bd = d; best = i; }
      });
      let e;
      try{ e = await elevationAt(m.lng, m.lat); }catch(_){ e = elevs[best]; }
      return { n:m.n || m.name, i:best, e, grade:m.grade || 'B' };
    }));
    mk.sort((a,b) => a.i - b.i);
    secZoom = 1; secPan = 0;          // 새 단면은 전체 보기로 시작
    currentProfile = { samples, elevs, total, name, marks:mk };
    drawLineOnMap(pts);
    drawProfile();
    fitToLine(pts);
    hideToast();
  }catch(e){
    showToast('고도 타일을 불러오지 못했습니다 — 네트워크 확인 후 다시 시도해 주세요.', 3500);
    console.error(e);
  }
}
function drawLineOnMap(pts){
  map.getSource('secLine').setData({ type:'Feature',
    geometry:{ type:'LineString', coordinates:pts } });
  map.getSource('secPts').setData({ type:'FeatureCollection',
    features: pts.map(p => ({ type:'Feature', geometry:{ type:'Point', coordinates:p } })) });
}
function fitToLine(pts){
  const b = new maplibregl.LngLatBounds();
  pts.forEach(p => b.extend(p));
  map.fitBounds(b, { padding:{top:90,bottom:230,left:60,right:60}, pitch:58, duration:1400 });
}

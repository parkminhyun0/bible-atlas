/* ══════════════ 기본 상수 ══════════════ */
const JERUSALEM = [35.2345, 31.7767];

/* 전용 체험 페이지에서 돌아왔을 때 마지막 지도 시점을 복원한다.
   값은 현재 MapLibre 카메라에서만 저장하며 역사 좌표·모델 정합값과 무관하다. */
const MAP_RESUME_KEY = 'bibleAtlas:mapState:v1';
function readMapResumeState(){
  try {
    const saved = JSON.parse(sessionStorage.getItem(MAP_RESUME_KEY) || 'null');
    sessionStorage.removeItem(MAP_RESUME_KEY);
    if (!saved || !Array.isArray(saved.center) || saved.center.length !== 2) return null;
    const values = [...saved.center, saved.zoom, saved.pitch, saved.bearing];
    return values.every(Number.isFinite) ? saved : null;
  } catch (_) { return null; }
}
const resumedMapState = readMapResumeState();







/* ══════════════ 지도 초기화 ══════════════ */
const map = new maplibregl.Map({
  container:'map',
  center: resumedMapState?.center || JERUSALEM,
  zoom: resumedMapState?.zoom ?? 11.6,
  pitch: resumedMapState?.pitch ?? 62,
  bearing: resumedMapState?.bearing ?? -18,
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
    /* 하늘색을 태양 고도에서 유도한다.
       고도 60°+ = 한낮의 깊은 파랑, 20° 이하 = 노을빛으로 지평선이 물든다.
       (색은 임의값이 아니라 태양 고도의 함수 — 시간대를 바꾸면 함께 변한다) */
    const alt = (window.BibleAtlasLight && window.BibleAtlasLight.sun.altitude) ?? 62;
    const day = clamp01((alt - 5) / 45);                 // 0 = 지평선 부근, 1 = 한낮
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
    const zenith  = mix([120, 128, 168], [42, 99, 184], day);    // 노을 회보라 → 한낮 파랑
    const horizon = mix([226, 168, 116], [169, 191, 214], day);  // 주황 → 옅은 청회
    const fog     = mix([214, 176, 140], [201, 194, 176], day);
    map.setSky({
      'sky-color': rgb(zenith),
      'sky-horizon-blend': 0.55,
      'horizon-color': rgb(horizon),
      'horizon-fog-blend': 0.25,
      'fog-color': rgb(fog),
      'fog-ground-blend': 0.02,
      'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 0.35, 11, 0.20, 14, 0.10, 20, 0.04],
    });
  }catch(err){ console.warn('sky 미지원:', err && err.message); }
}
map.on('load', () => {
  map.setTerrain({ source:'dem', exaggeration:1.6 });
  applyNoonSky();

  /* ── 실제 태양 위치로 조명 구동 ───────────────────────────────
     이전에는 상수(240°)였다. 이제 05-sun.js 가 날짜·시각·좌표로 계산한 실제
     태양 방위·고도를 쓴다. 화면 기준 광원각 = 태양 방위 − 카메라 방위이므로
     지도를 돌려도 태양은 지리적으로 제자리에 있고 그림자만 따라 돈다.
     고도(altitude)는 음영의 세기에도 반영된다 — 낮은 태양일수록 그림자가 길다. */
  const SUN_ORIGIN = { lat: 31.7767, lng: 35.2345 };   // 예루살렘 기준
  const SUN_BASE_DAY = Date.UTC(2026, 3, 2, 12);       // 니산 무렵(춘분 직후) 기준일
  window.BibleAtlasLight = {
    // 기본값 = 유대력 제육시. 성경의 '제육시'는 시계 12시가 아니라 태양 남중이다
    moment: window.BibleAtlasSun
      ? window.BibleAtlasSun.jewishHour(new Date(SUN_BASE_DAY), SUN_ORIGIN.lat, SUN_ORIGIN.lng, 6)
      : new Date(SUN_BASE_DAY),
    sun: { azimuth: 180, altitude: 62 },
  };
  function computeSun(){
    const S = window.BibleAtlasSun;
    if (S) window.BibleAtlasLight.sun = S.position(window.BibleAtlasLight.moment, SUN_ORIGIN.lat, SUN_ORIGIN.lng);
    return window.BibleAtlasLight.sun;
  }
  let lightRAF = null;
  function updateLight(){
    lightRAF = null;
    if (!map.getLayer('hill')) return;
    const sun = window.BibleAtlasLight.sun;
    const dir = ((sun.azimuth - map.getBearing()) % 360 + 360) % 360;
    // 태양이 낮을수록 음영을 강하게 — 아침·저녁의 긴 그림자를 흉내낸다
    const lowSun = 1 + 0.75 * clamp01((60 - sun.altitude) / 50);
    [['hill', 0.30], ['hillFine', 0.14], ['hillRim', 0.06]].forEach(([id, base]) => {
      if (!map.getLayer(id)) return;
      map.setPaintProperty(id, 'hillshade-illumination-direction', dir);
      map.setPaintProperty(id, 'hillshade-exaggeration', Math.min(0.95, base * lowSun));
    });
  }
  /** 임의 시각으로 조명·하늘을 옮긴다 (UI 슬라이더용) */
  window.setSunMoment = function (date){
    window.BibleAtlasLight.moment = date;
    computeSun(); updateLight(); applyNoonSky();
    return window.BibleAtlasLight.sun;
  };
  /** 유대력 제N시로 이동 — 예: setJewishHour(9) → '제구시' */
  window.setJewishHour = function (hour, dateUTC){
    const S = window.BibleAtlasSun;
    if (!S) return null;
    return window.setSunMoment(
      S.jewishHour(dateUTC || new Date(SUN_BASE_DAY), SUN_ORIGIN.lat, SUN_ORIGIN.lng, hour));
  };
  computeSun();
  map.on('rotate', () => { if (!lightRAF) lightRAF = requestAnimationFrame(updateLight); });
  updateLight();
  applyNoonSky();

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





/* ══════════════ 거리·보간 유틸 ══════════════ */



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

/* 단면 차트가 호출하는 엔진별 훅 — MapLibre 구현 */
window.BibleAtlasHooks = {
  hoverPoint(lng, lat){
    const src = map.getSource && map.getSource('hoverPt');
    if (!src) return;
    src.setData(lng == null ? emptyFC()
      : { type:'Feature', geometry:{ type:'Point', coordinates:[lng, lat] } });
  },
};

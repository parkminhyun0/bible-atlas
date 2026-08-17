/* ══════════════ 1세기 건축 — MapLibre 렌더링 ══════════════
   데이터는 scripts/data/20-buildings.js 로 분리했다. */
let bldAdded = false;
function addBuildings(){
  if (bldAdded) return; bldAdded = true;
  map.addSource('bld', { type:'geojson', data:{ type:'FeatureCollection',
    features: BLD.map(x => ({ type:'Feature',
      properties:{ c:x.c, b:x.b, h:x.h, name:x.name || '1세기 재구성', confidence:x.confidence || 'B', note:x.note || '' },
      geometry:{ type:'Polygon', coordinates: x.rings || [x.poly] } })) } });
  map.addLayer({ id:'bld', type:'fill-extrusion', source:'bld',
    paint:{ 'fill-extrusion-color':['get','c'],
            'fill-extrusion-base':['get','b'],
            'fill-extrusion-height':['get','h'],
            'fill-extrusion-opacity':1 } });
}
map.on('load', addBuildings);
/* v12 수정: bindToggle은 v11 트리 패널 재설계에서 제거된 함수 — 잔존 호출 삭제 (건축 토글은 treeBld 체크박스가 담당) */
map.on('mouseenter','bld',()=> map.getCanvas().style.cursor='pointer');
map.on('mouseleave','bld',()=> map.getCanvas().style.cursor='');
map.on('click','bld',e=>{
  const f=e.features && e.features[0]; if(!f) return;
  const p=f.properties || {};
  new maplibregl.Popup({maxWidth:'330px'}).setLngLat(e.lngLat).setHTML(
    `<div class="histPop"><h3>${p.name || '1세기 재구성'}</h3>`+
    `<p><b>신뢰도</b> ${GRADE_TEXT[p.confidence] || p.confidence || 'B'}</p>`+
    (p.note ? `<p>${p.note}</p>` : '<p>문헌·고고학 자료를 바탕으로 한 규모/배치 재구성입니다.</p>')+
    `</div>`).addTo(map);
});

/* 성전산 근접 보기 — 지형 1:1 로 전환하고, 성전 동편에서 감람산을 마주 보는
   지면 높이 시점으로 이동한다(하늘이 함께 보이도록 pitch 를 세운다). */
document.getElementById('templeView').addEventListener('click', () => {
  stopOrbit(); setExag(false);
  map.flyTo({ center:[35.23600,31.77800], zoom:17.9, pitch:84, bearing:78, duration:2400 });
});

/* 고증 배경: 현대 위성은 지형 검증용으로만 약하게 사용. 클릭 시 현대 위성 원색으로 전환 */
const baseModeBtn = document.getElementById('baseMode');
function setHistoricalBase(on){
  baseModeBtn.classList.toggle('on',on);
  if(!map.getLayer('sat')) return;
  // 고증 모드에서도 원색을 크게 훼손하지 않는다 — 실제 지형색 재현이 우선
  map.setPaintProperty('sat','raster-opacity',1);
  map.setPaintProperty('sat','raster-saturation',on ? -0.04 : 0.02);
  map.setPaintProperty('sat','raster-contrast',on ? 0.06 : 0.04);
  map.setPaintProperty('sat','raster-brightness-min',0);
  map.setPaintProperty('sat','raster-brightness-max',1);
  baseModeBtn.innerHTML = on ? '🏺 고증 배경 <span class="drop">정오 조명</span>' : '🛰️ 현대 위성 검증 <span class="drop">선명 컬러</span>';
  if (document.getElementById('treeBaseMode')) document.getElementById('treeBaseMode').checked = on;
}
baseModeBtn.addEventListener('click',()=>setHistoricalBase(!baseModeBtn.classList.contains('on')));

/* 지형 과장 토글 (×1.5 ↔ 1:1) — 건축 높이는 항상 실측 m */
const exagBtn = document.getElementById('togExag');
/* 스타일 로드 완료 후에만 실행 — setTerrain 등은 style 로딩 중 호출하면
   MapLibre가 "Style is not done loading."을 던지고, 그 오류가 CDN(교차 출처)
   스크립트에서 발생하므로 window.onerror에는 "Script error."로만 전달된다. */
function whenStyleReady(fn){
  if (map.isStyleLoaded && map.isStyleLoaded()) { fn(); return; }
  map.once('load', fn);
}
function setExag(on){
  exagBtn.classList.toggle('on', on);
  baseExag = on ? 1.6 : 1.0;
  lastExag = null;
  whenStyleReady(() => { map.setTerrain({ source:'dem', exaggeration: baseExag }); updateCameraFeel(); });
  if (document.getElementById('treeExag')) document.getElementById('treeExag').checked = on;
  exagBtn.innerHTML = on ? '⛰️ 지형 시각 보조 ×1.22 <span class="drop">입체 강화</span>' : '⛰️ 지형 1:1 <span class="drop">실측 비율</span>';
}
exagBtn.addEventListener('click', () => setExag(!exagBtn.classList.contains('on')));
setHistoricalBase(true);
setExag(true);
exagBtn.innerHTML = exagBtn.classList.contains('on') ? '⛰️ 지형 시각 보조 ×1.22 <span class="drop">입체 강화</span>' : '⛰️ 지형 1:1 <span class="drop">실측 비율</span>';
map.on('load', () => {
  setHistoricalBase(document.getElementById('treeBaseMode')?.checked ?? true);
  setExag(document.getElementById('treeExag')?.checked ?? true);
  setCalloutsVisible(document.getElementById('treePoints')?.checked ?? true);
});

let toastTimer = null;
function showToast(msg, ms){
  const t = document.getElementById('toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(hideToast, ms);
}
function hideToast(){ document.getElementById('toast').style.display = 'none'; }

/* 초기 데모: 예루살렘→여리고 단면 자동 표시 */

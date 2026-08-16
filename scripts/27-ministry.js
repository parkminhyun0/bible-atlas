/* ══════════════ 사역 여정 ══════════════ */
/* 예수님: ①세례·시험 ②갈릴리·북부 순회 ③최후 상경(베레아 경유, 막 10:1) */

// ③ 최후 상경: 가버나움 → 요단 동편(베레아) → 여리고 → 예루살렘 (로마 도로 합류)

/* 세례 요한: 유대 광야 → 세례터(요 1:28) → 아이논(요 3:23) / 마케루스 순교(요세푸스) */





const roadLayerRegistry = {}, terrLayerRegistry = {}, terrMarkerRegistry = {};
const terrMarkers = [], jesusMarkers = [], johnMarkers = [];

function addHistoryLayers(){
  // 분봉왕 행정구역 — 레이어를 각각 분리하여 개별 제어
  TERR.forEach(t => {
    const srcId = `terr-${t.key}`;
    const fillId = `${srcId}-fill`;
    const lineId = `${srcId}-line`;
    map.addSource(srcId, { type:'geojson', data:{ type:'FeatureCollection', features:[{ type:'Feature', properties:{ color:t.color }, geometry:{ type:'Polygon', coordinates:[t.poly] } }] } });
    map.addLayer({ id:fillId, type:'fill', source:srcId, paint:{ 'fill-color':t.color, 'fill-opacity':0.22 } }, 'secLine-casing');
    // 경계선: 어두운 케이싱 위에 구역 색 실선 — 배경 위성 위에서도 경계가 또렷하게 보인다
    map.addLayer({ id:`${lineId}-casing`, type:'line', source:srcId,
      layout:{ 'line-join':'round' },
      paint:{ 'line-color':'#1a1510', 'line-width':4.4, 'line-opacity':0.55, 'line-blur':0.4 } }, 'secLine-casing');
    map.addLayer({ id:lineId, type:'line', source:srcId,
      layout:{ 'line-join':'round' },
      paint:{ 'line-color':t.color, 'line-width':2.4, 'line-opacity':0.98 } }, 'secLine-casing');
    const el = document.createElement('div');
    el.className = 'terrLabel'; el.style.color = t.color;
    el.innerHTML = `${t.name}<small>${t.ruler}</small>`;
    const m = new maplibregl.Marker({ element:el }).setLngLat(t.label).addTo(map);
    terrLayerRegistry[t.key] = { fillId, lineId, casingId:`${lineId}-casing` };
    terrMarkerRegistry[t.key] = m;
    terrMarkers.push(m);
  });

  // 예수님 여정
  map.addSource('jesus', { type:'geojson', data:{ type:'Feature', geometry:{ type:'MultiLineString', coordinates:[...JESUS_LINES, JESUS_FINAL] } } });
  map.addLayer({ id:'jesus-casing', type:'line', source:'jesus', paint:{ 'line-color':'#171310','line-width':4.5,'line-opacity':.62 } });
  map.addLayer({ id:'jesus-line', type:'line', source:'jesus', paint:{ 'line-color':'#ffd97a','line-width':2.2 } });
  JESUS_SITES.forEach(([n,lng,lat,grade]) => {
    const el = document.createElement('div');
    el.className = 'miniLabel jesus'; el.textContent = `${grade || 'B'} · ${n}`;
    jesusMarkers.push(new maplibregl.Marker({ element:el, anchor:'top' }).setLngLat([lng,lat]).addTo(map));
  });

  // 세례 요한 여정
  map.addSource('john', { type:'geojson', data:{ type:'Feature', geometry:{ type:'MultiLineString', coordinates:JOHN_LINES } } });
  map.addLayer({ id:'john-line', type:'line', source:'john', paint:{ 'line-color':'#8fd3dc','line-width':2.2,'line-dasharray':[2,2] } });
  JOHN_SITES.forEach(([n,lng,lat,grade]) => {
    const el = document.createElement('div');
    el.className = 'miniLabel john'; el.textContent = `${grade || 'B'} · ${n}`;
    johnMarkers.push(new maplibregl.Marker({ element:el, anchor:'top' }).setLngLat([lng,lat]).addTo(map));
  });

  // 1세기 육로 회랑
  ROADS.forEach(r => {
    const srcId = `road-${r.key}`;
    const layerId = `${srcId}-line`;
    map.addSource(srcId, { type:'geojson', data:{ type:'Feature', geometry:{ type:'LineString', coordinates:r.pts } } });
    map.addLayer({ id:layerId, type:'line', source:srcId,
      paint:{ 'line-color':r.color, 'line-width':1.8, 'line-opacity':0.9, 'line-dasharray':[1.4,1.1] } }, 'secLine-casing');
    roadLayerRegistry[r.key] = layerId;
  });
}
map.on('load', () => { addHistoryLayers(); });

/* 레이어 표시 제어 */
function setMarkersVisible(markers, on){ markers.forEach(m => m.getElement().style.display = on ? '' : 'none'); }
function setLayerVisible(ids, on){ ids.forEach(id => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')); }
document.getElementById('fitAll').addEventListener('click', () => {
  stopOrbit();
  map.fitBounds([[34.25,31.15],[36.45,33.55]],
    { padding:{top:80,bottom:60,left:60,right:60}, pitch:42, bearing:0, duration:1800 });
});

function syncMasterFromChildren(masterId, selector){
  const master = document.getElementById(masterId);
  const boxes = [...document.querySelectorAll(selector)];
  const onCount = boxes.filter(b => b.checked).length;
  master.checked = onCount > 0;
  master.indeterminate = onCount > 0 && onCount < boxes.length;
}
function setTerritoryVisible(key, on){
  const reg = terrLayerRegistry[key]; if (!reg) return;
  setLayerVisible([reg.fillId, reg.lineId, reg.casingId], on);
  terrMarkerRegistry[key] && (terrMarkerRegistry[key].getElement().style.display = on ? '' : 'none');
}
function applyTerrOpacity(v){
  Object.values(terrLayerRegistry).forEach(reg => { if (map.getLayer(reg.fillId)) map.setPaintProperty(reg.fillId, 'fill-opacity', v); });
}
function setRoadVisible(key, on){ const id = roadLayerRegistry[key]; if (id) setLayerVisible([id], on); }
function setCalloutsVisible(on){
  ['site-dot','site-label'].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
  });
}

// Tree panel open/close
const treePanel = document.getElementById('treePanel');
document.getElementById('treeToggleBtn').addEventListener('click',()=>treePanel.classList.toggle('hidden'));

// Background / terrain controls
const treeBaseMode = document.getElementById('treeBaseMode');
const treeBld = document.getElementById('treeBld');
const treeExag = document.getElementById('treeExag');
const treePoints = document.getElementById('treePoints');
treeBaseMode.addEventListener('change', ()=> setHistoricalBase(treeBaseMode.checked));
treeBld.addEventListener('change', ()=> setLayerVisible(['bld'], treeBld.checked));
treeExag.addEventListener('change', ()=> setExag(treeExag.checked));
treePoints.addEventListener('change', ()=> setCalloutsVisible(treePoints.checked));

/* 1세기 핵심 지명 표시 토글 */
const treeKeyPlaces = document.getElementById('treeKeyPlaces');
treeKeyPlaces.addEventListener('change', ()=> setKeyPlacesVisible(treeKeyPlaces.checked));

/* OSM 도로·지명 오버레이 — 위성 영상만으로 판독이 어려운 현대 도로·마을 확인용 */
const treeOsm = document.getElementById('treeOsm');
const osmOpacity = document.getElementById('osmOpacity');
function applyOsm(){
  if (!map.getLayer('osm')) return;
  map.setLayoutProperty('osm', 'visibility', treeOsm.checked ? 'visible' : 'none');
  map.setPaintProperty('osm', 'raster-opacity', Number(osmOpacity.value) / 100);
}
treeOsm.addEventListener('change', applyOsm);
osmOpacity.addEventListener('input', applyOsm);
map.on('load', applyOsm);

// Territory controls
const terrBoxes = [...document.querySelectorAll('.terr-item')];
document.getElementById('treeTerrMaster').addEventListener('change', e => {
  terrBoxes.forEach(box => { box.checked = e.target.checked; setTerritoryVisible(box.dataset.key, box.checked); });
  syncMasterFromChildren('treeTerrMaster', '.terr-item');
  syncLegendFromTree();
});
terrBoxes.forEach(box => box.addEventListener('change', ()=>{ setTerritoryVisible(box.dataset.key, box.checked); syncMasterFromChildren('treeTerrMaster', '.terr-item'); syncLegendFromTree(); }));

/* ── 상단 범례 구성 · 트리 체크박스와 양방향 동기화 ── */
const tlItems = document.getElementById('tlItems');
const tlMaster = document.getElementById('tlMaster');
const tlBoxes = {};
TERR.forEach(t => {
  const lab = document.createElement('label');
  lab.className = 'tlItem';
  lab.title = `${t.name} — ${t.ruler}`;
  lab.innerHTML = `<input type="checkbox" checked data-key="${t.key}">` +
    `<span class="swatch" style="background:${t.color}"></span>` +
    `<span class="tlName" style="color:${t.color}">${t.name}<span class="tlRuler">${t.ruler}</span></span>`;
  tlItems.appendChild(lab);
  const box = lab.querySelector('input');
  tlBoxes[t.key] = { box, lab };
  box.addEventListener('change', () => {
    setTerritoryVisible(t.key, box.checked);
    lab.classList.toggle('off', !box.checked);
    const tree = document.querySelector(`.terr-item[data-key="${t.key}"]`);
    if (tree) tree.checked = box.checked;
    syncMasterFromChildren('treeTerrMaster', '.terr-item');
    tlMaster.checked = Object.values(tlBoxes).every(v => v.box.checked);
  });
});
tlMaster.addEventListener('change', () => {
  Object.entries(tlBoxes).forEach(([key, v]) => {
    v.box.checked = tlMaster.checked;
    v.lab.classList.toggle('off', !tlMaster.checked);
    setTerritoryVisible(key, tlMaster.checked);
    const tree = document.querySelector(`.terr-item[data-key="${key}"]`);
    if (tree) tree.checked = tlMaster.checked;
  });
  syncMasterFromChildren('treeTerrMaster', '.terr-item');
});
function syncLegendFromTree(){
  Object.entries(tlBoxes).forEach(([key, v]) => {
    const tree = document.querySelector(`.terr-item[data-key="${key}"]`);
    if (tree && v.box.checked !== tree.checked){
      v.box.checked = tree.checked;
      v.lab.classList.toggle('off', !tree.checked);
    }
  });
  tlMaster.checked = Object.values(tlBoxes).every(v => v.box.checked);
}
document.getElementById('terrOpacity').addEventListener('input', e => applyTerrOpacity(Number(e.target.value)/100));

// Road controls
const roadBoxes = [...document.querySelectorAll('.road-item')];
document.getElementById('treeRoadMaster').addEventListener('change', e => {
  roadBoxes.forEach(box => { box.checked = e.target.checked; setRoadVisible(box.dataset.key, box.checked); });
  syncMasterFromChildren('treeRoadMaster', '.road-item');
});
roadBoxes.forEach(box => box.addEventListener('change', ()=>{ setRoadVisible(box.dataset.key, box.checked); syncMasterFromChildren('treeRoadMaster', '.road-item'); }));

// Jesus / John controls
const treeJesusLines = document.getElementById('treeJesusLines');
const treeJesusSites = document.getElementById('treeJesusSites');
const treeJohnLines = document.getElementById('treeJohnLines');
const treeJohnSites = document.getElementById('treeJohnSites');
treeJesusLines.addEventListener('change',()=>setLayerVisible(['jesus-casing','jesus-line'],treeJesusLines.checked));
treeJesusSites.addEventListener('change',()=>setMarkersVisible(jesusMarkers,treeJesusSites.checked));
treeJohnLines.addEventListener('change',()=>setLayerVisible(['john-line'],treeJohnLines.checked));
treeJohnSites.addEventListener('change',()=>setMarkersVisible(johnMarkers,treeJohnSites.checked));

// Initial sync
applyTerrOpacity(0.22);
syncMasterFromChildren('treeTerrMaster', '.terr-item');
syncMasterFromChildren('treeRoadMaster', '.road-item');
setCalloutsVisible(true);

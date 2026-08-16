/* ══════════════ 1세기 팔레스타인 핵심 지명 ══════════════
   복음서·사도행전·요세푸스에 등장하는 주요 도시·마을·요새를 지역별로 정리했다.
   좌표는 현행 고고학 비정에 따른 대표점이며, 비정 논쟁이 있는 곳은 `disputed`
   로 표시했다(가나·벳새다·엠마오·아이논 등). 지도 좌표에 고정된 심볼 레이어로
   그리므로 화면을 움직여도 지명이 지점을 벗어나지 않는다. */
const KEY_PLACES = [
  // ── 유대 (예루살렘 권역·유대 산지) ──
  { n:'예루살렘',   lng:35.2345, lat:31.7767, r:'유대' , pid:'687928' },
  { n:'베들레헴',   lng:35.2024, lat:31.7054, r:'유대' , pid:'687856' },
  { n:'헤로디온',   lng:35.2414, lat:31.6656, r:'유대' , pid:'687916' },
  { n:'헤브론',     lng:35.0997, lat:31.5326, r:'유대' , pid:'687915' },
  { n:'엠마오',     lng:34.9890, lat:31.8390, r:'유대', disputed:true , pid:'687891' },
  { n:'에브라임',   lng:35.2960, lat:31.9560, r:'유대', disputed:true , pid:'687896' },
  { n:'쿰란',       lng:35.4590, lat:31.7410, r:'유대' , pid:'688011' },
  { n:'엔게디',     lng:35.3880, lat:31.4610, r:'유대' , pid:'687893' },
  { n:'마사다',     lng:35.3536, lat:31.3156, r:'유대' , pid:'687968' },
  { n:'아리마대',   lng:35.0480, lat:32.0330, r:'유대', disputed:true , pid:'688014' },
  { n:'모데인',     lng:35.0100, lat:31.9300, r:'유대' , pid:'687977' },
  // ── 해안 평야 (블레셋·샤론) ──
  { n:'가이사랴',   lng:34.8917, lat:32.5000, r:'해안' , pid:'678401' },
  { n:'욥바',       lng:34.7550, lat:32.0530, r:'해안' , pid:'687931' },
  { n:'룻다',       lng:34.8900, lat:31.9500, r:'해안' , pid:'687953' },
  { n:'얌니아',     lng:34.7400, lat:31.8700, r:'해안' , pid:'687925' },
  { n:'안디바드리', lng:34.9350, lat:32.1030, r:'해안' , pid:'687996' },
  { n:'아소도',     lng:34.6500, lat:31.7500, r:'해안' , pid:'687838' },
  { n:'아스글론',   lng:34.5510, lat:31.6658, r:'해안' , pid:'687839' },
  { n:'가사',       lng:34.4668, lat:31.5017, r:'해안' , pid:'687902' },
  { n:'돌',         lng:34.9200, lat:32.6167, r:'해안' , pid:'678121' },
  { n:'돌레마이',   lng:35.0700, lat:32.9280, r:'해안' , pid:'678010' },
  // ── 사마리아 ──
  { n:'세바스테',   lng:35.1920, lat:32.2800, r:'사마리아' , pid:'678370' },
  { n:'세겜',       lng:35.2800, lat:32.2130, r:'사마리아' , pid:'678403' },
  { n:'그리심산',   lng:35.2730, lat:32.2000, r:'사마리아' , pid:'678147' },
  { n:'살렘',       lng:35.4300, lat:32.3300, r:'사마리아', disputed:true , pid:'678252' },
  // ── 갈릴리 ──
  { n:'나사렛',     lng:35.2978, lat:32.7021, r:'갈릴리' , pid:'678299' },
  { n:'세포리스',   lng:35.2790, lat:32.7520, r:'갈릴리' , pid:'678387' },
  { n:'디베랴',     lng:35.5320, lat:32.7950, r:'갈릴리' , pid:'678431' },
  { n:'막달라',     lng:35.5170, lat:32.8250, r:'갈릴리' , pid:'678272' },
  { n:'고라신',     lng:35.5640, lat:32.9110, r:'갈릴리' , pid:'678091' },
  { n:'게네사렛',   lng:35.5300, lat:32.8500, r:'갈릴리' , pid:'678155' },
  { n:'나인',       lng:35.3450, lat:32.6310, r:'갈릴리' , pid:'418952041' },
  { n:'다볼산',     lng:35.3900, lat:32.6870, r:'갈릴리' , pid:'678419' },
  { n:'요타파타',   lng:35.2760, lat:32.8360, r:'갈릴리' , pid:'678201' },
  { n:'기샬라',     lng:35.4460, lat:33.0250, r:'갈릴리' , pid:'678165' },
  // ── 데가볼리·베레아 (요단 동편) ──
  { n:'벧산',       lng:35.5000, lat:32.5000, r:'데가볼리' , pid:'678378' },
  { n:'펠라',       lng:35.6170, lat:32.4500, r:'데가볼리' , pid:'678326' },
  { n:'가다라',     lng:35.6850, lat:32.6550, r:'데가볼리' , pid:'678142' },
  { n:'히포스',     lng:35.6600, lat:32.7780, r:'데가볼리' , pid:'678185' },
  { n:'아빌라',     lng:35.8700, lat:32.6800, r:'데가볼리' , pid:'677992' },
  { n:'거라사',     lng:35.8910, lat:32.2810, r:'데가볼리' , pid:'678158' },
  { n:'빌라델비아', lng:35.9330, lat:31.9500, r:'데가볼리' , pid:'697728' },
  { n:'율리아',     lng:35.6300, lat:31.8300, r:'베레아' , pid:'347978438' },
  // ── 북부 (페니키아·이두래) ──
  { n:'시돈',       lng:35.3750, lat:33.5600, r:'북부' , pid:'678393' },
  { n:'헤르몬산',   lng:35.8570, lat:33.4160, r:'북부' , pid:'678181' },
  // ── 이두매 ──
  { n:'브엘세바',   lng:34.7913, lat:31.2530, r:'이두매' , pid:'687846' },
  { n:'마레사',     lng:34.8990, lat:31.6100, r:'이두매' , pid:'687854' },
];
function addKeyPlaceLayers(){
  if (map.getSource('keyPlaces')) return;
  map.addSource('keyPlaces', { type:'geojson', data:{
    type:'FeatureCollection',
    features: KEY_PLACES.map((p, i) => ({
      type:'Feature', id: 1000 + i,
      properties:{ idx:i, label:p.n, region:p.r, disputed: p.disputed ? 1 : 0 },
      geometry:{ type:'Point', coordinates:[p.lng, p.lat] },
    })),
  }});
  // 지명 점 — 요청대로 빨강. 비정 논쟁지는 조금 옅게.
  map.addLayer({
    id:'place-dot', type:'circle', source:'keyPlaces',
    paint:{
      'circle-radius':['interpolate',['linear'],['zoom'], 6,2.6, 9,3.6, 13,5.4, 16,7],
      'circle-color':'#e02b23',
      'circle-opacity':['case',['==',['get','disputed'],1], 0.72, 1],
      'circle-stroke-color':'#2a0b08',
      'circle-stroke-width':1.5,
      'circle-pitch-alignment':'map',
    },
  });
  map.addLayer({
    id:'place-label', type:'symbol', source:'keyPlaces',
    layout:{
      'text-field':['case',['==',['get','disputed'],1], ['concat',['get','label'],' *'], ['get','label']],
      'text-font':['Open Sans Regular'],
      'text-size':['interpolate',['linear'],['zoom'], 6,10, 9,11.5, 13,13.5, 16,15],
      'text-anchor':'left',
      'text-offset':[0.7, 0],
      'text-padding':2,
      'text-allow-overlap':false,
      'text-optional':true,
      'text-max-width':10,
      'symbol-sort-key':1,     // 고증 포인트(rank 0~2)보다 뒤에 자리를 잡는다
    },
    paint:{
      'text-color':'#ffd9d4',
      'text-halo-color':'#2a0b08',
      'text-halo-width':1.7,
      'text-halo-blur':0.3,
    },
  });
  const openPlaceHud = (e) => {
    const f = e.features && e.features[0];
    if (!f) return;
    const p = KEY_PLACES[f.properties.idx];
    const body = document.getElementById('pointHudBody');
    /* 전거(典據): Pleiades 고대 지명 gazetteer 의 해당 항목을 함께 노출한다.
       좌표를 임의로 찍은 것이 아니라 학술 데이터셋과 대조했음을 보여준다. */
    const cite = p.pid
      ? `<span class="meta">전거 · <a href="https://pleiades.stoa.org/places/${p.pid}" target="_blank" rel="noreferrer" style="color:#8fc9ff">Pleiades ${p.pid}</a></span>`
      : '';
    body.innerHTML = `<b>${p.n}</b><small>${p.r} 권역 · 1세기 주요 지명</small>` +
      `<span class="meta">${p.lat.toFixed(4)}°N ${p.lng.toFixed(4)}°E</span>` + cite +
      `<span>${p.disputed ? '비정에 학술적 논쟁이 있는 지점입니다. 대표 후보지로만 표시합니다.' : '현행 고고학 비정에 따른 대표점입니다.'}</span>`;
    document.getElementById('pointHud').classList.add('show');
  };
  ['place-dot','place-label'].forEach(id => {
    map.on('click', id, openPlaceHud);
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  });
}
map.on('load', addKeyPlaceLayers);
function setKeyPlacesVisible(on){
  ['place-dot','place-label'].forEach(id => {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
  });
}
document.getElementById('pointHudClose').addEventListener('click',()=>document.getElementById('pointHud').classList.remove('show'));

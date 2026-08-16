/* ══════════════ 1세기 팔레스타인 핵심 지명 ══════════════
   복음서·사도행전·요세푸스에 등장하는 주요 도시·마을·요새를 지역별로 정리했다.
   좌표는 현행 고고학 비정에 따른 대표점이며, 비정 논쟁이 있는 곳은 `disputed`
   로 표시했다(가나·벳새다·엠마오·아이논 등). 지도 좌표에 고정된 심볼 레이어로
   그리므로 화면을 움직여도 지명이 지점을 벗어나지 않는다. */

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
    body.innerHTML = `<b>${p.n}</b><small>${p.r} 권역 · 1세기 주요 지명</small>` +
      `<span class="meta">${p.lat.toFixed(4)}°N ${p.lng.toFixed(4)}°E</span>` +
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

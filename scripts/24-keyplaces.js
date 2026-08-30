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
      properties:{ idx:i, label:p.n, region:p.r, disputed: p.disputed ? 1 : 0,
                   prio: placeLabelPriority(p) },
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
  /* 라벨은 자리가 없으면 지도 엔진이 통째로 감춘다. 앞 판본은 자리를 왼쪽
     한 곳으로 못박아 두어서, 이웃 지명과 글자 상자가 겹치는 순간 라벨이
     사라졌다 — 빨간 점만 남고 이름이 없는 지명이 광역 화면에서 스무 곳 가까이
     나왔다(가나·벳새다·수가·그리심산·게네사렛·막달라 …).
     text-variable-anchor 로 여덟 방향 후보 자리를 주면 엔진이 빈 쪽으로 글자를
     옮겨 놓는다. 점 좌표는 그대로이므로 지명이 지점을 벗어나지 않는다.
     (cesium.html 의 LABEL_CANDIDATES 와 같은 해법을 MapLibre 문법으로 쓴 것) */
  map.addLayer({
    id:'place-label', type:'symbol', source:'keyPlaces',
    layout:{
      'text-field':['case',['==',['get','disputed'],1], ['concat',['get','label'],' *'], ['get','label']],
      'text-font':['Open Sans Regular'],
      // 광역 축척에서만 조금 줄인다. 갈릴리 호수 둘레처럼 점이 몰린 구역에서
      // 글자 상자가 서로 밀어내 이름표가 통째로 빠지던 것을 막는다.
      // z13 이상(읽는 축척)의 크기는 건드리지 않는다.
      'text-size':['interpolate',['linear'],['zoom'], 6,8.0, 9,9.8, 13,13.5, 16,15],
      'text-variable-anchor':['left','right','top','bottom',
                              'top-left','top-right','bottom-left','bottom-right'],
      /* 점과 이름표 사이 간격. em 단위이므로 글자 크기에 비례한다.
         0.9em 은 점에서 너무 멀어 이름이 어느 점의 것인지 읽기 어려웠다.
         점 반지름이 z6 2.6px → z16 7px, 글자가 8px → 15px 이므로
         0.6em 이면 어느 축척에서나 점 가장자리로부터 3px 안팎으로 붙는다. */
      'text-radial-offset':0.6,
      'text-justify':'auto',
      'text-padding':0,
      'text-allow-overlap':false,
      'text-max-width':10,
      // 값이 작을수록 먼저 자리를 잡는다. 대표 지명 → A급 → B급 → 비정 논쟁지 순.
      'symbol-sort-key':['get','prio'],
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

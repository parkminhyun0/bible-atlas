/* ══════════════ 지명 라벨 (고도는 DEM 실측값) ══════════════
   좌표 근거: 성전산·감람산(위키피디아 지리좌표), 헤롯 여리고 궁전(툴룰 아부
   엘-알라이크 31.8537/35.4337), 텔 에스-술탄, 베다니(엘아자리야)·벳바게·
   선한 사마리아인 여관 전승지(마알레 아둠밈 능선)는 통용 좌표의 근사값 */


function showPointHud(site, demElev){
  const hud = document.getElementById('pointHud');
  const body = document.getElementById('pointHudBody');
  body.innerHTML = `<b>${site.name}</b>`+
    `<small>${GRADE_TEXT[site.grade || 'B']}</small>`+
    `<span class="meta">${demElev == null ? '' : `현재 지형 DEM · ${demElev < 0 ? '−' : ''}${Math.abs(Math.round(demElev))} m`}${site.refText ? `<br>별도 고증 기준 · ${site.refText}` : ''}</span>`+
    `<span>${site.note || '지도 위 표시는 실제 지형 포인트를 가리지 않도록 옆으로 배치한 HUD형 안내 라벨입니다.'}</span>`;
  hud.classList.add('show');
}
/* ── 고증 포인트: 지도에 고정된 지명 포인트 ──────────────────
   [변경] DOM 기반 HUD 라벨(hudCallout)을 전부 걷어내고, MapLibre 심볼 레이어로
   바꿨다. 심볼은 지도 엔진이 타일과 함께 그리므로 좌표에 완전히 고정되며,
   화면을 옮기거나 회전해도 지명이 지점을 벗어나지 않는다.
   겹칠 때는 지도 엔진이 낮은 우선순위 라벨을 '감춘다'(밀어내지 않는다).
   한글은 glyphs 서버 대신 localIdeographFontFamily 로 브라우저 폰트를 쓴다. */
const siteFeatures = () => ({
  type:'FeatureCollection',
  features: SITES.map((s, i) => ({
    type:'Feature',
    id: i,
    properties:{
      idx: i,
      label: s.n || s.name,
      grade: s.grade || 'B',
      // 등급이 높을수록(A) 우선 표시되도록 정렬 키를 둔다
      rank: (s.grade === 'A' ? 0 : s.grade === 'B' ? 1 : 2),
    },
    geometry:{ type:'Point', coordinates:[s.lng, s.lat] },
  })),
});
const GRADE_COLOR = ['match', ['get','grade'], 'A', '#9fd38a', 'C', '#dda18f', '#f1d28f'];
function addSitePointLayers(){
  if (map.getSource('sitePts')) return;
  map.addSource('sitePts', { type:'geojson', data: siteFeatures() });
  map.addLayer({
    id:'site-dot', type:'circle', source:'sitePts',
    paint:{
      'circle-radius':['interpolate',['linear'],['zoom'], 8, 3.2, 12, 5, 16, 7],
      'circle-color': GRADE_COLOR,
      'circle-stroke-color':'#171310', 'circle-stroke-width':1.6,
      'circle-pitch-alignment':'map',
    },
  });
  map.addLayer({
    id:'site-label', type:'symbol', source:'sitePts',
    layout:{
      'text-field':['get','label'],
      'text-font':['Open Sans Regular'],
      'text-size':['interpolate',['linear'],['zoom'], 8, 11, 12, 13, 16, 15],
      'text-anchor':'left',
      'text-offset':[0.75, 0],
      'text-padding':3,
      'text-allow-overlap':false,
      'text-optional':true,
      'symbol-sort-key':['get','rank'],
      'text-max-width':11,
    },
    paint:{
      'text-color':'#fdf3dd',
      'text-halo-color':'#12100c',
      'text-halo-width':1.8,
      'text-halo-blur':0.4,
    },
  });
  const openHud = async (e) => {
    const f = e.features && e.features[0];
    if (!f) return;
    const site = SITES[f.properties.idx];
    let elev = null;
    try{ elev = await elevationAt(site.lng, site.lat); }catch(_){ }
    showPointHud(site, elev);
  };
  ['site-dot','site-label'].forEach(id => {
    map.on('click', id, openHud);
    map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
  });
}
map.on('load', addSitePointLayers);

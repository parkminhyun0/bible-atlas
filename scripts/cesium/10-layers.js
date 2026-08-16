/* ══════════════ Cesium 실사 모드 · 데이터 레이어 ══════════════
   scripts/data/00-geo.js 의 공통 데이터를 Cesium 엔티티로 그린다.
   MapLibre 판과 같은 데이터를 쓰므로, 좌표를 고치면 두 화면에 함께 반영된다.

   레이어 대응
     고증 포인트(SITES)      → 등급색 점 + 라벨
     핵심 지명(KEY_PLACES)   → 빨간 점 + 라벨
     분봉왕 행정구역(TERR)   → 반투명 면 + 경계선 + 권역 라벨
     예수·요한 여정          → 지면에 붙는 선(clampToGround)
     로마 도로(ROADS)        → 파선
     단면 경로(ROUTES)       → 선택 시 강조선
================================================================= */
'use strict';

window.BibleAtlasLayers = (function () {
  const G = {};                 // 레이어 그룹 { 이름: [entity...] }
  let viewer = null;

  const css = (hex, alpha) => {
    const c = Cesium.Color.fromCssColorString(hex);
    return alpha == null ? c : c.withAlpha(alpha);
  };
  const deg = (lng, lat, h) => Cesium.Cartesian3.fromDegrees(lng, lat, h);
  const flat = pts => pts.flatMap(p => [p[0], p[1]]);

  function group(name){ if (!G[name]) G[name] = []; return G[name]; }
  function add(name, entity){ const e = viewer.entities.add(entity); group(name).push(e); return e; }

  /* ── 고증 포인트: 신뢰도 등급별 색 ── */
  const GRADE_COLOR = { A: '#9fd38a', B: '#f1d28f', C: '#dda18f' };
  function addSites(){
    SITES.forEach(s => {
      const color = GRADE_COLOR[s.grade || 'B'];
      add('sites', {
        position: deg(s.lng, s.lat),
        point: {
          pixelSize: 11, color: css(color),
          outlineColor: css('#171310'), outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: s.n || s.name,
          font: '700 14px "Noto Sans KR", sans-serif',
          fillColor: css(color), outlineColor: css('#171310'), outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(12, 0),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          translucencyByDistance: new Cesium.NearFarScalar(3e4, 1.0, 4e5, 0.0),
        },
        description: `<b>${s.name || s.n}</b><br>신뢰도 ${s.grade || 'B'}` +
                     (s.note ? `<br>${s.note}` : ''),
      });
    });
  }

  /* ── 1세기 핵심 지명: 빨간 점 ── */
  function addKeyPlaces(){
    KEY_PLACES.forEach(p => {
      add('places', {
        position: deg(p.lng, p.lat),
        point: {
          pixelSize: 9, color: css('#e02b23', p.disputed ? 0.72 : 1),
          outlineColor: css('#2a0b08'), outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: p.disputed ? p.n + ' *' : p.n,
          font: '600 13px "Noto Sans KR", sans-serif',
          fillColor: css('#ffd9d4'), outlineColor: css('#2a0b08'), outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(10, 0),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          translucencyByDistance: new Cesium.NearFarScalar(2e4, 1.0, 3e5, 0.0),
        },
        description: `<b>${p.n}</b><br>${p.r} 권역` +
          (p.pid ? `<br><a href="https://pleiades.stoa.org/places/${p.pid}" target="_blank">Pleiades ${p.pid}</a>` : ''),
      });
    });
  }

  /* ── 분봉왕 행정구역 ── */
  function addTerritories(){
    TERR.forEach(t => {
      add('territories', {
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(Cesium.Cartesian3.fromDegreesArray(flat(t.poly))),
          material: css(t.color, 0.22),
          classificationType: Cesium.ClassificationType.TERRAIN,   // 지형 표면에 그린다
        },
      });
      add('territories', {
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(flat(t.poly.concat([t.poly[0]]))),
          width: 3, clampToGround: true,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: css(t.color), outlineColor: css('#1a1510', 0.65), outlineWidth: 2,
          }),
        },
      });
      add('territories', {
        position: deg(t.label[0], t.label[1]),
        label: {
          text: t.name + '\n' + t.ruler,
          font: '700 13px "Noto Serif KR", serif',
          fillColor: css(t.color), outlineColor: css('#171310'), outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          translucencyByDistance: new Cesium.NearFarScalar(5e4, 1.0, 8e5, 0.0),
        },
      });
    });
  }

  /* ── 사역 여정 · 로마 도로 ── */
  function addRoutes(){
    const lineOf = (coords, color, width, dashed) => ({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(flat(coords)),
        width, clampToGround: true,
        material: dashed
          ? new Cesium.PolylineDashMaterialProperty({ color: css(color), dashLength: 14 })
          : new Cesium.PolylineOutlineMaterialProperty({
              color: css(color), outlineColor: css('#171310', 0.7), outlineWidth: 2 }),
      },
    });
    [...JESUS_LINES, JESUS_FINAL].forEach(l => add('jesus', lineOf(l, '#ffd97a', 5, false)));
    JOHN_LINES.forEach(l => add('john', lineOf(l, '#8fd3e8', 4, false)));
    ROADS.forEach(r => add('roads', lineOf(r.pts, r.color || '#f0c67a', 4, true)));
  }

  /* ── 단면 경로 (선택한 것만 강조) ── */
  let routeEntity = null;
  function showRoute(key){
    if (routeEntity){ viewer.entities.remove(routeEntity); routeEntity = null; }
    const r = ROUTES[key];
    if (!r) return null;
    routeEntity = viewer.entities.add(lineHighlight(r.pts));
    return r;
  }
  function lineHighlight(pts){
    return { polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray(flat(pts)),
      width: 7, clampToGround: true,
      material: new Cesium.PolylineOutlineMaterialProperty({
        color: css('#d9a353'), outlineColor: css('#171310', 0.85), outlineWidth: 3 }),
    } };
  }

  function setVisible(name, on){ (G[name] || []).forEach(e => { e.show = on; }); }
  function counts(){ const o = {}; Object.keys(G).forEach(k => o[k] = G[k].length); return o; }

  function init(v){
    viewer = v;
    addSites(); addKeyPlaces(); addTerritories(); addRoutes();
    return counts();
  }

  return { init, setVisible, showRoute, counts, get groups(){ return G; } };
})();

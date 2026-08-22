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
  const labelItems = [];        // 화면 충돌 회피 대상 지명
  const infoByEntity = new WeakMap();   // 엔티티 → 클릭했을 때 보여 줄 배경 정보
  let viewer = null;

  const css = (hex, alpha) => {
    const c = Cesium.Color.fromCssColorString(hex);
    return alpha == null ? c : c.withAlpha(alpha);
  };
  const deg = (lng, lat, h) => Cesium.Cartesian3.fromDegrees(lng, lat, h);
  const flat = pts => pts.flatMap(p => [p[0], p[1]]);

  function group(name){ if (!G[name]) G[name] = []; return G[name]; }
  function add(name, entity){ const e = viewer.entities.add(entity); group(name).push(e); return e; }

  /* ── Smart geographic labels ───────────────────────────────────────────
     실제 좌표(point)는 절대 움직이지 않는다. 텍스트만 화면 좌표에서 재배치하고,
     빈 자리가 없으면 낮은 우선순위 라벨만 숨긴다.
     - 광역: 핵심 도시 + A급 고증점 중심
     - 중거리: 일반 지명 + B급까지
     - 근거리: C급/논쟁 지명까지
     - 같은 지점의 "예루살렘" / "예루살렘 · 성전산" 같은 중복은
       중·광역에서 대표 라벨 하나만 남긴다. */
  const MAJOR_PLACE_NAMES = new Set([
    '예루살렘','베들레헴','나사렛','가버나움','가이사랴','가이사랴 빌립보',
    '두로','시돈','사마리아','세겜','벧산','디베랴','가사','욥바','헤브론',
    '나바테아 왕국 · 페트라'
  ]);
  const UI_BLOCK_IDS = ['hdr','realCtl','routes','treeDock','profilePanel'];
  const LABEL_CANDIDATES = [
    { x:14, y:0,  h:'left' },  { x:14, y:-20, h:'left' }, { x:14, y:20, h:'left' },
    { x:-14,y:0,  h:'right' }, { x:-14,y:-20,h:'right' }, { x:-14,y:20,h:'right' },
    { x:0,  y:-26,h:'center'}, { x:0,  y:26, h:'center'},
    { x:18, y:-40,h:'left' },  { x:-18,y:-40,h:'right'},
    { x:18, y:40, h:'left' },  { x:-18,y:40, h:'right'}
  ];

  function sitePriority(s){
    if ((s.grade || 'B') === 'A') return 70;
    if ((s.grade || 'B') === 'B') return 62;
    return 50;
  }
  function placePriority(p){
    if (MAJOR_PLACE_NAMES.has(p.n)) return 110;
    return p.disputed ? 54 : 74;
  }
  function registerLabel(entity, meta){
    labelItems.push(Object.assign({ entity }, meta));
    return entity;
  }
  function minPriorityForHeight(height){
    /* 우선순위는 '누구를 먼저 놓을지' 정하는 값이고, 실제로 몇 개를 띄울지는
       아래 충돌 판정이 결정한다. 기준을 높게 잡으면 화면에 자리가 남는데도
       지명이 통째로 빠지므로, 축척에 맞는 최소선만 남긴다. */
    if (height > 400000) return 96;    // 지구 규모: 대표 도시 + 주요 고증점
    if (height > 180000) return 72;    // 광역: 일반 지명까지
    if (height > 80000) return 64;     // 지방: B급 고증점까지
    if (height > 35000) return 56;     // 권역: 논쟁 지명까지
    return 0;                          // 근거리·지면: 전부
  }
  function estimateLabelSize(item){
    const text = String(item.text || '').replace(/\s*\*\s*$/, '');
    const lines = text.split('\n');
    const maxChars = Math.max(...lines.map(line => [...line].length), 1);
    return {
      width: Math.min(260, Math.max(46, maxChars * item.fontPx * 1.02 + 18)),
      height: lines.length * (item.fontPx + 6) + 10,
    };
  }
  function candidateRect(anchor, candidate, size){
    let left;
    if (candidate.h === 'right') left = anchor.x + candidate.x - size.width;
    else if (candidate.h === 'center') left = anchor.x + candidate.x - size.width / 2;
    else left = anchor.x + candidate.x;
    const top = anchor.y + candidate.y - size.height / 2;
    return { left, top, right:left + size.width, bottom:top + size.height };
  }
  function overlaps(a, b, gap){
    return !(a.right + gap <= b.left || a.left >= b.right + gap ||
             a.bottom + gap <= b.top || a.top >= b.bottom + gap);
  }
  function insideCanvas(rect, width, height, margin){
    return rect.left >= margin && rect.top >= margin &&
           rect.right <= width - margin && rect.bottom <= height - margin;
  }
  function uiObstacles(canvasRect){
    const out = [];
    if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return out;
    UI_BLOCK_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const rect = {
        left:r.left - canvasRect.left,
        top:r.top - canvasRect.top,
        right:r.right - canvasRect.left,
        bottom:r.bottom - canvasRect.top,
      };
      if (rect.right <= 0 || rect.bottom <= 0 ||
          rect.left >= canvasRect.width || rect.top >= canvasRect.height) return;
      out.push(rect);
    });
    return out;
  }
  function samePlaceFamily(a, b){
    const norm = v => String(v || '').replace(/\s*\*\s*$/, '').trim();
    const aa = norm(a), bb = norm(b);
    if (!aa || !bb) return false;
    if (aa === bb) return true;
    // 한쪽이 다른 쪽의 '이름 + 구분자 + 덧말' 형태일 때만 같은 가족이다.
    const longer = aa.length >= bb.length ? aa : bb;
    const shorter = aa.length >= bb.length ? bb : aa;
    return longer.startsWith(shorter) && /^[\s·・\-—(]/.test(longer.slice(shorter.length));
  }
  function terrainAwarePosition(entity, time){
    const raw = entity.position && entity.position.getValue(time);
    if (!raw || !viewer || !viewer.scene || !viewer.scene.globe) return raw;
    try {
      const carto = Cesium.Cartographic.fromCartesian(raw);
      const terrainH = viewer.scene.globe.getHeight(carto);
      if (!Number.isFinite(terrainH)) return raw;
      return Cesium.Cartesian3.fromRadians(carto.longitude, carto.latitude, terrainH + 4);
    } catch (_) {
      return raw;
    }
  }
  function setLabelPlacement(item, candidate){
    const label = item.entity.label;
    if (!label) return;
    label.pixelOffset = new Cesium.Cartesian2(candidate.x, candidate.y);
    label.horizontalOrigin = candidate.h === 'right'
      ? Cesium.HorizontalOrigin.RIGHT
      : candidate.h === 'center'
        ? Cesium.HorizontalOrigin.CENTER
        : Cesium.HorizontalOrigin.LEFT;
    label.verticalOrigin = Cesium.VerticalOrigin.CENTER;
  }

  let lastLayoutAt = 0;
  function layoutSmartLabels(force){
    if (!viewer || !viewer.scene || !viewer.canvas || !labelItems.length) return;
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (!force && now - lastLayoutAt < 80) return;
    lastLayoutAt = now;

    const canvas = viewer.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const width = canvas.clientWidth || canvasRect.width;
    const height = canvas.clientHeight || canvasRect.height;
    if (!width || !height) return;

    const cameraHeight = Math.max(0, Number(viewer.camera.positionCartographic?.height) || 0);
    const minPriority = minPriorityForHeight(cameraHeight);
    const gap = cameraHeight < 8000 ? 2 : 5;
    const occupied = uiObstacles(canvasRect);
    const acceptedAnchors = [];
    const time = viewer.clock && viewer.clock.currentTime;

    const ordered = labelItems.slice().sort((a, b) => b.priority - a.priority);
    let visibleCount = 0;
    let densityHidden = 0;
    let collisionHidden = 0;
    let duplicateHidden = 0;

    ordered.forEach(item => {
      const label = item.entity.label;
      if (!label) return;
      if (item.priority < minPriority){
        label.show = false;
        densityHidden++;
        return;
      }

      const world = terrainAwarePosition(item.entity, time);
      if (!world){
        label.show = false;
        collisionHidden++;
        return;
      }
      const anchor = Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, world);
      if (!anchor || anchor.x < 0 || anchor.y < 0 || anchor.x > width || anchor.y > height){
        label.show = false;
        collisionHidden++;
        return;
      }

      // 중·광역에서는 거의 같은 점의 상·하위 지명을 동시에 띄우지 않는다.
      if (cameraHeight > 8000 && acceptedAnchors.some(other => {
        if (!samePlaceFamily(item.text, other.text)) return false;
        const dx = anchor.x - other.x, dy = anchor.y - other.y;
        return dx * dx + dy * dy < 24 * 24;
      })){
        label.show = false;
        duplicateHidden++;
        return;
      }

      const size = estimateLabelSize(item);
      let chosen = null;
      for (const candidate of LABEL_CANDIDATES){
        const rect = candidateRect(anchor, candidate, size);
        if (!insideCanvas(rect, width, height, 6)) continue;
        if (occupied.some(o => overlaps(rect, o, gap))) continue;
        chosen = { candidate, rect };
        break;
      }

      if (!chosen){
        label.show = false;
        collisionHidden++;
        return;
      }

      label.show = true;
      setLabelPlacement(item, chosen.candidate);
      occupied.push(chosen.rect);
      acceptedAnchors.push({ x:anchor.x, y:anchor.y, text:item.text });
      visibleCount++;
    });

    window.BibleAtlasLabelDebug = {
      total: labelItems.length,
      visible: visibleCount,
      densityHidden,
      collisionHidden,
      duplicateHidden,
      cameraHeight: Math.round(cameraHeight),
      refresh: () => layoutSmartLabels(true),
    };
  }
  function installSmartLabels(){
    if (!viewer || !viewer.scene || !viewer.scene.postRender) return;
    viewer.scene.postRender.addEventListener(() => layoutSmartLabels(false));
    if (typeof window !== 'undefined'){
      window.addEventListener('resize', () => layoutSmartLabels(true));
    }
    setTimeout(() => layoutSmartLabels(true), 0);
  }

  /* ── 고증 포인트: 신뢰도 등급별 색 ── */
  const GRADE_COLOR = { A: '#9fd38a', B: '#f1d28f', C: '#dda18f' };
  function addSites(){
    SITES.forEach(s => {
      const color = GRADE_COLOR[s.grade || 'B'];
      const text = s.n || s.name;
      const e = add('sites', {
        position: deg(s.lng, s.lat),
        point: {
          pixelSize: 11, color: css(color),
          outlineColor: css('#171310'), outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text,
          font: '700 14px "Noto Sans KR", sans-serif',
          fillColor: css(color), outlineColor: css('#171310'), outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: css('#171310', 0.62),
          backgroundPadding: new Cesium.Cartesian2(5, 3),
          pixelOffset: new Cesium.Cartesian2(12, 0),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(4e5, 1.0, 1.4e6, 0.0),
        },
        description: `<b>${s.name || s.n}</b><br>신뢰도 ${s.grade || 'B'}` +
                     (s.note ? `<br>${s.note}` : ''),
      });
      infoByEntity.set(e, {
        kind:'site', name:s.name || s.n, sub:'고증 포인트',
        grade:s.grade || 'B', note:s.note, lng:s.lng, lat:s.lat,
      });
      registerLabel(e, {
        text,
        kind:'site',
        priority:sitePriority(s),
        fontPx:14,
      });
    });
  }

  /* 산 아이콘 — 외부 파일을 두지 않으려고 SVG 를 data URI 로 담았다.
     빨간 점과 구별되도록 흙빛 삼각 능선에 설선(雪線)을 얹었다. */
  const MOUNTAIN_ICON = 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 18">' +
    '<path d="M1 17 L8 4 L12 10 L15 6 L21 17 Z" fill="#a4744a" stroke="#2a1a0b" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path d="M8 4 L5.4 8.8 L8 7.6 L10.2 8.9 L12 10 L9.8 6.6 Z" fill="#f2ede4"/>' +
    '</svg>');

  /* ── 1세기 핵심 지명: 빨간 점 (산은 산 모양) ── */
  function addKeyPlaces(){
    KEY_PLACES.forEach(p => {
      const text = p.disputed ? p.n + ' *' : p.n;
      // 산은 점이 아니라 산 모양으로 그린다. 도시와 지형을 한눈에 가르기 위해서다.
      const marker = p.mountain
        ? { billboard: {
              image: MOUNTAIN_ICON,
              width: 22, height: 18,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            } }
        : { point: {
              pixelSize: 9, color: css('#e02b23', p.disputed ? 0.72 : 1),
              outlineColor: css('#2a0b08'), outlineWidth: 2,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
            } };
      const e = add('places', {
        position: deg(p.lng, p.lat),
        ...marker,
        label: {
          text,
          font: '600 13px "Noto Sans KR", sans-serif',
          fillColor: css('#ffd9d4'), outlineColor: css('#2a0b08'), outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          showBackground: true,
          backgroundColor: css('#171310', 0.58),
          backgroundPadding: new Cesium.Cartesian2(5, 3),
          pixelOffset: new Cesium.Cartesian2(10, 0),
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          translucencyByDistance: new Cesium.NearFarScalar(4e5, 1.0, 1.4e6, 0.0),
        },
        description: `<b>${p.n}</b><br>${p.r} 권역` +
          (p.pid ? `<br><a href="https://pleiades.stoa.org/places/${p.pid}" target="_blank">Pleiades ${p.pid}</a>` : ''),
      });
      infoByEntity.set(e, {
        kind:'place', name:p.n, sub:`${p.r} 권역`, grade:p.grade,
        refs:p.refs, desc:p.desc, pid:p.pid, disputed:p.disputed,
        lng:p.lng, lat:p.lat,
      });
      registerLabel(e, {
        text,
        kind:'place',
        priority:placePriority(p),
        fontPx:13,
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
          translucencyByDistance: new Cesium.NearFarScalar(6e5, 1.0, 1.8e6, 0.0),
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

  function setVisible(name, on){
    (G[name] || []).forEach(e => { e.show = on; });
    layoutSmartLabels(true);
  }
  function counts(){ const o = {}; Object.keys(G).forEach(k => o[k] = G[k].length); return o; }

  function init(v){
    viewer = v;
    addSites(); addKeyPlaces(); addTerritories(); addRoutes();
    installSmartLabels();
    return counts();
  }

  return {
    init, setVisible, showRoute, counts,
    infoFor(entity){ return (entity && infoByEntity.get(entity)) || null; },
    refreshLabels: () => layoutSmartLabels(true),
    get groups(){ return G; },
  };
})();

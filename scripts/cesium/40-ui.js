/* ══════════════ Cesium 실사 모드 · 전체 UI 연결 ══════════════
   index.html 과 동일한 DOM(레이어 트리·경로 칩·뷰 컨트롤)을 쓰되,
   동작만 Cesium 쪽으로 연결한다. MapLibre 전용 스크립트(21·22·26·27·28·29)는
   불러오지 않는다 — 그 파일들은 map.* 을 직접 호출하기 때문이다.
============================================================================ */
'use strict';

(function () {
  const V = () => window.BibleAtlasCesium && window.BibleAtlasCesium.viewer;
  const $ = id => document.getElementById(id);
  const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };

  /* ── Cesium 화면 전용 정리 ──
     구형 좌하단 정확도 범례와 상단 행정구역 범례는 Cesium UI에서 제거한다. */
  $('accuracyLegend')?.remove();
  $('terrLegend')?.remove();

  /* ── 행정구역 라벨을 레이어 트리로 일원화 ── */
  (function hydrateTerritoryTree(){
    const master = $('treeTerrMaster');
    const details = master && master.closest('details');
    if (!details || typeof TERR === 'undefined') return;
    if (!details.querySelector('.treeMeta')){
      const meta = document.createElement('div');
      meta.className = 'treeMeta';
      meta.textContent = '눅 3:1 · AD 26~36 빌라도 재임기';
      details.querySelector('summary')?.insertAdjacentElement('afterend', meta);
    }
    details.querySelectorAll('.terr-item').forEach(input => {
      const t = TERR.find(item => item.key === input.dataset.key);
      if (!t) return;
      const label = input.closest('label');
      if (!label) return;
      label.querySelector('.terrSwatch')?.remove();
      const swatch = document.createElement('span');
      swatch.className = 'terrSwatch';
      swatch.style.background = t.color;
      input.insertAdjacentElement('afterend', swatch);
      const text = t.key === 'judea'
        ? '유대 · 사마리아 · 이두매 — 로마 총독령(본디오 빌라도)'
        : t.key === 'decapolis'
          ? '데가볼리 — 자치 도시 연맹(수리아 속주 감독)'
          : `${t.name} — ${t.ruler}`;
      [...label.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
      label.appendChild(document.createTextNode(text));
    });
  })();

  /* ── 줌 속도 슬라이더를 레이어 트리 맨 아래에 배치 ── */
  (function ensureZoomSlider(){
    const panel = $('treePanel');
    if (!panel || $('zoomSpeed')) return;
    const row = document.createElement('div');
    row.className = 'rangeRow zoomSpeedRow';
    row.setAttribute('aria-label', '줌 속도 조절');
    row.innerHTML = '<span>줌 속도</span><input type="range" id="zoomSpeed" min="0.5" max="5" step="0.1" value="2.0"><span class="rangeValue" id="zoomSpeedVal">2.0×</span>';
    panel.appendChild(row);
  })();

  /* ── 레이어 트리: 버튼으로 표시/숨김 (기본 숨김) ── */
  (function initTree(){
    const btn = $('treeToggleBtn'), panel = $('treePanel');
    if (!btn || !panel) return;
    const apply = (open) => {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    apply(false);
    btn.addEventListener('click', () => apply(panel.classList.contains('hidden')));
  })();

  /* ── 좌측 패널 접기 ────────────────────────────────────── */
  function bindCollapse(panelId, btnId){
    const panel = $(panelId), btn = $(btnId);
    if (!panel || !btn) return;
    btn.addEventListener('click', () => {
      const collapsed = panel.classList.toggle('collapsed');
      btn.textContent = collapsed ? '▶' : '◀';
      btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      if (panelId === 'hdr') layoutLeftColumn();
    });
  }
  bindCollapse('hdr', 'hdrToggle');
  bindCollapse('realCtl', 'realToggle');

  let realAutoCollapsed = false;
  function layoutLeftColumn(){
    const hdr = $('hdr'), real = $('realCtl'), view = $('viewCtl'),
          profile = $('profilePanel'), realBtn = $('realToggle');
    if (!hdr || !real) return;
    const gap = 10;
    const hdrBottom = hdr.offsetTop + hdr.offsetHeight;
    const floor = hdrBottom + gap;
    const profileH = (profile && profile.classList.contains('open')) ? profile.offsetHeight : 0;
    const base = profileH + 24;

    let viewTop = null;
    if (view){
      view.style.display = '';
      view.style.bottom = base + 'px';
      const ok = view.offsetTop >= floor;
      view.style.display = ok ? '' : 'none';
      if (ok) viewTop = view.offsetTop;
    }

    const top = floor;
    real.style.top = top + 'px';
    const limit = viewTop != null ? viewTop : window.innerHeight - base;
    const avail = limit - top - 12;

    if (avail < 50){ real.style.display = 'none'; return; }
    real.style.display = '';
    real.style.maxHeight = avail + 'px';
    real.style.overflowY = real.scrollHeight > avail ? 'auto' : '';

    if (avail < 130){
      if (!real.classList.contains('collapsed')){
        real.classList.add('collapsed');
        realAutoCollapsed = true;
        if (realBtn){ realBtn.textContent = '▶'; realBtn.setAttribute('aria-expanded', 'false'); }
      }
      return;
    }
    if (realAutoCollapsed && real.classList.contains('collapsed')){
      real.classList.remove('collapsed');
      realAutoCollapsed = false;
      if (realBtn){ realBtn.textContent = '◀'; realBtn.setAttribute('aria-expanded', 'true'); }
    }
  }

  (function watchProfile(){
    const el = $('profilePanel');
    if (!el || typeof MutationObserver === 'undefined') return;
    new MutationObserver(() => layoutLeftColumn())
      .observe(el, { attributes: true, attributeFilter: ['class'] });
  })();
  window.addEventListener('resize', layoutLeftColumn);
  window.addEventListener('bibleatlas-cesium-ready', layoutLeftColumn);
  setTimeout(layoutLeftColumn, 300);

  /* ── 줌 속도: Cesium native zoomFactor + wheel 공통 배율 ── */
  const ZOOM_STORAGE_KEY = 'bibleatlas-cesium-zoom-factor';
  const clampZoom = value => Math.min(5, Math.max(0.5, Number(value) || 2));
  let zoomFactor = 2;
  try { zoomFactor = clampZoom(localStorage.getItem(ZOOM_STORAGE_KEY) ?? 2); } catch (_) {}
  window.BibleAtlasZoomFactor = zoomFactor;

  function applyZoomFactor(value){
    zoomFactor = clampZoom(value);
    window.BibleAtlasZoomFactor = zoomFactor;
    const slider = $('zoomSpeed'), readout = $('zoomSpeedVal');
    if (slider && Number(slider.value) !== zoomFactor) slider.value = String(zoomFactor);
    if (readout) readout.textContent = zoomFactor.toFixed(1) + '×';
    const v = V();
    if (v?.scene?.screenSpaceCameraController){
      v.scene.screenSpaceCameraController.zoomFactor = zoomFactor;
      v.scene.requestRender();
    }
  }
  applyZoomFactor(zoomFactor);
  on('zoomSpeed', 'input', e => {
    const value = clampZoom(e.target.value);
    try { localStorage.setItem(ZOOM_STORAGE_KEY, String(value)); } catch (_) {}
    applyZoomFactor(value);
  });

  /* 기존 cesium.html의 wheel 핸들러보다 먼저 등록되는 capture listener.
     같은 캔버스에서 stopImmediatePropagation()하여 휠/투핑거 줌을 이 값으로 일원화한다. */
  (function bindWheelZoom(){
    const canvas = $('cesiumContainer')?.querySelector('canvas') || $('cesiumContainer');
    if (!canvas) return;
    canvas.addEventListener('wheel', e => {
      const v = V();
      if (!v || !e.deltaY) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const cam = v.camera;
      const carto = Cesium.Cartographic.fromCartesian(cam.positionWC);
      const height = carto ? carto.height : 3000;
      const speedScale = zoomFactor / 5;
      const step = Math.max(12, height * 0.22) * speedScale;
      cam.moveBackward(e.deltaY > 0 ? step : -step);
      v.scene.requestRender();
    }, { passive: false, capture: true });
  })();

  /* ── 레이어 표시 토글 ── */
  const TREE_MAP = [
    ['treePoints', 'sites'],
    ['treeKeyPlaces', 'places'],
    ['treeJesusLines', 'jesus'],
    ['treeJohnLines', 'john'],
  ];
  TREE_MAP.forEach(([id, group]) => {
    on(id, 'change', e => { BibleAtlasLayers.setVisible(group, e.target.checked); V().scene.requestRender(); });
  });
  on('treeBld', 'change', e => BibleAtlasBuildings.setVisible(e.target.checked));
  on('treeExag', 'change', e => {
    const v = V(); if (!v) return;
    v.scene.globe.terrainExaggeration = e.target.checked ? 1.35 : 1.0;
    v.scene.requestRender();
  });

  const roadBoxes = [...document.querySelectorAll('.road-item')];
  function applyRoads(){
    const anyOn = roadBoxes.some(b => b.checked);
    BibleAtlasLayers.setVisible('roads', anyOn);
    V() && V().scene.requestRender();
  }
  roadBoxes.forEach(b => b.addEventListener('change', applyRoads));
  on('treeRoadMaster', 'change', e => {
    roadBoxes.forEach(b => { b.checked = e.target.checked; });
    applyRoads();
  });

  /* ── 분봉왕 행정구역: 레이어 트리에서 개별/전체 제어 ── */
  const terrBoxes = [...document.querySelectorAll('.terr-item')];
  function applyTerritories(){
    const onKeys = new Set(terrBoxes.filter(b => b.checked).map(b => b.dataset.key));
    (BibleAtlasLayers.groups.territories || []).forEach((e, i) => {
      const key = TERR[Math.floor(i / 3)] && TERR[Math.floor(i / 3)].key;
      e.show = onKeys.has(key);
    });
    V() && V().scene.requestRender();
  }
  function syncTerrMaster(){
    const master = $('treeTerrMaster');
    if (master) master.checked = terrBoxes.length > 0 && terrBoxes.every(b => b.checked);
  }
  terrBoxes.forEach(b => b.addEventListener('change', () => {
    applyTerritories();
    syncTerrMaster();
  }));
  on('treeTerrMaster', 'change', e => {
    terrBoxes.forEach(b => { b.checked = e.target.checked; });
    applyTerritories();
  });
  on('terrOpacity', 'input', e => {
    const a = Number(e.target.value) / 100;
    (BibleAtlasLayers.groups.territories || []).forEach((ent, i) => {
      if (i % 3 !== 0) return;
      const t = TERR[Math.floor(i / 3)];
      if (ent.polygon) ent.polygon.material = Cesium.Color.fromCssColorString(t.color).withAlpha(a);
    });
    V() && V().scene.requestRender();
  });

  /* ── 경로 칩: 단면 만들기 ── */
  function setActiveChip(btn){
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }
  document.querySelectorAll('.chip[data-route]').forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveChip(btn);
      const r = BibleAtlasLayers.showRoute(btn.dataset.route);
      if (!r) return;
      buildSection(r.pts, r.name, r.marks);
      const lons = r.pts.map(p => p[0]), lats = r.pts.map(p => p[1]);
      V().camera.flyTo({
        destination: Cesium.Rectangle.fromDegrees(
          Math.min(...lons) - 0.08, Math.min(...lats) - 0.08,
          Math.max(...lons) + 0.08, Math.max(...lats) + 0.08),
        duration: 2.0,
      });
    });
  });

  /* ── 뷰 컨트롤 ── */
  function orbitBy(deg){
    const v = V(); if (!v) return;
    const c = v.scene.globe.pick(v.camera.getPickRay(
      new Cesium.Cartesian2(v.canvas.clientWidth / 2, v.canvas.clientHeight / 2)), v.scene);
    if (!c) return;
    const frame = Cesium.Transforms.eastNorthUpToFixedFrame(c);
    v.camera.lookAtTransform(frame);
    v.camera.rotateLeft(Cesium.Math.toRadians(deg));
    v.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    v.scene.requestRender();
  }
  on('rotL', 'click', () => orbitBy(-20));
  on('rotR', 'click', () => orbitBy(20));

  let orbitTimer = null;
  on('orbit', 'click', () => {
    const btn = $('orbit');
    if (orbitTimer){ clearInterval(orbitTimer); orbitTimer = null; btn.classList.remove('on'); return; }
    btn.classList.add('on');
    orbitTimer = setInterval(() => orbitBy(0.35), 40);
  });

  on('fitAll', 'click', () => {
    V().camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(34.3, 31.0, 36.4, 33.6),
      duration: 2.0,
    });
  });
  on('templeView', 'click', () => window.BibleAtlasCesium.flyTempleToOlivet());

  /* ── 직접 그리기 ── */
  let drawing = false, drawPts = [], drawEntity = null, drawHandler = null;
  function exitDraw(){
    drawing = false;
    $('drawBtn') && $('drawBtn').classList.remove('arming');
    if (drawHandler){ drawHandler.destroy(); drawHandler = null; }
  }
  on('drawBtn', 'click', () => {
    const v = V(); if (!v) return;
    if (drawing){ exitDraw(); return; }
    drawing = true; drawPts = [];
    $('drawBtn').classList.add('arming');
    showToast('지도를 클릭해 점을 찍고, 더블클릭하면 단면을 만듭니다', 4000);
    if (drawEntity){ v.entities.remove(drawEntity); drawEntity = null; }
    drawHandler = new Cesium.ScreenSpaceEventHandler(v.canvas);
    drawHandler.setInputAction((click) => {
      const c = v.scene.pickPosition(click.position) ||
                v.camera.pickEllipsoid(click.position, v.scene.globe.ellipsoid);
      if (!c) return;
      const carto = Cesium.Cartographic.fromCartesian(c);
      drawPts.push([Cesium.Math.toDegrees(carto.longitude), Cesium.Math.toDegrees(carto.latitude)]);
      if (drawEntity) v.entities.remove(drawEntity);
      if (drawPts.length >= 2){
        drawEntity = v.entities.add({ polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(drawPts.flat()),
          width: 5, clampToGround: true,
          material: Cesium.Color.fromCssColorString('#d9a353') } });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    drawHandler.setInputAction(() => {
      if (drawPts.length >= 2){ buildSection(drawPts.slice(), '직접 그린 단면'); }
      else showToast('점을 2개 이상 찍어야 합니다', 2200);
      exitDraw();
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  });

  on('pointHudClose', 'click', () => $('pointHud').classList.remove('show'));

  window.addEventListener('bibleatlas-cesium-ready', () => {
    applyTerritories();
    applyRoads();
    applyZoomFactor(zoomFactor);
    const panel = $('treePanel');
    if (panel && !panel.classList.contains('open')) panel.classList.add('open');
  });
})();
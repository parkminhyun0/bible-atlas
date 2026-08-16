/* ══════════════ Cesium 실사 모드 · 전체 UI 연결 ══════════════
   index.html 과 동일한 DOM(레이어 트리·상단 범례·경로 칩·뷰 컨트롤)을 쓰되,
   동작만 Cesium 쪽으로 연결한다. MapLibre 전용 스크립트(21·22·26·27·28·29)는
   불러오지 않는다 — 그 파일들은 map.* 을 직접 호출하기 때문이다.
============================================================================ */
'use strict';

(function () {
  const V = () => window.BibleAtlasCesium && window.BibleAtlasCesium.viewer;
  const $ = id => document.getElementById(id);
  const on = (id, ev, fn) => { const el = $(id); if (el) el.addEventListener(ev, fn); };

  /* ── 레이어 트리: 버튼으로 표시/숨김 (기본 숨김) ── */
  (function initTree(){
    const btn = $('treeToggleBtn'), panel = $('treePanel');
    if (!btn || !panel) return;
    const apply = (open) => {
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    apply(false);                                    // 기본값: 숨김
    btn.addEventListener('click', () => apply(panel.classList.contains('hidden')));
  })();

  /* ── 좌측 패널 접기 ──────────────────────────────────────
     헤더와 실사 모드 패널은 서로 독립적으로 접힌다.
     styles.css 의 클래스 이름은 'collapsed' 다 — 이전에는 'folded' 를
     토글하고 있어서 헤더 접기 버튼이 아무 반응도 하지 않았다. */
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

  /* 실사 모드 패널을 헤더 '바로 아래'에 붙인다.
     헤더 높이는 본문 길이·창 폭에 따라 달라지므로 실제 높이를 재서 배치하고,
     아래쪽 A·B·C 범례와 겹치지 않도록 남은 높이만큼만 차지하게 한다. */
  let realAutoCollapsed = false;      // 공간 부족으로 자동으로 접었는지
  function layoutLeftColumn(){
    const hdr = $('hdr'), real = $('realCtl'), legend = $('accuracyLegend'),
          view = $('viewCtl'), profile = $('profilePanel'), realBtn = $('realToggle');
    if (!hdr || !real) return;

    /* 좌측 세로 배치
         헤더 → 실사 모드 → (여백) → 뷰 컨트롤 → A·B·C 범례 → 단면 패널
       아래쪽 묶음은 단면 패널이 열린 높이만큼 위로 밀려 올라간다.
       창이 낮아 자리가 모자라면 중요도가 낮은 것부터 숨긴다:
         ① A·B·C 범례(설명) → ② 뷰 컨트롤 → ③ 실사 모드 패널 */
    const gap = 10;
    const hdrBottom = hdr.offsetTop + hdr.offsetHeight;
    const floor = hdrBottom + gap;                 // 이 선보다 위로는 올라갈 수 없다
    const profileH = (profile && profile.classList.contains('open')) ? profile.offsetHeight : 0;
    const base = profileH + 24;

    // ① 범례
    let legendH = 0, legendShown = false;
    if (legend){
      legend.style.display = '';
      legend.style.bottom = base + 'px';
      legendShown = legend.offsetTop >= floor;
      legend.style.display = legendShown ? '' : 'none';
      legendH = legendShown ? legend.offsetHeight + gap : 0;
    }
    // ② 뷰 컨트롤
    let viewTop = null;
    if (view){
      view.style.display = '';
      view.style.bottom = (base + legendH) + 'px';
      const ok = view.offsetTop >= floor;
      view.style.display = ok ? '' : 'none';
      if (ok) viewTop = view.offsetTop;
    }

    // ③ 실사 모드 패널 — 헤더 바로 아래, 남은 공간까지만
    const top = floor;
    real.style.top = top + 'px';
    const limit = viewTop != null ? viewTop
      : (legendShown && legend ? legend.offsetTop : window.innerHeight - base);
    const avail = limit - top - 12;

    if (avail < 50){ real.style.display = 'none'; return; }   // 버튼조차 못 넣을 때
    real.style.display = '';
    real.style.maxHeight = avail + 'px';
    real.style.overflowY = real.scrollHeight > avail ? 'auto' : '';

    if (avail < 130){
      // 접어서 버튼만 남긴다. 공간이 돌아오면 다시 펼친다(직접 접은 경우는 유지).
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

  /* 단면 패널이 열리고 닫힐 때도 좌측 하단 묶음을 다시 배치한다 */
  (function watchProfile(){
    const el = $('profilePanel');
    if (!el || typeof MutationObserver === 'undefined') return;
    new MutationObserver(() => layoutLeftColumn())
      .observe(el, { attributes: true, attributeFilter: ['class'] });
  })();
  window.addEventListener('resize', layoutLeftColumn);
  window.addEventListener('bibleatlas-cesium-ready', layoutLeftColumn);
  setTimeout(layoutLeftColumn, 300);

  /* 상단 분봉왕 범례 접기 */
  on('tlFold', 'click', () => {
    const l = $('terrLegend');
    if (l) l.classList.toggle('folded');
  });

  /* ── 레이어 표시 토글 (트리 체크박스 ↔ Cesium 그룹) ── */
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
    // Cesium 은 지형을 실제 비율로 그린다 — 시각 강화는 지형 과장 배율로 표현
    const v = V(); if (!v) return;
    v.scene.globe.terrainExaggeration = e.target.checked ? 1.35 : 1.0;
    v.scene.requestRender();
  });

  /* 도로: road-item 각각이 ROADS 배열 순서와 대응 */
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

  /* ── 분봉왕 행정구역: 상단 범례 + 트리 ── */
  const terrBoxes = [...document.querySelectorAll('.terr-item')];
  function applyTerritories(){
    // 개별 제어가 필요하므로 그룹 전체가 아니라 엔티티 이름으로 걸러 낸다
    const onKeys = new Set(terrBoxes.filter(b => b.checked).map(b => b.dataset.key));
    (BibleAtlasLayers.groups.territories || []).forEach((e, i) => {
      const key = TERR[Math.floor(i / 3)] && TERR[Math.floor(i / 3)].key;  // 면·선·라벨 3개가 한 조
      e.show = onKeys.has(key);
    });
    V() && V().scene.requestRender();
  }
  terrBoxes.forEach(b => b.addEventListener('change', applyTerritories));
  on('treeTerrMaster', 'change', e => {
    terrBoxes.forEach(b => { b.checked = e.target.checked; });
    applyTerritories();
  });
  on('terrOpacity', 'input', e => {
    const a = Number(e.target.value) / 100;
    (BibleAtlasLayers.groups.territories || []).forEach((ent, i) => {
      if (i % 3 !== 0) return;                         // 면만 대상
      const t = TERR[Math.floor(i / 3)];
      if (ent.polygon) ent.polygon.material = Cesium.Color.fromCssColorString(t.color).withAlpha(a);
    });
    V() && V().scene.requestRender();
  });

  // 상단 범례 항목 생성 (index.html 과 같은 모양)
  const tlItems = $('tlItems'), tlMaster = $('tlMaster');
  if (tlItems && typeof TERR !== 'undefined'){
    TERR.forEach(t => {
      const lab = document.createElement('label');
      lab.className = 'tlItem';
      lab.title = `${t.name} — ${t.ruler}`;
      lab.innerHTML = `<input type="checkbox" checked data-key="${t.key}">` +
        `<span class="swatch" style="background:${t.color}"></span>` +
        `<span class="tlName" style="color:${t.color}">${t.name}<span class="tlRuler">${t.ruler}</span></span>`;
      tlItems.appendChild(lab);
      lab.querySelector('input').addEventListener('change', ev => {
        const tree = document.querySelector(`.terr-item[data-key="${t.key}"]`);
        if (tree){ tree.checked = ev.target.checked; }
        lab.classList.toggle('off', !ev.target.checked);
        applyTerritories();
        if (tlMaster) tlMaster.checked = [...tlItems.querySelectorAll('input')].every(i => i.checked);
      });
    });
    if (tlMaster) tlMaster.addEventListener('change', ev => {
      tlItems.querySelectorAll('input').forEach(i => { i.checked = ev.target.checked; });
      terrBoxes.forEach(b => { b.checked = ev.target.checked; });
      tlItems.querySelectorAll('.tlItem').forEach(l => l.classList.toggle('off', !ev.target.checked));
      applyTerritories();
    });
  }

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

  /* ── 직접 그리기: 클릭으로 점을 찍어 단면 만들기 ── */
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

  /* ── 고증 포인트 HUD 닫기 ── */
  on('pointHudClose', 'click', () => $('pointHud').classList.remove('show'));

  /* ── 초기 상태 맞추기 ── */
  window.addEventListener('bibleatlas-cesium-ready', () => {
    applyTerritories();
    applyRoads();
    const panel = $('treePanel');
    if (panel && !panel.classList.contains('open')) panel.classList.add('open');
  });
})();

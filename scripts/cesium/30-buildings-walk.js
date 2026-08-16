/* ══════════════ Cesium 실사 모드 · 1세기 건축 + 길 따라 이동 ══════════════
   · 건축: scripts/data/20-buildings.js 의 BLD 를 Cesium 돌출 폴리곤으로.
           높이는 지면 기준 상대값(RELATIVE_TO_GROUND)이라 지형을 따라 앉는다.
           MapLibre 의 fill-extrusion 과 같은 데이터를 쓴다.
   · 주행: 선택한 단면 경로를 지면 높이에서 따라 이동. Cesium 은 카메라와
           지형의 충돌을 처리하므로 MapLibre 판에서 겪던 '지형 관통'이 없다.
========================================================================= */
'use strict';

window.BibleAtlasBuildings = (function () {
  let viewer = null, entities = [], added = false;

  const GRADE_TEXT = { A: 'A · 고고학 앵커', B: 'B · 문헌+고고학 근사', C: 'C · 전승/위치 논쟁' };

  function add(v){
    if (added) return 0;
    viewer = v; added = true;
    BLD.forEach(x => {
      const ring = (x.rings && x.rings[0]) || x.poly;
      if (!ring || ring.length < 3) return;
      const positions = Cesium.Cartesian3.fromDegreesArray(ring.flatMap(p => [p[0], p[1]]));
      const base = x.b || 0;
      const top = x.h != null ? x.h : base + 3;
      entities.push(viewer.entities.add({
        name: x.name || '1세기 재구성',
        polygon: {
          hierarchy: new Cesium.PolygonHierarchy(positions),
          perPositionHeight: false,
          height: base,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          extrudedHeight: top,
          extrudedHeightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          material: Cesium.Color.fromCssColorString(x.c || '#c9b995').withAlpha(0.96),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#3b3020').withAlpha(0.55),
          shadows: Cesium.ShadowMode.ENABLED,   // 태양 위치에 따라 그림자를 드리운다
        },
        description:
          `<b>${x.name || '1세기 재구성'}</b><br>` +
          `높이 ${(top - base).toFixed(1)} m · 신뢰도 ${GRADE_TEXT[x.confidence || 'B']}` +
          (x.note ? `<br>${x.note}` : ''),
      }));
    });
    return entities.length;
  }
  function setVisible(on){ entities.forEach(e => { e.show = on; }); if (viewer) viewer.scene.requestRender(); }
  return { add, setVisible, get count(){ return entities.length; } };
})();

/* ── 길 따라 이동 ────────────────────────────────────────────
   단면 경로(currentProfile)를 따라 지면 가까이에서 이동한다.
   MapLibre 판은 pitch 85°가 한계였지만 여기서는 제한이 없다. */
window.BibleAtlasWalk = (function () {
  const EYE_HEIGHT = 12;        // 지면 위 눈높이(m)
  const DURATION_MS = 60000;    // 전체 경로 주행 시간
  let raf = null, running = false, onState = null;

  const bearing = (a, b) => {
    const d = Math.PI / 180;
    const y = Math.sin((b[0] - a[0]) * d) * Math.cos(b[1] * d);
    const x = Math.cos(a[1] * d) * Math.sin(b[1] * d) -
              Math.sin(a[1] * d) * Math.cos(b[1] * d) * Math.cos((b[0] - a[0]) * d);
    return Math.atan2(y, x);
  };

  function stop(){
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (onState) onState(false);
  }

  function start(viewer, profile, stateCb){
    onState = stateCb;
    if (running){ stop(); return false; }
    if (!profile || !profile.samples || profile.samples.length < 2) return false;

    const { samples, elevs } = profile;
    const N = samples.length;
    running = true;
    if (onState) onState(true);

    const t0 = performance.now();
    const frame = (now) => {
      if (!running) return;
      const t = Math.min(1, (now - t0) / DURATION_MS);
      const fi = t * (N - 1);
      const i = Math.max(0, Math.min(N - 2, Math.floor(fi)));
      const f = fi - i;
      const cur = [
        samples[i].lng + (samples[i + 1].lng - samples[i].lng) * f,
        samples[i].lat + (samples[i + 1].lat - samples[i].lat) * f,
      ];
      const aheadIdx = Math.min(N - 1, i + 14);
      const ahead = [samples[aheadIdx].lng, samples[aheadIdx].lat];
      // 지형 고도 — 샘플된 값이 있으면 그것을 쓰고, 없으면 지형에서 직접 읽는다
      let ground = elevs && elevs[i] != null ? elevs[i] : null;
      if (ground == null){
        const c = viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(cur[0], cur[1]));
        ground = c == null ? 0 : c;
      }
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(cur[0], cur[1], ground + EYE_HEIGHT),
        orientation: {
          heading: bearing(cur, ahead),
          pitch: Cesium.Math.toRadians(-2),   // 거의 수평 — 앞의 능선과 하늘이 함께 보인다
          roll: 0,
        },
      });
      if (t >= 1){ stop(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return true;
  }

  return { start, stop, get running(){ return running; } };
})();

/* ══════════════ Cesium 실사 모드 · 고도 단면 ══════════════
   단면 차트(20-profile.js)는 canvas 2D 라 엔진과 무관하다. 여기서는 그 차트가
   필요로 하는 것들만 Cesium 쪽으로 연결한다.

     · currentProfile / secPan   차트가 읽고 쓰는 전역 상태
     · BibleAtlasHooks.hoverPoint  차트 위에 마우스를 올리면 지도에 점 표시
     · buildSection()            경로 → 고도 샘플 → 차트 그리기 + 지구본에 경로 표시
     · showToast / hideToast     진행 안내

   고도값은 scripts/data/10-elevation.js 의 공용 함수를 쓰므로,
   MapLibre 판과 Cesium 판의 단면 수치가 항상 같다.
========================================================================= */
'use strict';

/* 차트가 참조하는 전역 (20-profile.js 안에서 선언하지 않는 것들) */
let currentProfile = null;   // secZoom·secPan 은 20-profile.js 가 선언한다

(function () {
  const viewerOf = () => window.BibleAtlasCesium && window.BibleAtlasCesium.viewer;

  /* ── 지도 위 표시: 단면 경로선과 호버 지점 ── */
  let hoverEntity = null;

  window.BibleAtlasHooks = {
    hoverPoint(lng, lat){
      const viewer = viewerOf();
      if (!viewer) return;
      if (lng == null){
        if (hoverEntity){ hoverEntity.show = false; viewer.scene.requestRender(); }
        return;
      }
      if (!hoverEntity){
        hoverEntity = viewer.entities.add({
          point: {
            pixelSize: 13, color: Cesium.Color.fromCssColorString('#ede4d3'),
            outlineColor: Cesium.Color.fromCssColorString('#d9a353'), outlineWidth: 3,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,   // 지형에 가려도 보이게
          },
        });
      }
      hoverEntity.position = Cesium.Cartesian3.fromDegrees(lng, lat);
      hoverEntity.show = true;
      viewer.scene.requestRender();
    },
  };

  /* ── 안내 토스트 ── */
  let toastEl = null, toastTimer = null;
  function ensureToast(){
    if (toastEl) return toastEl;
    toastEl = document.createElement('div');
    toastEl.id = 'cesiumToast';
    Object.assign(toastEl.style, {
      position: 'absolute', left: '50%', bottom: '270px', transform: 'translateX(-50%)',
      zIndex: 30, background: '#171310ee', border: '1px solid #d9a35355', borderRadius: '10px',
      padding: '8px 14px', fontSize: '.78rem', color: '#ede4d3', display: 'none',
      fontFamily: "'Noto Sans KR', sans-serif",
    });
    document.body.appendChild(toastEl);
    return toastEl;
  }
  window.showToast = function (msg, ms){
    const t = ensureToast();
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(toastTimer);
    if (ms) toastTimer = setTimeout(window.hideToast, ms);
  };
  window.hideToast = function (){ if (toastEl) toastEl.style.display = 'none'; };

  /* ── 단면 만들기 ── */
  window.buildSection = async function (pts, name, marks){
    showToast('고도 데이터를 읽는 중…');
    try{
      const { samples, total } = samplePath(pts, SAMPLE_N);
      const elevs = [];
      for (let i = 0; i < samples.length; i += 24){
        const chunk = samples.slice(i, i + 24);
        elevs.push(...await Promise.all(chunk.map(s => elevationAt(s.lng, s.lat))));
      }
      // 주요 지점은 지점 좌표에서 직접 재서 지도 라벨과 수치를 맞춘다
      const mk = await Promise.all((marks || []).map(async m => {
        let best = 0, bd = Infinity;
        samples.forEach((s, i) => {
          const d = (s.lng - m.lng) ** 2 + (s.lat - m.lat) ** 2;
          if (d < bd){ bd = d; best = i; }
        });
        let e;
        try{ e = await elevationAt(m.lng, m.lat); }catch(_){ e = elevs[best]; }
        return { n: m.n || m.name, i: best, e, grade: m.grade || 'B' };
      }));
      mk.sort((a, b) => a.i - b.i);
      secZoom = 1; secPan = 0;
      currentProfile = { samples, elevs, total, name, marks: mk };
      drawProfile();
      hideToast();
    }catch(err){
      showToast('고도 타일을 불러오지 못했습니다 — 네트워크 확인 후 다시 시도해 주세요.', 3500);
      console.error(err);
    }
  };

  /* 차트 닫기 버튼 */
  document.addEventListener('DOMContentLoaded', () => {
    const close = document.getElementById('closeProfile');
    if (close) close.addEventListener('click', () => {
      document.getElementById('profilePanel').classList.remove('open');
      BibleAtlasHooks.hoverPoint(null);
      document.querySelectorAll('[data-route]').forEach(b => b.classList.remove('on'));
    });
  });
})();

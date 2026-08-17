/* ══════════════ AD 30 헤롯 성전산 — 실제 3D 모델 로더 ══════════════
   기획서 §10.1. 돌출 폴리곤 대신 glTF 메시를 지도 위에 앉힌다.

   지오메트리 출처 openbibleinfo/3D-Temple-Mount (MIT)
     tools/herod-temple/export-glb.cjs 로 GLB 로 변환했다.
     빌더의 로컬 프레임: 원점 = 성전산 대지 북서 모서리, +X 동, +Z 남, +Y 위 (m)

   세계좌표 정합 tools/herod-temple/solve-alignment.cjs
     현존 고고학 지점(남서 모서리·로빈슨 아치·동벽 이음매)을 control point 로
     삼아 2D Procrustes 로 회전·평행이동만 풀었다(축척 1.000 고정).
     결과는 data/herod-temple/spec/world_alignment.json 에 있고, 이 파일이 SSOT 다.

   ── 아직 잠정인 것 ──────────────────────────────────────────────
   수평: RMS 3.1 m. 기획서 목표(1 m)는 측량 등급 좌표를 전제하는데, 현재 앵커는
         OSM 점이라 자체 정밀도가 수 m 다. 그래서 상태는 alignment-provisional.
   수직: 역사 기준면을 아직 확정하지 못했다. 당분간 현대 지형에서 이방인의 뜰
         높이를 표본해 얹는다. 기획서 §5 의 terrain clipping 은 다음 단계다.
   ================================================================= */
'use strict';

window.BibleAtlasTempleModel = (function () {
  /* 정합 solver 의 출력. 네트워크가 막히거나 파일이 없을 때 쓰는 대비값이며,
     실행 시에는 world_alignment.json 을 읽어 이 값을 덮어쓴다. */
  const FALLBACK = {
    origin_lat: 31.78004,
    origin_lng: 35.233962,
    model_south_axis_azimuth_deg: 172.26,
  };
  const GLB_URL = './assets/herod-temple/ad30/lod1.glb';
  const ALIGN_URL = './data/herod-temple/spec/world_alignment.json';

  let viewer = null, model = null, align = null, loading = null;

  /* 모델 Y=0(이방인의 뜰 포장면)을 놓을 절대 높이.
     역사 기준면이 확정되기 전까지는 현대 지형의 대지 표고를 쓴다. */
  async function esplanadeHeight(lng, lat){
    try {
      const carto = Cesium.Cartographic.fromDegrees(lng, lat);
      const [s] = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [carto]);
      if (s && Number.isFinite(s.height)) return s.height;
    } catch (e) { /* 지형 표본에 실패하면 아래 값으로 */ }
    return 738;   // 성전산 상면 대략치(m). 표본 실패 시에만 쓴다.
  }

  async function loadAlignment(){
    try {
      const r = await fetch(ALIGN_URL, { cache:'no-cache' });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      if (j && j.solution && Number.isFinite(j.solution.origin_lat)) {
        return { ...j.solution, status:j.status, rms:j.rms_horizontal_m };
      }
    } catch (e) {
      console.warn('[헤롯 성전] world_alignment.json 을 읽지 못해 내장값을 씁니다:', e.message);
    }
    return { ...FALLBACK, status:'fallback', rms:null };
  }

  /* 모델 로컬 프레임 → 지구 고정 좌표.
     Cesium 은 glTF 를 읽을 때 up 축(Y)뿐 아니라 forward 축(기본 Z)도 자기 규약
     (Z-up · X-forward)으로 돌린다. 그 forward 변환이 90° 를 더 얹어서, 아무 설정
     없이 heading 만 주면 모델이 90° 돌아간 자리에 앉는다(실측 확인).
     그래서 아래 load() 에서 forwardAxis 를 X 로 못박아 그 변환을 없앤다.
     그러면 heading 0 일 때 모델 +Z 가 정남이 되고, 실제 축 방위와의 차이만
     heading 으로 주면 된다. */
  function buildMatrix(a, height){
    const origin = Cesium.Cartesian3.fromDegrees(a.origin_lng, a.origin_lat, height);
    const heading = Cesium.Math.toRadians(a.model_south_axis_azimuth_deg - 180);
    const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
    return Cesium.Transforms.headingPitchRollToFixedFrame(origin, hpr);
  }

  async function load(v){
    if (model) return model;
    if (loading) return loading;
    viewer = v;
    loading = (async () => {
      align = await loadAlignment();
      const h = await esplanadeHeight(align.origin_lng, align.origin_lat);
      const m = await Cesium.Model.fromGltfAsync({
        url: GLB_URL,
        modelMatrix: buildMatrix(align, h),
        scale: 1.0,                       // 축척은 절대 건드리지 않는다(기획서 §4.3)
        upAxis: Cesium.Axis.Y,            // 빌더 프레임: Y 가 위
        forwardAxis: Cesium.Axis.X,       // 숨은 90° 회전을 없앤다 (위 주석 참조)
        shadows: Cesium.ShadowMode.ENABLED,
        backFaceCulling: true,
        // 정점에 구워진 음영(COLOR_0)이 살아 있도록 기본 조명만 쓴다
        imageBasedLighting: undefined,
      });
      model = viewer.scene.primitives.add(m);
      model.readyEvent.addEventListener(() => {
        hideLegacyTemple(true);
        console.log('[헤롯 성전] 모델 로드 완료 ·', align.status,
                    align.rms != null ? `· 수평 RMS ${align.rms} m` : '');
        viewer.scene.requestRender();
      });
      return model;
    })();
    return loading;
  }

  /* 기존 돌출 폴리곤 성전(scripts/data/15-temple.js)을 렌더에서 뺀다.
     기획서 §17 — 코드는 비교·검증용으로 남기되 최종 화면에는 쓰지 않는다.
     삭제가 아니라 show 만 내리므로 legacy 모드로 되돌릴 수 있다. */
  function hideLegacyTemple(hide){
    if (typeof TEMPLE_BLD === 'undefined' || !viewer) return 0;
    const names = new Set(TEMPLE_BLD.map(b => b.name));
    let n = 0;
    viewer.entities.values.forEach(e => {
      if (e.polygon && names.has(e.name)){ e.show = !hide; n++; }
    });
    if (n) viewer.scene.requestRender();
    return n;
  }

  function setVisible(on){
    if (model) model.show = !!on;
    hideLegacyTemple(!!on);          // 모델을 끄면 기존 상자형이 다시 보인다
  }
  function isLoaded(){ return !!model; }
  function alignment(){ return align; }
  /* 모델의 대지 중앙을 바라보는 카메라 — 기획서 §13 의 preset 기반 */
  function flyTo(preset){
    if (!viewer || !align) return;
    const P = {
      olivet:  { lng:35.2430, lat:31.7785, h:820,  heading:268, pitch:-14 },
      southwest:{ lng:35.2325, lat:31.7735, h:430, heading:38,  pitch:-16 },
      aerial:  { lng:35.2360, lat:31.7735, h:900,  heading:0,   pitch:-38 },
      top:     { lng:35.2360, lat:31.7783, h:1100, heading:0,   pitch:-90 },
    }[preset] || {};
    if (!P.lng) return;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(P.lng, P.lat, P.h),
      orientation: { heading: Cesium.Math.toRadians(P.heading),
                     pitch: Cesium.Math.toRadians(P.pitch), roll: 0 },
      duration: 2.0,
    });
  }

  return { load, setVisible, isLoaded, alignment, flyTo, hideLegacyTemple,
           get model(){ return model; } };
})();

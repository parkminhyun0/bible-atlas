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
         높이를 표본해 얹는다. 성전 주변은 vendor groundLevel() 역사 지형을
         함께 렌더하고, 같은 영역의 현대 DEM을 클리핑한다.
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
  /* GLB 도 같은 이유로 버전을 붙인다. 모델을 다시 구우면 이 값을 올린다. */
  const GLB_VERSION = '20260824a';
  /* lod1.glb 를 쓰지 않는다. 그 파일은 1인칭 순례 화면(temple-experience.html)
     과 공유하는데, 그쪽은 doorCourt_*·veilOuter·sanct 같은 노드 이름으로
     상호작용을 건다. 성역을 도려내면 그 화면이 깨진다(실제로 한 번 깼다).
     그래서 도려낸 판은 별도 파일로 굽는다:
       node tools/herod-temple/export-glb.cjs --carve-precinct \
            --out assets/herod-temple/ad30/mount-outer.glb */
  const GLB_URL = './assets/herod-temple/ad30/mount-outer.glb?v=' + GLB_VERSION;
  /* 성역 안쪽은 별도 GLB 다.
     2026-08-24 조사(data/herod-temple/03_모델_비교_이방인의_뜰.md) 결론:
     이방인의 뜰은 상류(openbibleinfo)가, 성역 안쪽은 새 모델이 낫다. 그래서
     mount-outer 는 성역 자리를 비운 채 굽고(export-glb.cjs --carve-precinct),
     그 자리를 interior-v2 가 채운다. 두 모델은 같은 로컬 프레임을 쓰므로 modelMatrix 가
     같다 — 따로 정합할 것이 없다. */
  const INTERIOR_URL = './assets/herod-temple/ad30/interior-v2.glb?v=' + GLB_VERSION;
  const ALIGN_URL = './data/herod-temple/spec/world_alignment.json';

  let viewer = null, model = null, interior = null, align = null, loading = null;

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
        // 스크린샷에서 포장면을 덮은 검은 얼룩은 모델의 강한 투영 그림자였다.
        // 모델은 빛을 받되 포장면에 진한 그림자를 다시 투영하지 않는다.
        shadows: Cesium.ShadowMode.RECEIVE_ONLY,
        backFaceCulling: true,
        // 정점에 구워진 음영(COLOR_0)이 살아 있도록 기본 조명만 쓴다
        imageBasedLighting: undefined,
      });
      model = viewer.scene.primitives.add(m);
      applyAmbient(model);
      /* 성역 안쪽. 같은 행렬·같은 축 설정으로 올린다. 여기서 값을 다시 쓰면
         한쪽만 고쳐지는 사고가 난다. */
      const inner = await Cesium.Model.fromGltfAsync({
        url: INTERIOR_URL,
        modelMatrix: buildMatrix(align, h),
        scale: 1.0,
        upAxis: Cesium.Axis.Y,
        forwardAxis: Cesium.Axis.X,
        shadows: Cesium.ShadowMode.RECEIVE_ONLY,
        backFaceCulling: true,
        imageBasedLighting: undefined,
      });
      interior = viewer.scene.primitives.add(inner);
      applyAmbient(interior);
      interior.readyEvent.addEventListener(() => {
        console.log('[헤롯 성전] 성역 내부 로드 완료');
        viewer.scene.requestRender();
      });
      model.readyEvent.addEventListener(() => {
        hideLegacyTemple(true);
        applyTerrainClipping(true);
        console.log('[헤롯 성전] 모델 로드 완료 ·', align.status,
                    align.rms != null ? `· 수평 RMS ${align.rms} m` : '');
        viewer.scene.requestRender();
      });
      return model;
    })();
    return loading;
  }

  /* ── 현대 지형을 성전산 안쪽에서 잘라 낸다 (기획서 §5.2) ─────────────
     현대 하람 알샤리프 상면은 고대 이방인의 뜰 포장면과 같지 않다. 실측해 보니
     대지 안 표본 108곳 중 18곳에서 현대 지형이 고대 포장면보다 높았고, 최대
     4.5 m 까지 솟았다. 그 부분이 포장면을 뚫고 올라와 황토색 얼룩으로 보인다.
     그래서 대지 범위 안의 현대 지형을 잘라 내고 그 자리를 모델이 채우게 한다.
     모델의 옹벽이 포장면 아래로 57 m 내려가므로 잘라 낸 구멍은 벽이 가린다. */
  /* 로컬 좌표를 세계 좌표로 옮길 때는 변환식을 손으로 다시 쓰지 않는다.
     모델이 실제로 쓰는 행렬을 그대로 쓴다. 직접 쓴 식은 부호를 틀리기 쉽고
     (실제로 한 번 틀려서 발자국이 남쪽에서 130 m 어긋났다), 두 벌을 두면
     한쪽만 고쳐지는 사고가 난다. */
  function localToCartesian(x, y, z){
    const full = Cesium.Matrix4.multiplyTransformation(
      model.modelMatrix, Cesium.Axis.Y_UP_TO_Z_UP, new Cesium.Matrix4());
    return Cesium.Matrix4.multiplyByPoint(full, new Cesium.Cartesian3(x, y, z), new Cesium.Cartesian3());
  }

  function templeFootprint(){
    /* 빌더의 대지 네 모서리(로컬 X 동 · Z 남). 잘린 경계가 옹벽 밑에 숨도록
       중심에서 바깥으로 6 m 넓힌다. */
    const CORNERS = [[0, 0], [313.9, 26], [280, 485], [0, 485]];
    const cx = 148.5, cz = 254.0;                    // 대략적인 대지 중심
    const OUT = 6;
    return CORNERS.map(([x, z]) => {
      const L = Math.hypot(x - cx, z - cz) || 1;
      const px = x + (x - cx) / L * OUT, pz = z + (z - cz) / L * OUT;
      const c = Cesium.Cartographic.fromCartesian(localToCartesian(px, 0, pz));
      return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude)];
    });
  }

  /* export-glb.cjs 의 검증된 로컬 bounds와 같은 영역. vendor groundLevel()
     역사 지형이 외곽 옹벽·계단·접속부 아래를 채우므로, 이 직사각형 안의
     현대 DEM만 잘라 두 지표면이 충돌하지 않게 한다. */
  function historicTerrainFootprint(){
    /* GLB 역사 지형은 [-66,372]×[-108,606] m 직사각형으로 정확히
       생성된다. 경계 이음새를 숨기는 1 m 지형 여유만 남기고 내부의
       현대 DEM을 잘라 위성 지형과 역사 지형이 섞이지 않게 한다. */
    return [[-65, -107], [371, -107], [371, 605], [-65, 605]].map(([x, z]) => {
      const c = Cesium.Cartographic.fromCartesian(localToCartesian(x, 0, z));
      return [Cesium.Math.toDegrees(c.longitude), Cesium.Math.toDegrees(c.latitude)];
    });
  }

  let clipping = null;
  function applyTerrainClipping(on){
    if (!viewer || !align) return false;
    if (typeof Cesium.ClippingPolygonCollection === 'undefined') return false;  // 구버전 대비
    if (!on){ if (clipping) clipping.enabled = false; return true; }
    if (!clipping){
      const ring = historicTerrainFootprint();
      clipping = new Cesium.ClippingPolygonCollection({
        polygons: [ new Cesium.ClippingPolygon({
          positions: Cesium.Cartesian3.fromDegreesArray(ring.flat()) }) ],
      });
      viewer.scene.globe.clippingPolygons = clipping;
    }
    clipping.enabled = true;
    viewer.scene.requestRender();
    return true;
  }

  /* ── 환경광 (기획서 §7 · 언리얼의 SkyLight 에 해당) ──────────────────
     Cesium 은 모델에 구면조화 계수를 주지 않으면 환경광이 사실상 없다.
     그러면 직사광이 닿지 않는 면이 새까맣게 죽어, 같은 모델인데도 언리얼보다
     훨씬 거칠어 보인다. 하늘빛 환경광을 넣어 그늘을 열어 준다. */
  function applyAmbient(model){
    const C = Cesium.Cartesian3;
    const ibl = model.imageBasedLighting;
    if (!ibl) return;
    ibl.imageBasedLightingFactor = new Cesium.Cartesian2(1, 1);
    ibl.sphericalHarmonicCoefficients = [
      new C(0.62, 0.62, 0.68),   // L00  하늘 전반의 밝기
      new C(0.00, 0.00, 0.00), new C(0.16, 0.16, 0.19), new C(0.00, 0.00, 0.00),
      new C(0.00, 0.00, 0.00), new C(0.00, 0.00, 0.00),
      new C(0.05, 0.05, 0.05), new C(0.00, 0.00, 0.00), new C(0.00, 0.00, 0.00),
    ];
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
    if (interior) interior.show = !!on;
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
           applyTerrainClipping, templeFootprint, historicTerrainFootprint,
           get model(){ return model; }, get interior(){ return interior; } };
})();

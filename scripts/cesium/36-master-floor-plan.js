/* ══════════════ STEP 02 · Master Floor Plan v0.1 debug overlay ══════════════
   Normal cesium.html is unchanged. Add ?floorplan=1 to verify the dimension-locked
   architectural plan against the exact same modelMatrix used by the GLB.
   The overlay NEVER solves its own lat/lng and NEVER nudges to imagery.
   =========================================================================== */
'use strict';

window.BibleAtlasMasterFloorPlan = (function(){
  const PLAN_URL = './data/herod-temple/spec/master_floor_plan_v0_1.json';
  let viewer = null, plan = null, entities = [], loading = null, shown = false;

  async function loadPlan(){
    if (plan) return plan;
    const r = await fetch(PLAN_URL, { cache:'no-cache' });
    if (!r.ok) throw new Error(`master floor plan ${r.status}`);
    plan = await r.json();
    return plan;
  }

  function levelFor(id){
    const L = plan.levels;
    if (id === 'COURT_OF_WOMEN' || id.startsWith('WOMEN_CHAMBER')) return L.court_of_women_m + 0.25;
    if (id === 'COURT_OF_ISRAEL') return L.court_of_israel_m + 0.25;
    if (id === 'COURT_OF_PRIESTS' || id.startsWith('ALTAR') || id === 'ALTAR_TO_PORCH_CLEAR_ZONE')
      return L.court_of_priests_m + 0.25;
    if (id.startsWith('SANCTUARY') || id.startsWith('ULAM') || id === 'HOLY_OF_HOLIES_INTERIOR')
      return L.sanctuary_floor_m + 0.25;
    return 0.35;
  }

  function archToSite(X, Y){
    const H = plan.frames.architectural_H0;
    const e = H.basis_in_site_xz.east, n = H.basis_in_site_xz.north;
    return [
      H.site_model_xz_m[0] + e[0] * X + n[0] * Y,
      H.site_model_xz_m[1] + e[1] * X + n[1] * Y,
    ];
  }

  function toCartesian(X, Y, up){
    const p = archToSite(X, Y);
    return BibleAtlasTempleModel.localToCartesian(p[0], up || 0, p[1]);
  }

  function addLine(id, points, color, width, up, dashed){
    const material = color.withAlpha(0.95);
    const e = viewer.entities.add({
      id:'master-plan-' + id,
      polyline:{
        positions:points.map(p => toCartesian(p[0], p[1], up)),
        width:width || 2,
        material,
        depthFailMaterial:material,
        clampToGround:false,
        arcType:Cesium.ArcType.NONE,
      }
    });
    e.masterPlanDashed = !!dashed;
    entities.push(e);
  }

  function closeRing(poly){ return poly.concat([poly[0]]); }
  function rectRing(r){
    return [[r.xmin,r.ymin],[r.xmax,r.ymin],[r.xmax,r.ymax],[r.xmin,r.ymax],[r.xmin,r.ymin]];
  }

  function addLabel(id, text, X, Y, up, color){
    const e = viewer.entities.add({
      id:'master-plan-label-' + id,
      position:toCartesian(X,Y,up),
      label:{
        text, font:'12px sans-serif',
        fillColor:color || Cesium.Color.WHITE,
        outlineColor:Cesium.Color.BLACK, outlineWidth:3,
        style:Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset:new Cesium.Cartesian2(0,-10),
        disableDepthTestDistance:Number.POSITIVE_INFINITY,
        showBackground:true,
        backgroundColor:Cesium.Color.BLACK.withAlpha(0.55),
        scale:0.9
      }
    });
    entities.push(e);
  }

  async function show(v){
    if (shown) return true;
    if (loading) return loading;
    viewer = v;
    loading = (async()=>{
      await loadPlan();
      await BibleAtlasTempleModel.load(viewer);
      if (typeof BibleAtlasTempleModel.localToCartesian !== 'function')
        throw new Error('Temple model localToCartesian API missing');

      const C = Cesium.Color;
      addLine('outer-platform', closeRing(plan.outer_platform.polygon_H0_m), C.GOLD, 3, 0.4);
      addLine('500-square', closeRing(plan.pre_herodian_500_cubit_square.polygon_H0_m), C.DODGERBLUE, 2, 0.55, true);

      const wanted = new Set([
        'AZARAH_INNER_COURT','COURT_OF_WOMEN',
        'WOMEN_CHAMBER_NE_WOOD','WOMEN_CHAMBER_SE_NAZIRITES',
        'WOMEN_CHAMBER_NW_LEPERS','WOMEN_CHAMBER_SW_OIL',
        'COURT_OF_ISRAEL','COURT_OF_PRIESTS',
        'ALTAR_MID_BASE','ALTAR_RAMP_MID',
        'ULAM_FRONT_100C','SANCTUARY_BODY_70C','HOLY_OF_HOLIES_INTERIOR'
      ]);
      for (const f of plan.features){
        if (!wanted.has(f.id) || f.geometry !== 'rect') continue;
        const color = f.id.startsWith('ALTAR') ? C.ORANGE :
                      f.id === 'HOLY_OF_HOLIES_INTERIOR' ? C.RED :
                      f.id.startsWith('SANCTUARY') || f.id.startsWith('ULAM') ? C.YELLOW :
                      f.id === 'COURT_OF_WOMEN' ? C.CYAN : C.LIME;
        addLine(f.id, rectRing(f.rect_m), color,
                f.id === 'HOLY_OF_HOLIES_INTERIOR' ? 4 : 2, levelFor(f.id));
      }

      addLine('altar-josephus-conflict',
        rectRing({xmin:45.15,xmax:71.4,ymin:-13.125,ymax:13.125}),
        C.MAGENTA, 2, plan.levels.court_of_priests_m + 0.45, true);

      const hz = plan.levels.sanctuary_floor_m + 0.8;
      addLine('axis-x',[[-30,0],[165,0]],C.RED,2,hz);
      addLine('axis-y',[[0,-45],[0,45]],C.RED,2,hz);
      const h0 = viewer.entities.add({
        id:'master-plan-H0',
        position:toCartesian(0,0,hz),
        point:{pixelSize:10,color:C.RED,outlineColor:C.WHITE,outlineWidth:2,
               disableDepthTestDistance:Number.POSITIVE_INFINITY},
        label:{text:'H0 · 지성소 중심',font:'13px sans-serif',fillColor:C.WHITE,
               outlineColor:C.BLACK,outlineWidth:3,style:Cesium.LabelStyle.FILL_AND_OUTLINE,
               pixelOffset:new Cesium.Cartesian2(10,-14),
               disableDepthTestDistance:Number.POSITIVE_INFINITY}
      });
      entities.push(h0);

      addLabel('warning',
        `Master Floor Plan v0.1 · local 1:1\nworld alignment provisional · RMS ${plan.world_placement.current_horizontal_rms_m} m`,
        0, 48, hz, C.YELLOW);

      shown = true;
      viewer.scene.requestRender();
      console.log('[STEP02] Master Floor Plan v0.1 overlay ON', {
        H0:plan.world_placement.derived_H0_wgs84,
        rms:plan.world_placement.current_horizontal_rms_m
      });
      return true;
    })();
    try { return await loading; }
    finally { loading = null; }
  }

  function hide(){
    if (!viewer) return;
    for (const e of entities) viewer.entities.remove(e);
    entities = [];
    shown = false;
    viewer.scene.requestRender();
  }

  function toggle(v){
    return shown ? (hide(), Promise.resolve(false)) : show(v).then(()=>true);
  }

  function isShown(){ return shown; }
  return { show, hide, toggle, isShown, loadPlan, get plan(){return plan;} };
})();

window.addEventListener('bibleatlas-cesium-ready', () => {
  const q = new URLSearchParams(location.search);
  if (q.get('floorplan') !== '1') return;
  const viewer = window.BibleAtlasCesium && window.BibleAtlasCesium.viewer;
  if (!viewer) return;
  BibleAtlasMasterFloorPlan.show(viewer).catch(e =>
    console.error('[STEP02] floor plan overlay failed:', e));
});

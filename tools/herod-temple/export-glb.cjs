#!/usr/bin/env node
/* 헤롯 성전산 geometry → glTF 2.0 (.glb)  — 기획서 §6

   openbibleinfo/3D-Temple-Mount (MIT) 의 지오메트리 빌더를 Node 에서 그대로
   실행해 정점 버퍼를 얻고, 그것을 Cesium 이 읽는 GLB 로 직렬화한다.
   빌더는 DOM 을 쓰지 않으므로(상류 util/verify.js 와 같은 방식) 브라우저가 필요 없다.

   정점 배치는 상류 60-gl.js 의 attribute pointer 와 같다 — stride 36 B:
     0  position (3f)   12 normal (3f)   24 uv (2f)   32 ao (1f)
   ao 는 상류가 정점에 구워 둔 음영이다. glTF 의 COLOR_0 으로 옮겨
   baseColor 에 곱해지게 한다. 텍스처 없이도 형태가 읽히는 이유가 이것이다.

   실행:  node tools/herod-temple/export-glb.cjs [--out <경로>] [--layers a,b,c]
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };

/* 상류 소스 위치 — vendor 로 들여오기 전에는 환경변수/인자로 받는다 */
const SRC = arg('--src', process.env.OBI_SRC || path.join(ROOT, 'vendor/3d-temple-mount/src'));
const OUT = arg('--out', path.join(ROOT, 'assets/herod-temple/ad30/lod1.glb'));

/* 담을 레이어 — 주변 현대 지형(city)과 군중(people), 디버그용(grid/overlay/nodraw)은 뺀다.
   지형은 Cesium 의 실제 DEM 이 담당하고, 군중은 라이선스·성능 문제를 따로 검토한다. */
const LAYERS = arg('--layers', 'base,sanct,roofs,interior').split(',');

/* 뺄 재질 — 상류 렌더러가 쓰던 보조 요소다. Cesium 에서는 해가 되므로 버린다.
     shadow  바닥에 깔아 둔 '가짜 그림자' 판. Cesium 은 실제 그림자를 계산하므로
             이게 남으면 포장면에 검은 얼룩으로 겹쳐 보인다(실측 확인).
     marker  디버그용 표식
     fire    번제단 불꽃 — 정지된 판이라 3D 로는 어색하다 */
const DROP_MATERIALS = arg('--drop-materials', 'shadow,marker,fire').split(',').filter(Boolean);

/* ── 재질 → PBR ────────────────────────────────────────────────────
   색·거칠기는 data/herod-temple/spec/temple_spec.json 의 materials 를 기준으로 하고,
   그 표에 없는 것은 같은 계열로 채운다. 텍스처는 아직 넣지 않는다(기획서 §7 P2). */
const MAT = {
  ashlar:      { c:[0.847,0.804,0.706], r:0.92, m:0 },   // 헤롯식 애슐러
  ashlarFine:  { c:[0.914,0.886,0.812], r:0.85, m:0 },
  ashlarWhite: { c:[0.949,0.941,0.918], r:0.80, m:0 },
  marble:      { c:[0.949,0.941,0.918], r:0.35, m:0 },   // 흰 대리석 기둥
  marbleFloor: { c:[0.898,0.878,0.831], r:0.30, m:0 },
  paving:      { c:[0.788,0.749,0.667], r:0.90, m:0 },
  plaster:     { c:[0.929,0.910,0.859], r:0.95, m:0 },
  rock:        { c:[0.702,0.659,0.576], r:1.00, m:0 },
  gold:        { c:[0.831,0.686,0.216], r:0.25, m:1 },   // 금판
  bronze:      { c:[0.549,0.420,0.243], r:0.40, m:1 },   // 고린도 청동
  cedar:       { c:[0.545,0.353,0.169], r:0.70, m:0 },
  roof:        { c:[0.545,0.353,0.169], r:0.70, m:0 },
  roofTile:    { c:[0.549,0.286,0.216], r:0.80, m:0 },   // 테라코타
  lattice:     { c:[0.835,0.784,0.651], r:0.85, m:0 },
  veil:        { c:[0.478,0.196,0.239], r:0.90, m:0 },
  linen:       { c:[0.929,0.910,0.867], r:0.95, m:0 },
  water:       { c:[0.310,0.427,0.451], r:0.15, m:0 },
  fire:        { c:[0.949,0.612,0.216], r:1.00, m:0 },
  terrain:     { c:[0.761,0.706,0.596], r:1.00, m:0 },
  skin:        { c:[0.780,0.616,0.494], r:0.85, m:0 },
  clothA:      { c:[0.855,0.827,0.769], r:0.90, m:0 },
  clothB:      { c:[0.694,0.639,0.549], r:0.90, m:0 },
  clothC:      { c:[0.588,0.529,0.478], r:0.90, m:0 },
  clothD:      { c:[0.451,0.416,0.396], r:0.90, m:0 },
  shadow:      { c:[0.200,0.180,0.150], r:1.00, m:0 },
  marker:      { c:[0.850,0.300,0.300], r:1.00, m:0 },
};
const fallback = { c:[0.85,0.82,0.75], r:0.9, m:0 };

/* ── 빌더 실행 ─────────────────────────────────────────────────── */
function buildScene(){
  const files = ['10-math.js','20-textures.js','30-geom.js','40-data.js',
                 '50-build-mount.js','55-build-temple.js'];
  const missing = files.filter(f => !fs.existsSync(path.join(SRC, f)));
  if (missing.length){
    console.error(`상류 소스를 찾지 못했습니다: ${SRC}`);
    console.error(`  없는 파일: ${missing.join(', ')}`);
    console.error(`  git clone https://github.com/openbibleinfo/3D-Temple-Mount 후`);
    console.error(`  --src <그 저장소>/src 로 지정하거나 OBI_SRC 환경변수를 쓰세요.`);
    process.exit(2);
  }
  const code = files.map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  const ctx = { console:{ log(){}, warn(){}, error(){} },
                document:{ createElement(){ throw new Error('no canvas needed'); } },
                performance:{ now:()=>0 }, navigator:{} };
  vm.createContext(ctx);
  vm.runInContext(code + '\n;globalThis.__scene = buildScene();' +
                  'globalThis.__X = { CUBIT, PLAT, LEV };', ctx);
  return { scene: ctx.__scene, X: ctx.__X };
}

/* ── glTF 조립 ─────────────────────────────────────────────────── */
const chunks = [];             // 바이너리 조각
let byteLength = 0;
function pushBuffer(view){
  const pad = (4 - (view.byteLength % 4)) % 4;
  const off = byteLength;
  chunks.push(Buffer.from(view.buffer, view.byteOffset, view.byteLength));
  byteLength += view.byteLength;
  if (pad){ chunks.push(Buffer.alloc(pad)); byteLength += pad; }
  return { off, len: view.byteLength };
}

function main(){
  const { scene, X } = buildScene();
  const V = scene.vertices, I = scene.indices, S = 9;   // stride(float)

  const gltf = { asset:{ version:'2.0',
                   generator:'bible-atlas tools/herod-temple/export-glb.cjs',
                   copyright:'Geometry: openbibleinfo/3D-Temple-Mount (MIT). ' +
                             'Reconstruction after Middot, Josephus, Ritmeyer.' },
                 scene:0, scenes:[{ nodes:[] }], nodes:[], meshes:[],
                 materials:[], accessors:[], bufferViews:[], buffers:[] };
  const matIndex = new Map();
  const materialFor = (name) => {
    if (matIndex.has(name)) return matIndex.get(name);
    const m = MAT[name] || fallback;
    gltf.materials.push({ name,
      pbrMetallicRoughness:{ baseColorFactor:[...m.c, 1], metallicFactor:m.m, roughnessFactor:m.r },
      doubleSided: false });
    matIndex.set(name, gltf.materials.length - 1);
    return gltf.materials.length - 1;
  };

  const used = scene.draws.filter(d => LAYERS.includes(d.layer) && !DROP_MATERIALS.includes(d.mat));
  const byLayer = new Map();
  used.forEach(d => { if (!byLayer.has(d.layer)) byLayer.set(d.layer, []); byLayer.get(d.layer).push(d); });

  let tris = 0, verts = 0;
  for (const [layer, draws] of byLayer){
    const primitives = [];
    for (const d of draws){
      /* 이 드로우가 쓰는 정점 구간을 잘라 속성별로 푼다 */
      const n = d.vcount;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
      const uv  = new Float32Array(n * 2), col = new Uint8Array(n * 4);
      const bbMin = [Infinity, Infinity, Infinity], bbMax = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < n; i++){
        const b = (d.vstart + i) * S;
        for (let k = 0; k < 3; k++){
          const v = V[b + k];
          pos[i * 3 + k] = v;
          if (v < bbMin[k]) bbMin[k] = v;
          if (v > bbMax[k]) bbMax[k] = v;
          nor[i * 3 + k] = V[b + 3 + k];
        }
        uv[i * 2] = V[b + 6]; uv[i * 2 + 1] = V[b + 7];
        const ao = Math.max(0, Math.min(1, V[b + 8]));
        const q = Math.round(ao * 255);
        col[i * 4] = q; col[i * 4 + 1] = q; col[i * 4 + 2] = q; col[i * 4 + 3] = 255;
      }
      /* 인덱스는 이 구간 기준으로 다시 매긴다 */
      const idx = new Uint32Array(d.count);
      for (let i = 0; i < d.count; i++) idx[i] = I[d.start + i] - d.vstart;

      const acc = (view, type, comp, count, extra) => {
        const bv = pushBuffer(view);
        gltf.bufferViews.push({ buffer:0, byteOffset:bv.off, byteLength:bv.len,
          ...(extra && extra.target ? { target: extra.target } : {}) });
        gltf.accessors.push({ bufferView:gltf.bufferViews.length - 1, componentType:comp,
          count, type, ...(extra && extra.minmax ? { min:extra.minmax[0], max:extra.minmax[1] } : {}),
          ...(extra && extra.normalized ? { normalized:true } : {}) });
        return gltf.accessors.length - 1;
      };
      const aPos = acc(pos, 'VEC3', 5126, n, { target:34962, minmax:[bbMin, bbMax] });
      const aNor = acc(nor, 'VEC3', 5126, n, { target:34962 });
      const aUv  = acc(uv,  'VEC2', 5126, n, { target:34962 });
      const aCol = acc(col, 'VEC4', 5121, n, { target:34962, normalized:true });
      const aIdx = acc(idx, 'SCALAR', 5125, d.count, { target:34963 });

      primitives.push({ attributes:{ POSITION:aPos, NORMAL:aNor, TEXCOORD_0:aUv, COLOR_0:aCol },
                        indices:aIdx, material:materialFor(d.mat), mode:4 });
      tris += d.count / 3; verts += n;
    }
    gltf.meshes.push({ name:layer, primitives });
    gltf.nodes.push({ name:layer, mesh:gltf.meshes.length - 1 });
    gltf.scenes[0].nodes.push(gltf.nodes.length - 1);
  }

  const bin = Buffer.concat(chunks);
  gltf.buffers.push({ byteLength: bin.length });

  /* GLB 컨테이너 */
  let json = Buffer.from(JSON.stringify(gltf), 'utf8');
  const jsonPad = (4 - (json.length % 4)) % 4;
  if (jsonPad) json = Buffer.concat([json, Buffer.alloc(jsonPad, 0x20)]);
  const binPad = (4 - (bin.length % 4)) % 4;
  const binOut = binPad ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0);                       // 'glTF'
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + binOut.length, 8);
  const jsonHdr = Buffer.alloc(8);
  jsonHdr.writeUInt32LE(json.length, 0); jsonHdr.writeUInt32LE(0x4E4F534A, 4);   // 'JSON'
  const binHdr = Buffer.alloc(8);
  binHdr.writeUInt32LE(binOut.length, 0); binHdr.writeUInt32LE(0x004E4942, 4);   // 'BIN'

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.concat([header, jsonHdr, json, binHdr, binOut]));

  const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
  console.log('\n■ GLB 내보내기 완료');
  console.log('  파일       ', path.relative(ROOT, OUT));
  console.log('  레이어     ', [...byLayer.keys()].join(', '));
  console.log('  뺀 재질    ', DROP_MATERIALS.join(', ') || '(없음)');
  console.log('  삼각형     ', Math.round(tris).toLocaleString(), '· 정점', verts.toLocaleString());
  console.log('  재질       ', gltf.materials.length, '개 —', gltf.materials.map(m => m.name).join(', '));
  console.log('  크기       ', mb(fs.statSync(OUT).size), '(JSON', mb(json.length) + ', BIN', mb(binOut.length) + ')');
  console.log('  로컬 프레임 원점 = 대지 북서 모서리 · +X 동 · +Z 남 · +Y 위 · 규빗', X.CUBIT, 'm\n');
}
main();

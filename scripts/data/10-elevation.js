/* ══════════════ 고도 샘플링 (엔진 비의존) ══════════════
   Terrarium DEM 타일을 직접 디코드해 임의 좌표의 해발을 읽는다.
   MapLibre 판과 Cesium 실사 모드가 같은 코드를 쓰므로, 두 화면의 단면
   수치가 항상 일치한다. */

/* Terrarium RGB → 해발(m) */
function terrariumDecode(data, px, py){
  const i = (py * 256 + px) * 4;
  return (data[i] * 256 + data[i+1] + data[i+2] / 256) - 32768;
}

/* Terrarium 픽셀 → 해발(m) 디코드 */
async function terrainPixel(z, tx, ty, px, py){
  while (px < 0){ tx--; px += 256; }
  while (px > 255){ tx++; px -= 256; }
  while (py < 0){ ty--; py += 256; }
  while (py > 255){ ty++; py -= 256; }
  const data = await getTileData(z, tx, ty);
  return terrariumDecode(data, px, py);
}

/* 두 좌표 사이 대권 거리(m) — samplePath 가 쓴다 */
function haversine(a, b){
  const R = 6371000, d = Math.PI/180;
  const dLat = (b[1]-a[1])*d, dLng = (b[0]-a[0])*d;
  const s = Math.sin(dLat/2)**2 +
    Math.cos(a[1]*d)*Math.cos(b[1]*d)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}
const tileCache = new Map();
const SAMPLE_N = 240;
const SAMPLE_Z = 14;
const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

function lngLatToTilePx(lng, lat, z){
  const n = 2 ** z;
  const x = (lng + 180) / 360 * n;
  const latR = lat * Math.PI / 180;
  const y = (1 - Math.log(Math.tan(latR) + 1/Math.cos(latR)) / Math.PI) / 2 * n;
  return { tx:Math.floor(x), ty:Math.floor(y),
           px:(x - Math.floor(x)) * 256, py:(y - Math.floor(y)) * 256 };
}

async function getTileData(z, tx, ty){
  const key = `${z}/${tx}/${ty}`;
  if (tileCache.has(key)) return tileCache.get(key);
  const p = (async () => {
    const url = DEM_URL.replace('{z}',z).replace('{x}',tx).replace('{y}',ty);
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('DEM 타일 로드 실패'));
      im.src = url;
    });
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const cx = cv.getContext('2d', { willReadFrequently:true });
    cx.drawImage(img, 0, 0);
    return cx.getImageData(0, 0, 256, 256).data;
  })();
  tileCache.set(key, p);
  return p;
}

async function elevationAt(lng, lat){
  const { tx, ty, px, py } = lngLatToTilePx(lng, lat, SAMPLE_Z);
  const x0 = Math.floor(px), y0 = Math.floor(py), fx = px - x0, fy = py - y0;
  const [e00,e10,e01,e11] = await Promise.all([
    terrainPixel(SAMPLE_Z,tx,ty,x0,y0), terrainPixel(SAMPLE_Z,tx,ty,x0+1,y0),
    terrainPixel(SAMPLE_Z,tx,ty,x0,y0+1), terrainPixel(SAMPLE_Z,tx,ty,x0+1,y0+1)
  ]);
  const top = e00*(1-fx) + e10*fx, bot = e01*(1-fx) + e11*fx;
  return top*(1-fy) + bot*fy;
}

function samplePath(pts, n){
  const segLen = [], cum = [0];
  for (let i=0;i<pts.length-1;i++){ segLen.push(haversine(pts[i],pts[i+1])); cum.push(cum[i]+segLen[i]); }
  const total = cum[cum.length-1];
  const out = [];
  for (let k=0;k<n;k++){
    const target = total * k / (n-1);
    let s = 0;
    while (s < segLen.length-1 && cum[s+1] < target) s++;
    const t = segLen[s] === 0 ? 0 : (target - cum[s]) / segLen[s];
    out.push({
      lng: pts[s][0] + (pts[s+1][0]-pts[s][0])*t,
      lat: pts[s][1] + (pts[s+1][1]-pts[s][1])*t,
      dist: target
    });
  }
  return { samples:out, total };
}

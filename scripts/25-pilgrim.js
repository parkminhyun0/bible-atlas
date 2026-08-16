/* ══════════════ 🕊️ 올라가는 길: 1세기 로마 도로 회랑 ══════════════
   헤롯 여리고(로마 도로의 와디 켈트 진입점) → 아둠밈 오르막(수 15:7) →
   선한 사마리아인 여관 전승지 → 베다니 → 벳바게 → 감람산 → 성전산 동편.
   고증 지점(문헌·고고학 앵커) 사이의 선형은 지형 회랑 근사임. */

function heading(a, b){
  const d = Math.PI/180;
  const y = Math.sin((b[0]-a[0])*d) * Math.cos(b[1]*d);
  const x = Math.cos(a[1]*d)*Math.sin(b[1]*d) -
            Math.sin(a[1]*d)*Math.cos(b[1]*d)*Math.cos((b[0]-a[0])*d);
  return Math.atan2(y, x) / d;
}
/* ── 길 따라 이동 ──────────────────────────────────────────
   선택된 단면 경로를 '지면 높이'에서 따라간다. 상공 비행이 아니라
   보행 시점에 가깝게 pitch 를 세우고 줌을 높여, 앞의 능선과 하늘이
   함께 보이도록 한다. 경로가 선택돼 있지 않으면 로마 도로 회랑을 쓴다. */
let flying = false, flightRAF = null;
const walkBtn = document.getElementById('walkRoute');
const hud = document.getElementById('hud');
const WALK_PITCH = 84;
const WALK_ZOOM  = 17.6;
let walkPreparing = false;
walkBtn.addEventListener('click', () => {
  if (walkPreparing) return;
  flying ? endFlight(true) : startFlight();
});
document.getElementById('skipFlight').addEventListener('click', () => endFlight(true));
window.addEventListener('keydown', e => { if (e.key === 'Escape' && flying) endFlight(true); });

const flightCache = new Map();
async function startFlight(){
  stopOrbit(); exitDraw();
  showToast('경로 고도를 읽는 중…');
  const routePts = (currentProfile && currentProfile.samples && currentProfile.samples.length)
    ? currentProfile.samples.map(s => [s.lng, s.lat])
    : PILGRIM;
  const key = routePts.length + ':' + routePts[0].join(',') + ':' + routePts[routePts.length-1].join(',');
  let data = flightCache.get(key);
  walkPreparing = true;
  try{
    if (!data){
      const { samples, total } = samplePath(routePts, 480);
      const elevs = [];
      for (let i = 0; i < samples.length; i += 24){
        const chunk = samples.slice(i, i + 24);
        elevs.push(...await Promise.all(chunk.map(s => elevationAt(s.lng, s.lat))));
      }
      data = { samples, elevs, total };
      flightCache.set(key, data);
    }
    hideToast();
  }catch(e){
    walkPreparing = false;
    showToast('고도 데이터를 불러오지 못했습니다', 3000); return;
  }
  walkPreparing = false;
  const { samples, elevs, total } = data;
  if (!samples || samples.length < 2){ showToast('경로가 너무 짧습니다', 2500); return; }

  flying = true;
  walkBtn.classList.add('flying');
  walkBtn.innerHTML = '⏹ 이동 중지';
  hud.classList.add('show');
  drawLineOnMap(routePts);

  const s0 = samples[0], s1 = samples[Math.min(12, samples.length - 1)];
  map.jumpTo({ center: [s0.lng, s0.lat], zoom: WALK_ZOOM, pitch: WALK_PITCH,
               bearing: heading([s0.lng, s0.lat], [s1.lng, s1.lat]) });

  const DUR = 60000;
  const t0 = performance.now();
  const N = samples.length;
  const frame = now => {
    if (!flying) return;
    let t = Math.min(1, (now - t0) / DUR);
    if (!Number.isFinite(t)) t = 0;
    const fi = t * (N - 1);
    const i = Math.max(0, Math.min(N - 2, Math.floor(fi) || 0));
    if (!samples[i] || !samples[i+1]){ endFlight(false); return; }
    const f = fi - i;
    const cur = [
      samples[i].lng + (samples[i+1].lng - samples[i].lng) * f,
      samples[i].lat + (samples[i+1].lat - samples[i].lat) * f
    ];
    const ahead = samples[Math.min(N - 1, i + 14)];
    const brg = heading(cur, [ahead.lng, ahead.lat]);
    const cb = map.getBearing();
    let db = ((brg - cb + 540) % 360) - 180;
    map.jumpTo({ center: cur, bearing: cb + db * 0.06,
                 pitch: WALK_PITCH, zoom: WALK_ZOOM });

    const elev = elevs[i] + (elevs[i+1] - elevs[i]) * f;
    document.getElementById('hudElev').textContent =
      (elev < 0 ? '−' : '') + Math.abs(Math.round(elev)) + ' m';
    document.getElementById('hudClimb').textContent =
      '+' + Math.max(0, Math.round(elev - elevs[0])) + ' m';
    document.getElementById('hudDist').textContent =
      (samples[i].dist / 1000).toFixed(1) + ' km';

    if (t >= 1){ endFlight(false); return; }
    flightRAF = requestAnimationFrame(frame);
  };
  flightRAF = requestAnimationFrame(frame);
}
function endFlight(skipped){
  flying = false;
  cancelAnimationFrame(flightRAF);
  hud.classList.remove('show');
  walkBtn.classList.remove('flying');
  walkBtn.innerHTML = '🚶 길 따라 이동';
  map.easeTo({ center: [35.2354, 31.7780], zoom: 15.6, pitch: 76,
               bearing: -95, duration: skipped ? 1600 : 2600 });
}

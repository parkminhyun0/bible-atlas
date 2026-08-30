/* ══════════════ 시점 컨트롤 (회전) ══════════════ */
document.getElementById('rotL').addEventListener('click', () =>
  map.easeTo({ bearing: map.getBearing() - 45, duration: 650 }));
document.getElementById('rotR').addEventListener('click', () =>
  map.easeTo({ bearing: map.getBearing() + 45, duration: 650 }));

let orbiting = false, orbitRAF = null;
const orbitBtn = document.getElementById('orbit');
orbitBtn.addEventListener('click', () => orbiting ? stopOrbit() : startOrbit());
function startOrbit(){
  orbiting = true; orbitBtn.classList.add('on');
  let last = performance.now();
  const step = now => {
    if (!orbiting) return;
    map.setBearing(map.getBearing() + (now - last) * 0.006); // 약 60초에 한 바퀴
    last = now;
    orbitRAF = requestAnimationFrame(step);
  };
  orbitRAF = requestAnimationFrame(step);
}
function stopOrbit(){
  orbiting = false; orbitBtn.classList.remove('on');
  cancelAnimationFrame(orbitRAF);
}
['mousedown','touchstart','wheel'].forEach(ev =>
  map.getCanvas().addEventListener(ev, stopOrbit, { passive:true }));

/* ══════════════ 두 손가락 시점 조작 (모바일) ══════════════
   MapLibre 기본값은 방위(회전)를 두 손가락 '비틀기'에만 걸어 두고, 나란한
   좌우 이동에는 아무것도 걸지 않는다. 상하 기울이기(touchPitch)도 두 손가락
   간격이 조금만 변하면 확대·축소가 먼저 잡아채 잘 걸리지 않는다.
   그래서 두 손가락이 '나란히' 움직이는 경우를 직접 받아 시점 축을 옮긴다.
     상하 → 피치(기울기)   ·   좌우 → 방위(회전)
   손가락 간격이 기준 이상 변하면 확대·축소로 보고 건너뛰므로 기존 핀치 줌은
   그대로 살아 있다. 우리가 상하를 맡으므로 MapLibre 의 touchPitch 는 끈다. */
(() => {
  /* 데스크톱에서도 그냥 건다 — 터치 이벤트가 없으면 아무 일도 일어나지 않고,
     환경 판정을 두면 터치 지원 데스크톱에서 되레 갈리기 때문이다. */
  const pad = map.getCanvasContainer();
  map.touchPitch.disable();

  const PINCH_TOL   = 14;    // px. 두 손가락 간격이 이보다 변하면 확대·축소로 본다
  const PITCH_PER_PX   = 0.5;
  const BEARING_PER_PX = 0.25;

  let prev = null;
  const isTwo  = ev => ev.touches.length === 2;
  const sample = ev => {
    const [a, b] = ev.touches;
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2,
      d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    };
  };

  pad.addEventListener('touchstart', ev => {
    prev = isTwo(ev) ? sample(ev) : null;
  }, { passive: true });

  pad.addEventListener('touchmove', ev => {
    if (!isTwo(ev)) { prev = null; return; }
    if (!prev) { prev = sample(ev); return; }
    const now = sample(ev);
    if (Math.abs(now.d - prev.d) > PINCH_TOL) { prev = now; return; }  // 확대·축소는 MapLibre 에 맡긴다
    const dx = now.x - prev.x, dy = now.y - prev.y;
    prev = now;
    if (!dx && !dy) return;
    if (ev.cancelable) ev.preventDefault();
    stopOrbit();
    const maxPitch = map.getMaxPitch();
    map.jumpTo({
      pitch:   Math.min(maxPitch, Math.max(0, map.getPitch() - dy * PITCH_PER_PX)),
      bearing: map.getBearing() + dx * BEARING_PER_PX,
    });
  }, { passive: false });

  const clear = () => { prev = null; };
  pad.addEventListener('touchend',    clear, { passive: true });
  pad.addEventListener('touchcancel', clear, { passive: true });
})();

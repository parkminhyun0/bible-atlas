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

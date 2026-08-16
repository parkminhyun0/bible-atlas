/* ══════════════ v16 UI: 헤더 슬라이드 · 범례 접기 ══════════════ */
(function(){
  const hdr = document.getElementById('hdr');
  const hb  = document.getElementById('hdrToggle');
  if (hdr && hb) hb.addEventListener('click', () => {
    const c = hdr.classList.toggle('collapsed');
    hb.textContent = c ? '▶' : '◀';
  });
  const tl = document.getElementById('terrLegend');
  const tf = document.getElementById('tlFold');
  if (tl && tf) tf.addEventListener('click', () => {
    const f = tl.classList.toggle('folded');
    tf.textContent = f ? '▼' : '▲';
  });
})();

/* v17: 회전 버튼을 설명 박스(accuracyLegend) 바로 위에 동적 배치 —
   화면 크기와 박스 높이가 변해도 겹치지도, 지나치게 올라가지도 않게 */
function positionViewCtl(){
  const lg = document.getElementById('accuracyLegend');
  const vc = document.getElementById('viewCtl');
  if (!lg || !vc) return;
  const cs = getComputedStyle(lg);
  if (cs.display === 'none'){ vc.style.bottom = '230px'; return; }
  const r = lg.getBoundingClientRect();
  vc.style.bottom = (window.innerHeight - r.top + 12) + 'px';
}
window.addEventListener('resize', positionViewCtl);
map.on('load', () => setTimeout(positionViewCtl, 500));

/* 초기 데모: 해안→베레아 전체 단면 자동 표시 */
map.on('load', () => {
  setTimeout(() => {
    const btn = document.querySelector('.chip[data-route="jj"]');
    setActive(btn);
    buildSection(ROUTES.jj.pts, ROUTES.jj.name, ROUTES.jj.marks);
  }, 900);
});

/* ══════════════ v23 UI: desktop + mobile/tablet responsive shell ══════════════ */

/* Keep the existing desktop stylesheet untouched and layer responsive overrides separately. */
(function loadResponsiveStyles(){
  if (document.getElementById('bibleAtlasMobileCss')) return;
  const link = document.createElement('link');
  link.id = 'bibleAtlasMobileCss';
  link.rel = 'stylesheet';
  link.href = './mobile.css';
  document.head.appendChild(link);
})();

const compactMedia = window.matchMedia('(max-width: 900px), (pointer: coarse) and (max-width: 1180px)');
const hdr = document.getElementById('hdr');
const hb = document.getElementById('hdrToggle');
const tl = document.getElementById('terrLegend');
const tf = document.getElementById('tlFold');
const treePanelUi = document.getElementById('treePanel');
const treeToggleUi = document.getElementById('treeToggleBtn');
const profilePanelUi = document.getElementById('profilePanel');
let lastCompactState = null;

function setHeaderCollapsed(collapsed){
  if (!hdr || !hb) return;
  hdr.classList.toggle('collapsed', collapsed);
  hb.textContent = collapsed ? '▶' : '◀';
  hb.setAttribute('aria-label', collapsed ? '설명 패널 펼치기' : '설명 패널 접기');
}

function setLegendFolded(folded){
  if (!tl || !tf) return;
  tl.classList.toggle('folded', folded);
  tf.textContent = folded ? '▼' : '▲';
  tf.setAttribute('aria-label', folded ? '분봉왕 범례 펼치기' : '분봉왕 범례 접기');
}

if (hdr && hb) hb.addEventListener('click', () => setHeaderCollapsed(!hdr.classList.contains('collapsed')));
if (tl && tf) tf.addEventListener('click', () => setLegendFolded(!tl.classList.contains('folded')));

const compactLabels = [
  [document.querySelector('.chip[data-route="jj"]'), '해안→베레아'],
  [document.querySelector('.chip[data-route="ew"]'), '동서 횡단'],
  [document.querySelector('.chip[data-route="rift"]'), '요단 지구대'],
  [document.getElementById('drawBtn'), '✏️ 직접 그리기'],
  [document.getElementById('fitAll'), '🔭 전체 보기'],
  [document.getElementById('templeView'), '🏛️ 성전 보기'],
];

function syncCompactLabels(compact){
  compactLabels.forEach(([el, shortLabel]) => {
    if (!el) return;
    if (!el.dataset.fullLabel) el.dataset.fullLabel = el.textContent.trim();
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.dataset.fullLabel);
    el.textContent = compact ? shortLabel : el.dataset.fullLabel;
  });
  if (treeToggleUi){
    if (!treeToggleUi.dataset.fullLabel) treeToggleUi.dataset.fullLabel = treeToggleUi.textContent.trim();
    treeToggleUi.textContent = compact ? '☰ 레이어' : treeToggleUi.dataset.fullLabel;
  }
}

function syncProfileOpenState(){
  document.body.classList.toggle('profile-open', !!profilePanelUi?.classList.contains('open'));
}
if (profilePanelUi){
  new MutationObserver(syncProfileOpenState).observe(profilePanelUi, { attributes:true, attributeFilter:['class'] });
  syncProfileOpenState();
}

function resizeMapSoon(){
  requestAnimationFrame(() => {
    try { map.resize(); } catch (_) {}
    positionViewCtl();
  });
  setTimeout(() => {
    try { map.resize(); } catch (_) {}
  }, 180);
}

function applyResponsiveMode(){
  const compact = compactMedia.matches;
  document.body.classList.toggle('compact-ui', compact);
  syncCompactLabels(compact);

  if (compact && lastCompactState !== true){
    setHeaderCollapsed(true);
    setLegendFolded(true);
    treePanelUi?.classList.add('hidden');
    if (lastCompactState === false) profilePanelUi?.classList.remove('open');
  }

  if (!compact && lastCompactState === true){
    setHeaderCollapsed(false);
    setLegendFolded(false);
    treePanelUi?.classList.remove('hidden');
  }

  lastCompactState = compact;
  resizeMapSoon();
}

if (compactMedia.addEventListener) compactMedia.addEventListener('change', applyResponsiveMode);
else compactMedia.addListener(applyResponsiveMode);
window.addEventListener('orientationchange', () => setTimeout(applyResponsiveMode, 120));
window.visualViewport?.addEventListener('resize', resizeMapSoon);
applyResponsiveMode();

/* v17+: 회전 버튼을 설명 박스 바로 위에 동적 배치. Compact UI uses CSS safe-area placement. */
function positionViewCtl(){
  const lg = document.getElementById('accuracyLegend');
  const vc = document.getElementById('viewCtl');
  if (!lg || !vc) return;
  if (document.body.classList.contains('compact-ui')){
    vc.style.bottom = '';
    return;
  }
  const cs = getComputedStyle(lg);
  if (cs.display === 'none'){ vc.style.bottom = '230px'; return; }
  const r = lg.getBoundingClientRect();
  vc.style.bottom = (window.innerHeight - r.top + 12) + 'px';
}
window.addEventListener('resize', positionViewCtl);
map.on('load', () => setTimeout(positionViewCtl, 500));

/* Desktop keeps the original auto-demo. Mobile/tablet starts map-first without opening a large profile sheet. */
map.on('load', () => {
  setTimeout(() => {
    if (compactMedia.matches) return;
    const btn = document.querySelector('.chip[data-route="jj"]');
    setActive(btn);
    buildSection(ROUTES.jj.pts, ROUTES.jj.name, ROUTES.jj.marks);
  }, 900);
});

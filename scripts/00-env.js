/* ══════════════ 환경 점검 (스크립트 오류 방지) ══════════════ */
function fatal(msg, detail){
  const box = document.getElementById('errBox');
  document.getElementById('errMsg').innerHTML = msg;
  document.getElementById('errDetail').textContent = detail || '';
  box.classList.add('show');
}
window.__mapReady = false;
window.addEventListener('error', ev => {
  // 지도 가동 후의 산발적 오류(타일 등)는 콘솔에만 기록 — 화면을 막지 않음
  if (window.__mapReady){ console.warn('runtime error:', ev.message); return; }
  if (!document.getElementById('errBox').classList.contains('show')){
    fatal('실행 중 스크립트 오류가 발생했습니다.<br>이 파일은 <b>다운로드 후 Chrome·Safari·Edge 브라우저에서 직접</b> 열어야 합니다. 앱 내 미리보기에서는 외부 지도 서버 접근이 차단됩니다.',
      (ev.message || '') + (ev.filename ? ' @ ' + ev.filename + ':' + ev.lineno : ''));
  }
});
if (typeof maplibregl === 'undefined'){
  fatal('지도 라이브러리(MapLibre)를 불러오지 못했습니다.<br>인터넷 연결을 확인하시고, 파일을 <b>다운로드해 브라우저에서 직접</b> 열어 주세요. 앱 내 미리보기·오프라인 환경에서는 작동하지 않습니다.',
    'cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1 로드 실패');
  throw new Error('maplibregl not loaded');
}

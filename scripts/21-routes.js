/* ══════════════ 경로 칩 & 직접 그리기 ══════════════ */
document.querySelectorAll('.chip[data-route]').forEach(btn=>{btn.addEventListener('click',()=>{setActive(btn);exitDraw();const r=ROUTES[btn.dataset.route];buildSection(r.pts,r.name,r.marks);});});
function setActive(btn){document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));btn?.classList.add('active');}
document.getElementById('closeProfile').addEventListener('click',()=>{panel.classList.remove('open');setActive(null);map.getSource('secLine')?.setData(emptyFC());map.getSource('secPts')?.setData(emptyFC());map.getSource('hoverPt')?.setData(emptyFC());});
const drawBtn=document.getElementById('drawBtn');let drawing=false,drawPts=[];
drawBtn.addEventListener('click',()=>drawing?finishDraw():enterDraw());
function enterDraw(){drawing=true;drawPts=[];setActive(drawBtn);drawBtn.classList.add('arming');drawBtn.innerHTML='✔️ 단면 완성 <span class="drop">더블클릭도 가능</span>';map.getCanvas().style.cursor='crosshair';map.doubleClickZoom.disable();showToast('지도를 클릭해 경로를 그리세요 (2점 이상)');map.on('click',onDrawClick);map.on('dblclick',onDrawDbl);}
function onDrawClick(e){drawPts.push([e.lngLat.lng,e.lngLat.lat]);drawLineOnMap(drawPts);}
function onDrawDbl(e){e.preventDefault();finishDraw();}
function finishDraw(){if(drawPts.length>=2){hideToast();buildSection(drawPts.slice(),'직접 그린 단면');}else showToast('점을 2개 이상 찍어야 합니다',2200);exitDraw();}
function exitDraw(){if(!drawing)return;drawing=false;drawBtn.classList.remove('arming');drawBtn.innerHTML='✏️ 직접 그리기';map.getCanvas().style.cursor='';map.doubleClickZoom.enable();map.off('click',onDrawClick);map.off('dblclick',onDrawDbl);}

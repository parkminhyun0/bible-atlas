/* ══════════════ 단면 차트 (잘라낸 땅의 벽) ══════════════ */
const panel = document.getElementById('profilePanel');
const chart = document.getElementById('chart');
const readout = document.getElementById('readout');
const ctx2d = chart.getContext('2d');
const PAD = { l:64, r:60, t:50, b:26 };
let secZoom = 1, secPan = 0;
function clampSecPan(){ secZoom=Math.min(12,Math.max(1,secZoom)); secPan=Math.min(secZoom-1,Math.max(0,secPan)); }
function setSecZoom(next,anchorFrac=0.5){ const prev=secZoom; secZoom=Math.min(12,Math.max(1,next)); secPan=(secPan+anchorFrac)*(secZoom/prev)-anchorFrac; clampSecPan(); drawProfile(); }
function drawProfile(){
  if(!currentProfile)return;
  const {elevs,total,name}=currentProfile; panel.classList.add('open'); document.getElementById('profileTitle').textContent=name;
  const min=Math.min(...elevs),max=Math.max(...elevs); let ascent=0,descent=0;
  for(let i=1;i<elevs.length;i++){const d=elevs[i]-elevs[i-1];if(d>0)ascent+=d;else descent-=d;}
  document.getElementById('profileStats').innerHTML=`거리 <b>${(total/1000).toFixed(1)} km</b>`+`최고 <b>${Math.round(max)} m</b>`+`최저 <b class="${min<0?'neg':''}">${Math.round(min)} m</b>`+`누적 상승 <b>+${Math.round(ascent)} m</b>`+`누적 하강 <b>−${Math.round(descent)} m</b>`;
  const dpr=window.devicePixelRatio||1,W=chart.clientWidth,H=chart.clientHeight;chart.width=W*dpr;chart.height=H*dpr;ctx2d.setTransform(dpr,0,0,dpr,0,0);ctx2d.clearRect(0,0,W,H);
  const lo=Math.min(min,0)-60,hi=max+80,plotW=W-PAD.l-PAD.r;clampSecPan();const X=i=>PAD.l+plotW*(i/(elevs.length-1)*secZoom-secPan),Y=e=>PAD.t+(H-PAD.t-PAD.b)*(1-(e-lo)/(hi-lo));
  Object.assign(currentProfile,{X,Y,W,H,plotW});ctx2d.font='10px "Noto Sans KR"';ctx2d.textAlign='right';ctx2d.textBaseline='middle';const step=(hi-lo)>1600?500:250;
  for(let e=Math.ceil(lo/step)*step;e<=hi;e+=step){const y=Y(e),sea=e===0;ctx2d.strokeStyle=sea?'#3e7f86aa':'#ede4d31a';ctx2d.lineWidth=sea?1.4:1;ctx2d.setLineDash(sea?[]:[3,5]);ctx2d.beginPath();ctx2d.moveTo(PAD.l,y);ctx2d.lineTo(W-PAD.r,y);ctx2d.stroke();ctx2d.setLineDash([]);ctx2d.fillStyle=sea?'#6fb3ba':'#b3a68e';ctx2d.fillText(sea?'해수면':`${e} m`,PAD.l-8,y);}
  ctx2d.save();ctx2d.beginPath();ctx2d.rect(PAD.l,0,plotW,H-PAD.b);ctx2d.clip();const yBase=H-PAD.b,gAbove=ctx2d.createLinearGradient(0,PAD.t,0,yBase);gAbove.addColorStop(0,'#e8cf9e');gAbove.addColorStop(.45,'#c9a267');gAbove.addColorStop(.8,'#8a6a42');gAbove.addColorStop(1,'#4e3a24');
  ctx2d.beginPath();ctx2d.moveTo(X(0),yBase);elevs.forEach((e,i)=>ctx2d.lineTo(X(i),Y(e)));ctx2d.lineTo(X(elevs.length-1),yBase);ctx2d.closePath();ctx2d.fillStyle=gAbove;ctx2d.fill();
  if(min<0){ctx2d.save();ctx2d.beginPath();ctx2d.rect(PAD.l,Y(0),W-PAD.l-PAD.r,yBase-Y(0));ctx2d.clip();ctx2d.beginPath();ctx2d.moveTo(X(0),yBase);elevs.forEach((e,i)=>ctx2d.lineTo(X(i),Y(e)));ctx2d.lineTo(X(elevs.length-1),yBase);ctx2d.closePath();ctx2d.fillStyle='#3e7f86cc';ctx2d.fill();ctx2d.restore();}
  ctx2d.beginPath();elevs.forEach((e,i)=>i?ctx2d.lineTo(X(i),Y(e)):ctx2d.moveTo(X(i),Y(e)));ctx2d.strokeStyle='#f3e2b8';ctx2d.lineWidth=1.6;ctx2d.stroke();
  if(currentProfile.marks&&currentProfile.marks.length){ctx2d.textAlign='center';currentProfile.marks.forEach((m,idx)=>{const x=X(m.i),y=Y(m.e),row=idx%2,nameY=Math.max(12,y-(row?52:30)),lx=Math.min(W-PAD.r+40,Math.max(PAD.l-40,Math.min(W-30,Math.max(30,x))));ctx2d.strokeStyle='#d9a35388';ctx2d.lineWidth=1;ctx2d.setLineDash([2,3]);ctx2d.beginPath();ctx2d.moveTo(lx,nameY+22);ctx2d.lineTo(x,y);ctx2d.stroke();ctx2d.setLineDash([]);ctx2d.fillStyle='#d9a353';ctx2d.beginPath();ctx2d.arc(x,y,3.2,0,Math.PI*2);ctx2d.fill();ctx2d.strokeStyle='#171310';ctx2d.lineWidth=1.2;ctx2d.stroke();ctx2d.textBaseline='top';ctx2d.font='bold 10.5px "Noto Sans KR"';ctx2d.fillStyle='#f3e2b8';ctx2d.fillText(m.n,lx,nameY);ctx2d.font='9px "Noto Sans KR"';ctx2d.fillStyle=m.e<0?'#6fb3ba':'#b3a68e';ctx2d.fillText((m.e<0?'−':'')+Math.abs(Math.round(m.e))+' m',lx,nameY+11);});}
  ctx2d.restore();ctx2d.textAlign='center';ctx2d.textBaseline='top';ctx2d.fillStyle='#b3a68e';const km=total/1000,visKm=km/secZoom,tick=visKm>60?20:visKm>25?10:visKm>12?5:visKm>5?2:visKm>2?1:0.5;
  for(let d=0;d<=km+1e-9;d+=tick){const x=X((d/km)*(elevs.length-1));if(x<PAD.l-1||x>W-PAD.r+1)continue;ctx2d.fillText(`${Number.isInteger(tick)?d:d.toFixed(1)} km`,x,yBase+7);}document.getElementById('secZoomLabel').textContent=secZoom.toFixed(1)+'×';
}
document.getElementById('secIn').addEventListener('click',()=>setSecZoom(secZoom*1.6));document.getElementById('secOut').addEventListener('click',()=>setSecZoom(secZoom/1.6));document.getElementById('secReset').addEventListener('click',()=>{secZoom=1;secPan=0;drawProfile();});
chart.addEventListener('wheel',ev=>{if(!currentProfile)return;ev.preventDefault();const rect=chart.getBoundingClientRect(),anchor=Math.min(1,Math.max(0,(ev.clientX-rect.left-PAD.l)/currentProfile.plotW));setSecZoom(secZoom*(ev.deltaY<0?1.18:1/1.18),anchor);},{passive:false});
let secDrag=null;chart.addEventListener('pointerdown',ev=>{if(!currentProfile||secZoom<=1)return;secDrag={x:ev.clientX,pan:secPan};chart.setPointerCapture(ev.pointerId);chart.style.cursor='grabbing';});chart.addEventListener('pointerup',ev=>{secDrag=null;chart.style.cursor='';if(chart.hasPointerCapture(ev.pointerId))chart.releasePointerCapture(ev.pointerId);});
chart.addEventListener('pointermove',ev=>{if(!currentProfile)return;const{elevs,samples,X,Y,plotW}=currentProfile,rect=chart.getBoundingClientRect(),x=ev.clientX-rect.left;if(secDrag){secPan=secDrag.pan-(ev.clientX-secDrag.x)/plotW;clampSecPan();drawProfile();return;}const frac=Math.min(1,Math.max(0,((x-PAD.l)/plotW+secPan)/secZoom)),i=Math.round(frac*(elevs.length-1)),e=elevs[i],s=samples[i];readout.style.display='block';readout.style.left=X(i)+'px';readout.style.top=Y(e)+'px';readout.innerHTML=`<b>${Math.round(e)} m</b> · ${(s.dist/1000).toFixed(1)} km 지점`;map.getSource('hoverPt')?.setData({type:'Feature',geometry:{type:'Point',coordinates:[s.lng,s.lat]}});});
chart.addEventListener('pointerleave',()=>{readout.style.display='none';map.getSource('hoverPt')?.setData(emptyFC());});window.addEventListener('resize',()=>drawProfile());

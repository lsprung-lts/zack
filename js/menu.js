'use strict';
/* Zack: Hauptmenü */
/* ---------- Menü ---------- */
const TAGS=['One click, one dash. Miss and you\'re a sitting duck.','Aim, click, Zack. That\'s all there is.',
  'A near miss is still a miss. But it pays.','Feels like a record kind of day.'];
function showMenu(){
  reset();st='menu';
  $('tag').textContent=TAGS[Math.random()*TAGS.length|0];
  $('mBest').hidden=!(best>0);$('mBestV').textContent=fmt(best);
  $('ovResult').hidden=true;$('ovPause').hidden=true;$('ovMenu').hidden=false;$('ov').classList.add('menu-on');$('ov').classList.remove('end-on');$('ov').hidden=false;
  if(!$('ovRules').hidden)toggleHow();
  if(!$('settings').hidden)toggleSettings();$('tipsBtn').textContent='Show tips again';
  buildSkins();
}
/* Spurfarben-Auswahl: freigespielte wählbar, gesperrte zeigen, was fehlt */
function buildSkins(){
  const el=$('skins'),cur=skin().id;
  el.innerHTML='<span class="lbl">Trail · total '+fmt(total)+'</span>'+SKINS.map(s=>{
    const open=total>=s.need,sw=s.rgb?'rgb('+s.rgb.join(',')+')':'conic-gradient(#ff5d73,#ffd23f,#5ce1e6,#7aa2ff,#ff5d73)';
    return '<button class="skin'+(s.id===cur?' on':'')+'" role="radio" aria-checked="'+(s.id===cur)+'" data-id="'+s.id+'"'+(open?'':' disabled')
      +' title="'+s.name+(open?'':' – unlocks at '+fmt(s.need)+' total points')+'"><i style="background:'+sw+'"></i>'
      +(open?'':'<small>'+(s.need>=1000?fmt(s.need/1000)+'k':s.need)+'</small>')+'</button>';}).join('');
}
$('skins').addEventListener('click',e=>{const b=e.target.closest('button.skin');if(!b||b.disabled)return;
  skinId=b.dataset.id;try{localStorage.setItem('zack.trail',skinId)}catch(err){}
  buildSkins();tone(880,.08,'triangle',.05,1320);});
function toggleHow(){const open=$('ovRules').hidden;$('ovRules').hidden=!open;$('cast').hidden=open;
  $('ov').classList.toggle('how',open);$('how').setAttribute('aria-expanded',open);$('how').textContent=open?'Show enemies':'How to play';}
/* Ergebnis-Screen: der Gegner, der dich erwischt hat, in einer kleinen Schleife; Punkte zählen hoch */
const killCv=$('ovKiller');
function drawKiller(rdt){
  if(st!=='over'||$('ovResult').hidden)return;
  endT+=rdt;
  /* Punkte zählen in ~0,9 s hoch, Balken füllt sich mit */
  const k=Math.min(1,endT/.9),v=score*(1-Math.pow(1-k,3));
  $('ovScore').textContent=fmt(v);
  drawMedals(v);
  const dpr=Math.min(window.devicePixelRatio||1,2),cw=killCv.clientWidth,ch=killCv.clientHeight;if(!cw)return;
  if(killCv.width!==Math.round(cw*dpr)){killCv.width=Math.round(cw*dpr);killCv.height=Math.round(ch*dpr);}
  const x=killCv.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,killCv.width,killCv.height);x.setTransform(killCv.width/180,0,0,killCv.height/80,0,0);
  const t=(endT%1.8)/1.8,hitAt=.45,sx=128,sy=40;
  /* Gegner läuft (bzw. schießt) auf den Funken zu */
  const run=Math.min(1,t/hitAt),ease=killer==='r'?run*run:1-Math.pow(1-run,2);
  const e={k:killer,x:22+(sx-14-22)*ease,y:sy,vx:1,vy:0,age:endT,seed:0,r:killer==='i'?17:14,warn:0,ph:2,dx:1,dy:0,life:9};
  if(killer==='r'&&t<hitAt*.5){x.strokeStyle='rgba(255,154,60,.5)';x.lineWidth=2;x.beginPath();x.moveTo(10,sy);x.lineTo(176,sy);x.stroke();}   // Warnlinie
  x.globalAlpha=t>.85?1-(t-.85)/.15:1;drawFoe(e,x);
  /* Funke: leuchtet bis zum Treffer, dann zerplatzt er */
  if(t<hitAt){x.fillStyle='rgba(255,210,63,.3)';x.beginPath();x.arc(sx,sy,13,0,6.3);x.fill();x.fillStyle=C.you;x.beginPath();x.arc(sx,sy,7,0,6.3);x.fill();
    x.fillStyle='#fff';x.beginPath();x.arc(sx,sy,3,0,6.3);x.fill();}
  else{const q=(t-hitAt)/(1-hitAt);x.strokeStyle='rgba(255,210,63,'+(1-q)+')';x.lineWidth=3;x.lineCap='round';
    for(let i=0;i<10;i++){const a=i/10*6.283+.3,r1=6+q*34,r2=r1+6;x.beginPath();x.moveTo(sx+Math.cos(a)*r1,sy+Math.sin(a)*r1);x.lineTo(sx+Math.cos(a)*r2,sy+Math.sin(a)*r2);x.stroke();}}
  x.globalAlpha=1;
}
/* ---------- Medaillen: leuchten nacheinander auf, während die Punkte hochzählen ---------- */
const medCv=$('ovMedals');
function medalCol(m,a){return m.c?m.c:'hsl('+(clock*160%360)+',90%,65%)';}
function drawMedal(x,cx,cy,r,m,on,pop){
  const s=1+pop*.35;x.save();x.translate(cx,cy);x.scale(s,s);
  if(!on){x.lineWidth=2;x.strokeStyle='rgba(246,239,255,.18)';x.beginPath();x.arc(0,0,r,0,6.3);x.stroke();x.restore();return;}
  const col=medalCol(m);
  x.fillStyle=col;x.globalAlpha=.25;x.beginPath();x.arc(0,0,r+6,0,6.3);x.fill();x.globalAlpha=1;
  x.beginPath();for(let i=0;i<24;i++){const a=i/24*6.283,rr=i%2?r:r*.88;x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}x.closePath();x.fill();   // gezackter Rand
  x.fillStyle='rgba(14,8,32,.35)';x.beginPath();x.arc(0,0,r*.66,0,6.3);x.fill();
  x.fillStyle='#fff';x.beginPath();for(let i=0;i<10;i++){const a=i/10*6.283-1.571,rr=i%2?r*.2:r*.48;x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}x.closePath();x.fill();   // Stern
  x.restore();
}
function drawMedals(v){
  const dpr=Math.min(window.devicePixelRatio||1,2),cw=medCv.clientWidth,ch=medCv.clientHeight;if(!cw)return;
  if(medCv.width!==Math.round(cw*dpr)){medCv.width=Math.round(cw*dpr);medCv.height=Math.round(ch*dpr);}
  const x=medCv.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,medCv.width,medCv.height);x.setTransform(medCv.width/420,0,0,medCv.height/58,0,0);
  const n=MEDALS.length,gap=420/n,cy=24,R=14,reached=MEDALS.filter(m=>v>=m.s).length;
  if(reached>medalShown){for(let i=medalShown;i<reached;i++)tone(note(6+i*2),.18,'triangle',.06,0,(i-medalShown)*.06);medalShown=reached;medalPop[reached-1]=1;}
  /* Fortschrittslinie bis zur aktuellen Punktzahl */
  const px=i=>gap/2+i*gap;let fx=0;
  if(reached===0)fx=px(0)*Math.min(1,v/MEDALS[0].s);else if(reached>=n)fx=px(n-1);
  else{const a=MEDALS[reached-1],b=MEDALS[reached];fx=px(reached-1)+(px(reached)-px(reached-1))*Math.min(1,(v-a.s)/(b.s-a.s));}
  x.lineWidth=3;x.strokeStyle='rgba(246,239,255,.12)';x.beginPath();x.moveTo(px(0),cy);x.lineTo(px(n-1),cy);x.stroke();
  x.strokeStyle=C.you;x.beginPath();x.moveTo(Math.min(fx,px(0)),cy);x.lineTo(fx,cy);x.stroke();
  for(let i=0;i<n;i++){medalPop[i]=Math.max(0,(medalPop[i]||0)-.05);const cur=i===reached-1;
    drawMedal(x,px(i),cy,cur?R+3:R,MEDALS[i],i<reached,medalPop[i]+(cur&&endT>1.2?Math.sin(endT*4)*.04+.04:0));}
  /* Zeile darunter: erreichte Medaille und was zur nächsten fehlt */
  const got=MEDALS[reached-1],nx=MEDALS[reached];
  x.font='600 12px "Outfit",sans-serif';x.textAlign='center';x.textBaseline='middle';
  x.fillStyle=got?medalCol(got):'rgba(246,239,255,.6)';
  x.fillText((got?got.n+' medal':'No medal yet')+(nx?'  ·  '+fmt(Math.max(0,nx.s-v))+' to '+nx.n:'  ·  the highest there is!'),210,50);
}
const medalPop=[];
/* ---------- Einstellungen ---------- */
function toggleSettings(){const open=$('settings').hidden;
  if(open&&!$('ovRules').hidden)toggleHow();
  $('settings').hidden=!open;$('cast').hidden=open;$('ov').classList.toggle('how',open);
  $('set').setAttribute('aria-expanded',open);$('set').textContent=open?'Close':'Settings';syncSettings();}
function syncSettings(){$('sfx').value=sfxVol;$('sfx').style.setProperty('--v',sfxVol+'%');$('sfxV').textContent=sfxVol+'%';
  $('fxBtn').textContent=fxOn?'On':'Off';$('fxBtn').setAttribute('aria-pressed',fxOn);}
$('sfx').addEventListener('input',e=>{wake();setSfx(+e.target.value);syncSettings();});
$('sfx').addEventListener('change',()=>tone(880,.08,'triangle',.06,1320));
$('fxBtn').addEventListener('click',()=>{fxOn=!fxOn;try{localStorage.setItem('zack.fx',fxOn?'1':'0')}catch(e){}syncSettings();$('fxBtn').blur();});
$('tipsBtn').addEventListener('click',()=>{tutOn=true;try{localStorage.removeItem('zack.tut');localStorage.removeItem('zack.tutRuns')}catch(e){}$('tipsBtn').textContent='Tips on ✓';$('tipsBtn').blur();});
/* ---------- Pause-Menü ---------- */
function showPause(){$('ov').classList.remove('end-on');$('pauseInfo').textContent=fmt(score)+' points so far';
  $('ovMenu').hidden=true;$('ovResult').hidden=true;$('ovPause').hidden=false;$('ov').classList.remove('menu-on','how');$('ov').hidden=false;}
function hidePause(){$('ovPause').hidden=true;$('ov').hidden=true;}
/* Abbrechen: Punkte zählen für die Spurfarben, aber kein Rekord und keine Bestwerte */
function quitToMenu(){total+=Math.round(score);try{localStorage.setItem('zack.total',total)}catch(e){}st='over';showMenu();}
/* Kleine Gegner-Vorschau im Menü, gezeichnet mit drawFoe() */
const castCv=[...document.querySelectorAll('#cast canvas')];
function drawCast(){
  if(st!=='menu'||$('cast').hidden)return;
  for(const c of castCv){
    const s=c.clientWidth;if(!s)continue;const dpr=Math.min(window.devicePixelRatio||1,2),px=Math.round(s*dpr);
    if(c.width!==px){c.width=c.height=px;}
    const x=c.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,px,px);
    x.setTransform(px/72,0,0,px/72,0,0);
    const k=c.dataset.k,e={k,x:36,y:36,vx:Math.cos(clock*.8),vy:Math.sin(clock*.8),age:clock,seed:0,r:16,warn:0,ph:0,life:9,dx:1,dy:0};
    if(k==='i'){e.r=19;e.ph=clock%2.7;}else if(k==='b'){e.r=15;}else if(k==='g'||k==='u'){e.r=13;}else if(k==='r'){e.dx=Math.cos(-.5);e.dy=Math.sin(-.5);}
    drawFoe(e,x);
  }
}


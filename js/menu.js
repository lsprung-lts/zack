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
  $('ovBestBar').style.width=(endBest>0?Math.min(100,v/endBest*100):100)+'%';
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
    if(k==='i'){e.r=19;e.ph=clock%2.7;}else if(k==='g'||k==='u'){e.r=13;}else if(k==='r'){e.dx=Math.cos(-.5);e.dy=Math.sin(-.5);}
    drawFoe(e,x);
  }
}


'use strict';
/* Zack: Hauptmenü */
/* ---------- Menü ---------- */
const TAGS=['Ein Klick, ein Sprung. Wer danebenhaut, steht blöd da.','Zielen, klicken, Zack. Mehr is ned dabei.',
  'Knapp vorbei is a vorbei. Und bringt Punkte.','Heut is a guater Tag für an Rekord.'];
function showMenu(){
  reset();st='menu';
  $('tag').textContent=TAGS[Math.random()*TAGS.length|0];
  $('mBest').hidden=!(best>0);$('mBestV').textContent=fmt(best);
  $('ovResult').hidden=true;$('ovMenu').hidden=false;$('ov').classList.add('menu-on');$('ov').hidden=false;
  if(!$('ovRules').hidden)toggleHow();
  buildSkins();
}
/* Spurfarben-Auswahl: freigespielte wählbar, gesperrte zeigen, was fehlt */
function buildSkins(){
  const el=$('skins'),cur=skin().id;
  el.innerHTML='<span class="lbl">Spur · gesamt '+fmt(total)+'</span>'+SKINS.map(s=>{
    const open=total>=s.need,sw=s.rgb?'rgb('+s.rgb.join(',')+')':'conic-gradient(#ff5d73,#ffd23f,#5ce1e6,#7aa2ff,#ff5d73)';
    return '<button class="skin'+(s.id===cur?' on':'')+'" role="radio" aria-checked="'+(s.id===cur)+'" data-id="'+s.id+'"'+(open?'':' disabled')
      +' title="'+s.name+(open?'':' – ab '+fmt(s.need)+' Punkten gesamt')+'"><i style="background:'+sw+'"></i>'
      +(open?'':'<small>'+(s.need>=1000?fmt(s.need/1000)+'k':s.need)+'</small>')+'</button>';}).join('');
}
$('skins').addEventListener('click',e=>{const b=e.target.closest('button.skin');if(!b||b.disabled)return;
  skinId=b.dataset.id;try{localStorage.setItem('zack.trail',skinId)}catch(err){}
  buildSkins();tone(880,.08,'triangle',.05,1320);});
function toggleHow(){const open=$('ovRules').hidden;$('ovRules').hidden=!open;$('cast').hidden=open;
  $('ov').classList.toggle('how',open);$('how').setAttribute('aria-expanded',open);$('how').textContent=open?'Gegner zeigen':"So geht's";}
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
    if(k==='i'){e.r=19;e.ph=clock%2.7;}else if(k==='g'){e.r=13;}else if(k==='r'){e.dx=Math.cos(-.5);e.dy=Math.sin(-.5);}
    drawFoe(e,x);
  }
}


'use strict';
/* Zack: Regeln, Gegner-Spawn, Sprung, Tod, Ergebnis */
/* ---------- Regeln ---------- */
const mult=()=>Math.min(15,1+Math.floor(combo/5));
const comboMax=()=>Math.max(1.15,2.3-runT*.012);
const MILE={5:'Sauber!',10:'Leiwand!',20:'Oida!',35:'Wahnsinn!',50:'Bist du deppert!',75:'Legende!',100:'Gottgleich!'};
const MULTI=['','','Doppel!','Tripel!','Quadrupel!','Kehraus!'];
const BOOST_AT={20:1,45:1,70:1};                 // ×5, ×10, ×15 zünden Vollgas
const GRAZE=28;                                  // Abstand über der Todesgrenze, der als "haarscharf" gilt
const reach=()=>RANGE*(boost>0?1.5:1);
const bonusMul=()=>frenzy>0?2:1;
function checkRecord(){
  if(best>0&&!recordHit&&score>best){recordHit=true;call('Neuer Rekord!',C.you);for(let j=0;j<4;j++)tone(note(10+j),.25,'square',.05,0,j*.07);}}
/* Serie läuft aus: ab 5 Treffern wird sie gutgeschrieben statt zu verfallen */
function bank(){
  if(combo<5)return;
  const pts=combo*5*mult()*bonusMul();score+=pts;punch=1;
  call('Einkassiert! +'+fmt(pts),C.you);
  floats.push({x:p.x,y:p.y-60,text:'+'+fmt(pts),life:1.1,col:C.you,big:true});
  for(let j=0;j<4;j++)tone(note(7+j*2),.18,'triangle',.06,0,j*.05);
  checkRecord();
}
/* Gegner ganz knapp vorbeigelassen und überlebt */
function graze(e){
  const pts=5*mult()*bonusMul();score+=pts;
  if(combo>0)comboT=Math.min(comboMax(),comboT+.4);
  floats.push({x:e.x,y:e.y-20,text:'Haarscharf +'+fmt(pts),life:.8,col:C.igel,big:false});
  burst(p.x,p.y,C.igel,8,260);tone(1500,.07,'sine',.04,2200);
  checkRecord();
}
function call(text,col){calls.push({text,col:col||C.you,t:0});if(calls.length>2)calls.shift();}
function burst(x,y,col,n,spd){for(let i=0;i<n&&parts.length<700;i++){const a=rnd(0,6.283),s=rnd(.2,1)*spd;
  parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.25,.7),max:.7,col,size:rnd(2,5)});}}

function spawn(kind){
  let x,y,tries=0;
  do{const side=Math.random()*4|0;
    x=side===0?-30:side===1?W+30:rnd(0,W);y=side===2?-30:side===3?H+30:rnd(0,H);
  }while(Math.hypot(x-p.x,y-p.y)<380&&++tries<8);
  const e={k:kind,x,y,vx:0,vy:0,age:0,seed:rnd(0,99),r:16,pts:10,spd:0,warn:0,ph:0};
  if(kind==='d'){e.spd=75+Math.min(95,runT*1.2)+rnd(0,30);
    if(st==='play'&&runT>5&&Math.random()<BOUNTY_CHANCE){e.crown=1;e.pts=50;}}   // Kopfgeld: ×5 wert
  else if(kind==='r'){e.r=14;e.pts=30;e.warn=.85;e.spd=Math.min(820,540+runT*2.5);
    const a=Math.atan2(p.y-y,p.x-x)+rnd(-.08,.08);e.dx=Math.cos(a);e.dy=Math.sin(a);}
  else if(kind==='i'){e.r=21;e.pts=25;e.spd=55+Math.min(60,runT*.7);e.ph=rnd(0,1);}
  else if(kind==='g'){e.r=15;e.pts=250;e.life=6.5;
    do{e.x=rnd(120,W-120);e.y=rnd(110,H-110);}while(Math.hypot(e.x-p.x,e.y-p.y)<260);
    const a=rnd(0,6.283);e.vx=Math.cos(a)*90;e.vy=Math.sin(a)*90;}
  foes.push(e);
}
const spiky=e=>e.k==='i'&&(e.ph%2.7)>1.55;
const spikeAmt=e=>{const t=e.ph%2.7;return t<1.25?0:t<1.55?(t-1.25)/.3:t<2.55?1:1-(t-2.55)/.15;};

function reset(){
  foes=[];parts=[];floats=[];trails=[];calls=[];
  p.x=W/2;p.y=H/2;runT=0;score=0;shown=0;combo=0;comboT=0;bestCombo=0;kills=0;dashes=0;hits=0;
  cd=0;inv=.6;frenzy=0;boost=0;hitStop=0;spawnT=.2;goldT=rnd(11,17);recordHit=false;
  slow=0;clearCd=0;lvl=1;rings=[];
}

/* ---------- Gerettet!, Feld leergeräumt, Stufen ---------- */
const BOUNTY_CHANCE=.04;                         // Anteil Verfolger mit Krone (ab 5 s)
const RESCUE_AT=.3;                              // Serien-Timer unter 30 % = „rot“
function rescue(){
  const pts=20*mult()*bonusMul();score+=pts;
  call('Gerettet!',C.foe);
  floats.push({x:p.x,y:p.y-84,text:'Gerettet +'+fmt(pts),life:1,col:C.foe,big:true});
  rings.push({x:p.x,y:p.y,r:24,max:130,life:.4,dur:.4,col:'255,93,115'});
  tone(392,.24,'triangle',.07,1568);tone(1175,.2,'sine',.05,0,.09);
  Music.accent('rescue');
}
/* Kein feindlicher Gegner mehr im Bild */
const onField=e=>e.x>-e.r&&e.x<W+e.r&&e.y>-e.r&&e.y<H+e.r;
function fieldClear(){
  clearCd=4;slow=.8;spawnT=Math.max(spawnT,1.2);punch=1;
  const pts=100*mult()*bonusMul();score+=pts;
  call('Sauber gmacht!',C.you);
  floats.push({x:W/2,y:H/2+60,text:'Feld leer +'+fmt(pts),life:1.3,col:C.you,big:true});
  rings.push({x:p.x,y:p.y,r:30,max:1500,life:.9,dur:.9,col:'255,210,63'});
  if(!calm)flash=Math.max(flash,.25);
  [0,4,7,12].forEach((s,j)=>tone(330*Math.pow(2,(s+12)/12),.4,'triangle',.05,0,j*.06));
  Music.accent('clear');
}
function lvlUp(){
  call('Stufe '+lvl+'!',C.ink);
  spawnT=Math.max(spawnT,2);                     // 2 s Atempause
  rings.push({x:W/2,y:H/2,r:40,max:900,life:1,dur:1,col:'246,239,255'});
  [0,7,12].forEach((s,j)=>tone(440*Math.pow(2,s/12),.35,'square',.035,0,j*.1));
  Music.accent('lvl');
}
function start(){wake();reset();attempt++;st='play';$('ov').hidden=true;
  for(let i=0;i<4;i++)spawn('d');tone(440,.1,'triangle',.07,880);}

function segDist(px,py,x1,y1,x2,y2){const dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy||1;
  let t=((px-x1)*dx+(py-y1)*dy)/l;t=Math.max(0,Math.min(1,t));
  return{d:Math.hypot(px-(x1+dx*t),py-(y1+dy*t)),t};}

function dash(){
  if(st!=='play'||cd>0)return;
  let dx=aim.x-p.x,dy=aim.y-p.y;const d=Math.hypot(dx,dy);if(d<6)return;
  const L=Math.min(d,reach()),sx=p.x,sy=p.y;
  const ex=Math.max(18,Math.min(W-18,sx+dx/d*L)),ey=Math.max(18,Math.min(H-18,sy+dy/d*L));
  dashes++;
  const hit=[];let fatal=null;
  for(const e of foes){const q=segDist(e.x,e.y,sx,sy,ex,ey);
    if(q.d<e.r+15){if(spiky(e)){if(!fatal||q.t<fatal.t)fatal={e,t:q.t};}else hit.push({e,t:q.t});}}
  if(fatal){const fx=sx+(ex-sx)*fatal.t,fy=sy+(ey-sy)*fatal.t;
    trails.push({x1:sx,y1:sy,x2:fx,y2:fy,life:.22,b:boost>0});p.x=fx;p.y=fy;die('Aufgespießt');return;}
  trails.push({x1:sx,y1:sy,x2:ex,y2:ey,life:.22,b:boost>0});p.x=ex;p.y=ey;
  if(!hit.length){cd=boost>0?0:frenzy>0?.08:.38;inv=.08;hiss(.12,.05,900);return;}
  hit.sort((a,b)=>a.t-b.t);hits++;cd=0;inv=.24;
  const n=hit.length,saved=combo>=5&&comboT<comboMax()*RESCUE_AT;
  const wasOnField=hit.some(h=>h.e.k!=='g'&&onField(h.e));
  hit.forEach((h,i)=>{const e=h.e,close=Math.hypot(e.x-sx,e.y-sy)<e.r+72;
    combo++;kills++;bestCombo=Math.max(bestCombo,combo);
    const pts=e.pts*mult()*n*(close?2:1)*(frenzy>0?2:1);score+=pts;
    floats.push({x:e.x,y:e.y-18,text:'+'+fmt(pts),life:.9,col:close?C.you:C.ink,big:close||n>1});
    if(close)floats.push({x:e.x,y:e.y-44,text:'KNAPP ×2',life:.8,col:C.you});
    burst(e.x,e.y,e.k==='g'?C.gold:e.k==='i'?C.igel:e.k==='r'?C.run:C.foe,24,520);
    tone(note(Math.min(combo,22)),.14,'triangle',.08,0,i*.045);
    if(e.k==='g'){frenzy=5;call('Rausch!',C.gold);for(let j=0;j<5;j++)tone(note(8+j*2),.2,'sine',.06,0,j*.06);Music.accent('gold');}
    if(e.crown){call('Kopfgeld!',C.gold);burst(e.x,e.y,C.gold,30,600);
      tone(1319,.08,'square',.04,0,.02);tone(1760,.3,'square',.04,0,.09);}
    if(MILE[combo]){call(MILE[combo]+'  ×'+mult());tone(note(5),.3,'square',.04,0,.05);tone(note(9),.3,'square',.04,0,.12);}
    if(BOOST_AT[combo]){boost=4;call('Vollgas!',C.igel);for(let j=0;j<6;j++)tone(note(5+j*2),.16,'sawtooth',.035,0,.15+j*.04);}
    foes.splice(foes.indexOf(e),1);});
  comboT=comboMax();punch=1;
  if(n>=2)call(MULTI[Math.min(n,5)],C.ink);
  hiss(.08,.07,2500);
  hitStop=.045+.018*Math.min(n,4);
  if(!calm){shake=Math.min(1,.3+.14*n);flash=Math.min(.22,.06+.04*n);}
  if(saved)rescue();
  if(wasOnField&&clearCd<=0&&runT>3&&!foes.some(e=>e.k!=='g'&&onField(e)))fieldClear();
  checkRecord();
}
function die(why){
  if(st!=='play')return;reason=why;st='dying';dieT=.75;
  burst(p.x,p.y,C.you,60,700);burst(p.x,p.y,C.ink,30,400);
  tone(300,.6,'sawtooth',.08,40);hiss(.4,.12,300);if(!calm){shake=1;flash=.3;}
}
function over(){
  st='over';overLock=.35;const old=best,rec=score>old;
  if(rec){best=score;try{localStorage.setItem('zack.best',best)}catch(e){}}
  const gap=old-score;
  $('ovTitle').textContent=rec&&old>0?'Neuer Rekord!':(!rec&&old>0&&score>=old*.8)?'So knapp!':reason+'!';
  $('ovSub').textContent=fmt(score)+' Punkte · '+(rec?(old>0?fmt(score-old)+' über dem alten Rekord':'dein erster Rekord')
    :old<=0?'noch kein Rekord, da geht was':(score>=old*.8?'nur '+fmt(gap)+' am Rekord vorbei':'Rekord: '+fmt(old)+', dir fehlen '+fmt(gap)));
  $('sCombo').textContent=bestCombo;$('sKills').textContent=kills;
  $('sAcc').textContent=(dashes?Math.round(hits/dashes*100):0)+' %';$('sTime').textContent=Math.round(runT)+' s';
  /* Gesamtpunkte für Spurfarben */
  const before=total;total+=score;try{localStorage.setItem('zack.total',total)}catch(e){}
  const fresh=SKINS.filter(s=>s.need>before&&s.need<=total),next=SKINS.find(s=>s.need>total);
  $('ovUnlock').innerHTML=fresh.length?'Neue Spurfarbe frei: <b>'+fresh.map(s=>s.name).join(', ')+'</b>! Im Menü auswählen.'
    :next?'Noch <b>'+fmt(next.need-total)+'</b> Punkte bis zur Spurfarbe <b>'+next.name+'</b>':'Alle Spurfarben freigespielt. Respekt!';
  $('ovUnlock').classList.toggle('new',fresh.length>0);
  $('ovMenu').hidden=true;$('ovResult').hidden=false;$('ov').classList.remove('menu-on','how');$('ov').hidden=false;
}

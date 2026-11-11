'use strict';
/* Zack: Regeln, Gegner-Spawn, Sprung, Tod, Ergebnis */
/* ---------- Regeln ---------- */
const mult=()=>Math.min(15,1+Math.floor(combo/5));
const comboMax=()=>Math.max(1.15,2.3-runT*.012);
const MILE={5:'Nice!',10:'Sweet!',20:'Whoa!',35:'Insane!',50:'Are you kidding?!',75:'Legendary!',100:'Godlike!'};
const MULTI=['','','Double!','Triple!','Quad!','Rampage!'];
const BOOST_AT={20:1,45:1,70:1};                 // ×5, ×10, ×15 zünden Vollgas
const BOOST_EXT=.3,BOOST_MAX=8;                  // jeder Treffer im Overdrive verlängert um 0,3 s, höchstens auf 8 s
const GRAZE=28;                                  // Abstand über der Todesgrenze, der als "haarscharf" gilt
const reach=()=>RANGE*(boost>0?1.5:1);
const bonusMul=()=>frenzy>0?2:1;
function checkRecord(){
  if(best>0&&!recordHit&&score>best){recordHit=true;call('New Best!',C.you);for(let j=0;j<4;j++)tone(note(10+j),.25,'square',.05,0,j*.07);}}
/* Serie läuft aus: ab 5 Treffern wird sie gutgeschrieben statt zu verfallen */
function bank(){
  if(combo<5)return;
  const pts=combo*5*mult()*bonusMul();score+=pts;punch=1;
  call('Cashed In +'+fmt(pts),C.you,1);
  for(let j=0;j<4;j++)tone(note(7+j*2),.18,'triangle',.06,0,j*.05);
  checkRecord();
}
/* Gegner ganz knapp vorbeigelassen und überlebt */
function graze(e){
  const pts=5*mult()*bonusMul();score+=pts;
  if(combo>0)comboT=Math.min(comboMax(),comboT+.4);
  floats.push({x:e.x,y:e.y-20,text:'Close Call +'+fmt(pts),life:.8,col:C.igel,small:true});
  burst(p.x,p.y,C.igel,8,260);tone(1500,.07,'sine',.04,2200);
  checkRecord();
}
/* Meldungen: groß = Mitte, eine zur Zeit (max. 2 warten); klein = kurz beim Spieler */
function call(text,col,small){
  if(small){floats.push({x:p.x,y:p.y-64,text,life:.9,col:col||C.you,small:true});return;}
  calls.push({text,col:col||C.you,t:0});if(calls.length>3)calls.splice(1,1);
}
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
  else if(kind==='u'){e.r=16;e.pts=0;e.life=UNTOUCH_LIFE;
    do{e.x=rnd(120,W-120);e.y=rnd(110,H-110);}while(Math.hypot(e.x-p.x,e.y-p.y)<240);
    const a=rnd(0,6.283);e.vx=Math.cos(a)*60;e.vy=Math.sin(a)*60;}
  else if(kind==='g'){e.r=15;e.pts=250;e.life=6.5;
    do{e.x=rnd(120,W-120);e.y=rnd(110,H-110);}while(Math.hypot(e.x-p.x,e.y-p.y)<260);
    const a=rnd(0,6.283);e.vx=Math.cos(a)*90;e.vy=Math.sin(a)*90;}
  foes.push(e);
}
const spiky=e=>e.k==='i'&&(e.ph%2.7)>1.55;
const spikeAmt=e=>{const t=e.ph%2.7;return t<1.25?0:t<1.55?(t-1.25)/.3:t<2.55?1:1-(t-2.55)/.15;};

function reset(){
  foes=[];parts=[];floats=[];trails=[];calls=[];
  p.x=W/2;p.y=H/2;runT=0;score=0;shown=0;combo=0;comboT=0;bestCombo=0;kills=0;dashes=0;hits=0;aimDash=0;aimHit=0;flowT=0;
  cd=0;inv=.6;frenzy=0;boost=0;hitStop=0;spawnT=.2;goldT=rnd(11,17);recordHit=false;
  slow=0;clearCd=0;lvl=1;rings=[];dashBuf=0;readyFlash=0;untouch=0;untT=rnd(UNTOUCH_FIRST[0],UNTOUCH_FIRST[1]);
}

/* ---------- Gerettet!, Feld leergeräumt, Stufen ---------- */
/* ---------- Arena-Fluss ---------- */
/* Gibt es etwas, das du gleich treffen kannst? (Dasher in der Vorwarnung zählt nicht) */
function targetNear(){
  const r=reach()+HOLD_RANGE;
  for(const e of foes){if(e.k==='r'&&e.warn>0)continue;if(Math.hypot(e.x-p.x,e.y-p.y)<r)return true;}
  return false;
}
/* Nachschub-Chaser: jeder zweite erscheint nah (300–360) und materialisiert kurz, sonst normal am Rand */
function refillChaser(){
  spawn('d');const e=foes[foes.length-1];
  if(Math.random()<.5)for(let i=0;i<12;i++){const a=rnd(0,6.283),d=rnd(NEAR_SPAWN[0],NEAR_SPAWN[1]),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d;
    if(x>60&&x<W-60&&y>60&&y<H-60){e.x=x;e.y=y;e.spawnIn=SPAWN_IN;e.vx=e.vy=0;
      rings.push({x,y,r:6,max:46,life:SPAWN_IN,dur:SPAWN_IN,col:'255,93,115'});tone(880,.08,'sine',.025,440);break;}}
}
/* Todesgründe für den Ergebnis-Screen */
const CAUSE={Caught:'Eaten by a Chaser',Flattened:'Run over by a Dasher',Skewered:'Skewered by a Spiky'};
let killer='d',endT=0,endBest=0;
const BOUNTY_CHANCE=.04;                         // Anteil Verfolger mit Krone (ab 5 s)
const RESCUE_AT=.3;                              // Serien-Timer unter 30 % = „rot“
function rescue(){
  const pts=20*mult()*bonusMul();score+=pts;
  call('Clutch +'+fmt(pts),C.foe,1);
  rings.push({x:p.x,y:p.y,r:24,max:130,life:.4,dur:.4,col:'255,93,115'});
  tone(392,.24,'triangle',.07,1568);tone(1175,.2,'sine',.05,0,.09);
  Music.accent('rescue');
}
/* Kein feindlicher Gegner mehr im Bild */
const onField=e=>e.x>-e.r&&e.x<W+e.r&&e.y>-e.r&&e.y<H+e.r;
function fieldClear(){
  clearCd=4;slow=.8;spawnT=Math.max(spawnT,1.2);punch=1;
  const pts=100*mult()*bonusMul();score+=pts;
  call('Clean Sweep!',C.you);
  floats.push({x:W/2,y:H/2+60,text:'Field cleared +'+fmt(pts),life:1.3,col:C.you,big:true});
  rings.push({x:p.x,y:p.y,r:30,max:1500,life:.9,dur:.9,col:'255,210,63'});
  if(!calm)flash=Math.max(flash,.25);
  [0,4,7,12].forEach((s,j)=>tone(330*Math.pow(2,(s+12)/12),.4,'triangle',.05,0,j*.06));
  Music.accent('clear');
}
function lvlUp(){
  call('Level '+lvl+'!',C.ink);
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
  if(st!=='play')return;
  if(cd>0){dashBuf=cd+BUFFER_T;return;}          // während der Pause geklickt: merken, springt sobald bereit
  let dx=aim.x-p.x,dy=aim.y-p.y;const d=Math.hypot(dx,dy);if(d<6)return;
  const L=Math.min(d,reach()),sx=p.x,sy=p.y;
  const ex=Math.max(18,Math.min(W-18,sx+dx/d*L)),ey=Math.max(18,Math.min(H-18,sy+dy/d*L));
  dashes++;
  /* zählt für Aim nur, wenn beim Absprung ein Gegner in Sprungweite war (Versetz-Sprünge ins Leere zählen nicht) */
  const aimed=foes.some(e=>!(e.k==='r'&&e.warn>0)&&Math.hypot(e.x-p.x,e.y-p.y)<reach()+e.r);
  if(aimed)aimDash++;
  const hit=[];let fatal=null;
  for(const e of foes){const q=segDist(e.x,e.y,sx,sy,ex,ey);
    if(q.d<e.r+15){if(spiky(e)&&untouch<=0){if(!fatal||q.t<fatal.t)fatal={e,t:q.t};}else hit.push({e,t:q.t});}}
  if(fatal){const fx=sx+(ex-sx)*fatal.t,fy=sy+(ey-sy)*fatal.t;
    trails.push({x1:sx,y1:sy,x2:fx,y2:fy,life:.22,b:boost>0});p.x=fx;p.y=fy;die('Skewered');return;}
  trails.push({x1:sx,y1:sy,x2:ex,y2:ey,life:.22,b:boost>0});p.x=ex;p.y=ey;
  if(!hit.length){cd=boost>0?0:frenzy>0?.08:.38;cdMax=cd;inv=.08;hiss(.12,.05,900);return;}
  hit.sort((a,b)=>a.t-b.t);hits++;if(aimed)aimHit++;cd=0;inv=.24;
  const n=hit.length,saved=combo>=5&&comboT<comboMax()*RESCUE_AT;
  const wasOnField=hit.some(h=>h.e.k!=='g'&&onField(h.e));
  let sum=0,closeN=0,special=false;
  hit.forEach((h,i)=>{const e=h.e;
    if(e.k==='u'){startUntouch(e);foes.splice(foes.indexOf(e),1);return;}
    const close=Math.hypot(e.x-sx,e.y-sy)<e.r+72;
    combo++;kills++;bestCombo=Math.max(bestCombo,combo);
    const pts=e.pts*mult()*n*(close?2:1)*(frenzy>0?2:1);score+=pts;sum+=pts;if(close)closeN++;
    if(e.k==='g'||e.crown)special=true;
    burst(e.x,e.y,e.k==='g'?C.gold:e.k==='i'?C.igel:e.k==='r'?C.run:C.foe,24,520);
    tone(note(Math.min(combo,22)),.14,'triangle',.08,0,i*.045);
    if(e.k==='g'){frenzy=5;call('Gold Rush!',C.gold);for(let j=0;j<5;j++)tone(note(8+j*2),.2,'sine',.06,0,j*.06);Music.accent('gold');}
    if(e.crown){call('Bounty ×5',C.gold,1);burst(e.x,e.y,C.gold,30,600);
      tone(1319,.08,'square',.04,0,.02);tone(1760,.3,'square',.04,0,.09);}
    if(MILE[combo]){call(MILE[combo]+'  ×'+mult());tone(note(5),.3,'square',.04,0,.05);tone(note(9),.3,'square',.04,0,.12);}
    if(boost>0)boost=Math.min(BOOST_MAX,boost+BOOST_EXT);   // Treffer im Overdrive verlängern ihn
    if(BOOST_AT[combo]){boost=Math.max(boost,4);call('Overdrive!',C.igel);for(let j=0;j<6;j++)tone(note(5+j*2),.16,'sawtooth',.035,0,.15+j*.04);}
    foes.splice(foes.indexOf(e),1);});
  comboT=comboMax();punch=1;
  /* eine Zahl für den ganzen Sprung; Boni hängen als Marke dran */
  floats.push({x:ex,y:ey-40,text:'+'+fmt(sum)+(closeN?'  ·  point blank ×2':''),life:.9,col:closeN?C.you:C.ink,big:n>1||closeN>0});
  if(n>=2)call(MULTI[Math.min(n,5)],C.ink,n<4);    // Double/Triple klein, Quad/Rampage groß
  hiss(.08,.07,2500);
  hitStop=.045+.018*Math.min(n,4);
  if(!calm&&(n>=2||special)){shake=Math.min(1,.3+.14*n);flash=Math.min(.22,.06+.04*n);}   // Einzeltreffer: nur Partikel und Ton
  if(saved)rescue();
  if(wasOnField&&clearCd<=0&&runT>3&&!foes.some(e=>e.k!=='g'&&onField(e)))fieldClear();
  checkRecord();
}
/* ---------- Untouchable ---------- */
function startUntouch(e){
  untouch=UNTOUCH_T;call('Untouchable!','#ffffff');
  burst(e.x,e.y,'#ffffff',40,650);rings.push({x:p.x,y:p.y,r:20,max:260,life:.6,dur:.6,col:'246,239,255'});
  if(!calm)flash=Math.max(flash,.3);
  [0,4,7,12,16].forEach((s,j)=>tone(523*Math.pow(2,s/12),.25,'triangle',.05,0,j*.05));
  Music.accent('gold');
}
/* Gegner berührt dich, während du unverwundbar bist: er zerplatzt und zählt als Treffer */
function popFoe(e){
  combo++;kills++;bestCombo=Math.max(bestCombo,combo);
  const pts=e.pts*mult()*(frenzy>0?2:1);score+=pts;
  floats.push({x:e.x,y:e.y-18,text:'+'+fmt(pts),life:.7,col:'#ffffff',small:true});
  burst(e.x,e.y,e.k==='i'?C.igel:e.k==='r'?C.run:C.foe,22,520);burst(e.x,e.y,'#ffffff',8,300);
  tone(note(Math.min(combo,22)),.12,'triangle',.07);
  comboT=comboMax();punch=1;
  if(boost>0)boost=Math.min(BOOST_MAX,boost+BOOST_EXT);
  if(e.crown){call('Bounty ×5',C.gold,1);}
  if(MILE[combo]){call(MILE[combo]+'  ×'+mult());tone(note(5),.3,'square',.04,0,.05);tone(note(9),.3,'square',.04,0,.12);}
  if(BOOST_AT[combo]){boost=Math.max(boost,4);call('Overdrive!',C.igel);for(let j=0;j<6;j++)tone(note(5+j*2),.16,'sawtooth',.035,0,.15+j*.04);}
  checkRecord();
}
function die(why){
  if(st!=='play'||untouch>0)return;reason=why;killer=why==='Flattened'?'r':why==='Skewered'?'i':'d';endT=0;st='dying';dieT=.75;
  burst(p.x,p.y,C.you,60,700);burst(p.x,p.y,C.ink,30,400);
  tone(300,.6,'sawtooth',.08,40);hiss(.4,.12,300);if(!calm){shake=1;flash=.3;}
}
function over(){
  st='over';overLock=.35;const old=best,rec=score>old;
  if(rec){best=score;try{localStorage.setItem('zack.best',best)}catch(e){}}
  const gap=old-score;
  /* Titel = Todesgrund; bei Rekord oder knapp verfehlt steht der Grund klein darunter */
  const cause=CAUSE[reason]||reason;
  const title=rec&&old>0?'New Best!':(!rec&&old>0&&score>=old*.8)?'So close!':cause+'!';
  $('ovTitle').textContent=title;$('ovCause').textContent=title===cause+'!'?'':cause;
  $('ovSub').textContent=rec?(old>0?'Best beaten by '+fmt(score-old)+' · old best '+fmt(old):'Your first best')
    :old<=0?'No best yet – go for it':'Best '+fmt(old)+'  ·  '+(gap===0?'tied with your best':score>=old*.8?'only '+fmt(gap)+' short':fmt(gap)+' to go');
  endBest=rec?score:old;$('ovBestBar').parentNode.classList.toggle('rec',rec);
  $('sCombo').textContent=bestCombo;$('sKills').textContent=kills;
  $('sAcc').textContent=(aimDash?Math.round(aimHit/aimDash*100):0)+'%';$('sFlow').textContent=(runT>0?Math.round(flowT/runT*100):0)+'%';
  $('sTime').textContent=Math.round(runT)+' s';
  /* Gesamtpunkte für Spurfarben */
  const before=total;total+=score;try{localStorage.setItem('zack.total',total)}catch(e){}
  const fresh=SKINS.filter(s=>s.need>before&&s.need<=total),next=SKINS.find(s=>s.need>total);
  $('ovUnlock').innerHTML=fresh.length?'New trail unlocked: <b>'+fresh.map(s=>s.name).join(', ')+'</b>! Pick it in the menu.'
    :next?'<b>'+fmt(next.need-total)+'</b> more points to unlock the <b>'+next.name+'</b> trail':'All trails unlocked. Respect!';
  $('ovUnlock').classList.toggle('new',fresh.length>0);
  $('ovMenu').hidden=true;$('ovResult').hidden=false;$('ov').classList.remove('menu-on','how');$('ov').classList.add('end-on');$('ov').hidden=false;
}

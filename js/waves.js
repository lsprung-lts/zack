'use strict';
/* Zack: Wellen in der Arena
   Eine Welle endet, sobald alle ihre Gegner weg sind (Spielertempo statt Uhr).
   Danach kurze Pause: Combo bleibt stehen, Musik fällt zurück und baut auf, zum Start der nächsten Welle kommt der Drop.
   Wer unter der Zielzeit (Par) räumt, bekommt Zeitbonus und eine Shockwave für die nächste Welle.
   Jede frühe Welle bringt etwas Neues, danach gemischt mit etwas Zufall. */

const BREAK_T=2.6;                 // Pause zwischen den Wellen (s)
let WAVE_HEAT=6;                   // eine Welle entspricht so viel „Spielzeit“ für Gegnertempo (per Bot abgestimmt)
const SHOCK_R=170;                 // Radius der Shockwave um den Landepunkt
/* Abstimmung (per Bot): Gegnerzahl ab Welle 6 = COUNT[0] + n·COUNT[1] (max COUNT[2]),
   Nachschub-Takt = max(SPAWN[2], SPAWN[0] − n·SPAWN[1]), Anteil Dasher/Spiky wächst bis DANGER,
   Zielzeit = PAR[0] + erwartete Gegnerzahl · PAR[1] */
let COUNT=[8,2.5,42],SPAWN=[.3,.016,.08],DANGER=[.3,.28],PAR=[1.5,.38];   // Bot (12 Runden): ~67 s Median, Welle ~7, ~50 % unter Par
const expCount=n=>n<=5?[5,7,8,9,11][n-1]:Math.min(COUNT[2],Math.round(COUNT[0]+n*COUNT[1]));
const par=n=>PAR[0]+expCount(n)*PAR[1];   // Zielzeit für Welle n (s)
const heat=()=>Math.max(0,(wave-1)*WAVE_HEAT);

let wave=0,wavePhase='break',waveT=0,breakT=0,queue=[],queueT=0,waveTimes={},shockReady=false,shockEarned=false,shockKills=0,parClears=0;

function wavesReset(){wave=0;wavePhase='break';waveT=0;breakT=1.2;queue=[];queueT=0;waveTimes={};shockReady=false;shockEarned=false;shockKills=0;parClears=0;}

/* Zusammensetzung: Liste von {k, crown} */
function waveList(n){
  const L=[],d=(c)=>L.push({k:'d',crown:c?1:0}),add=(k)=>L.push({k});
  if(n===1){for(let i=0;i<5;i++)d();}
  else if(n===2){for(let i=0;i<6;i++)d();add('r');}
  else if(n===3){for(let i=0;i<6;i++)d();add('i');add('i');}
  else if(n===4){for(let i=0;i<7;i++)d();add('r');add('g');}
  else if(n===5){for(let i=0;i<6;i++)d();for(let i=0;i<3;i++)d(1);add('r');add('r');}
  else{
    const swarm=n%7===0,bounty=n%5===0,cnt=Math.min(Math.round(COUNT[2]*1.3),Math.round(expCount(n)*(swarm?1.3:1)));
    const pR=swarm?0:Math.min(DANGER[0],.06+n*.01),pI=swarm?0:Math.min(DANGER[1],.05+n*.012),pC=bounty?.3:.06;
    for(let i=0;i<cnt;i++){const r=Math.random();if(r<pR)add('r');else if(r<pR+pI)add('i');else d(Math.random()<pC);}
    if(Math.random()<.35)add('g');
  }
  for(let i=L.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[L[i],L[j]]=[L[j],L[i]];}   // Reihenfolge mischen
  return L;
}
const waveName=n=>n===5||(n>5&&n%5===0)?'Bounty Wave!':n>5&&n%7===0?'Swarm!':null;

/* Gegner erscheint mit rotem Ring an einer freien Stelle in 280–520 Abstand (Dasher: am Rand mit Warnlinie) */
function spawnAt(s){
  spawn(s.k);const e=foes[foes.length-1];
  if(s.k==='d'){e.crown=s.crown;e.pts=s.crown?50:10;}
  if(s.k==='d'||s.k==='i')for(let i=0;i<16;i++){const a=rnd(0,6.283),dd=rnd(280,520),x=p.x+Math.cos(a)*dd,y=p.y+Math.sin(a)*dd;
    if(x>50&&x<W-50&&y>50&&y<H-50){e.x=x;e.y=y;e.spawnIn=SPAWN_IN;e.vx=e.vy=0;
      rings.push({x,y,r:6,max:46,life:SPAWN_IN,dur:SPAWN_IN,col:s.crown?'255,210,63':'255,93,115'});break;}}
}
/* Shockwave-Kristall als Belohnung */
function spawnShock(){
  for(let i=0;i<20;i++){const a=rnd(0,6.283),dd=rnd(170,280),x=p.x+Math.cos(a)*dd,y=p.y+Math.sin(a)*dd;
    if(x>70&&x<W-70&&y>70&&y<H-70){foes.push({k:'s',x,y,vx:0,vy:0,age:0,seed:rnd(0,99),r:17,pts:0,spd:0,warn:0,ph:0});
      rings.push({x,y,r:10,max:80,life:.6,dur:.6,col:'92,225,230'});return;}}
}

const hostile=e=>e.k==='d'||e.k==='i'||e.k==='r';

function nextWave(){
  wave++;wavePhase='fight';waveT=0;queue=waveList(wave);queueT=.15;lvl=wave;
  const nm=waveName(wave);call('Wave '+wave+'!',C.ink);if(nm)setTimeout(()=>{if(st==='play')call(nm,C.gold);},450);
  if(shockEarned){shockEarned=false;spawnShock();}
  Music.setBreak(false);Music.accent('lvl');
  [0,7,12].forEach((s,j)=>tone(440*Math.pow(2,s/12),.3,'square',.035,0,j*.08));
}
function waveClear(){
  const t=waveT,n=wave,under=t<par(n);
  waveTimes[n]=t;
  let pts=50*n*mult()*bonusMul();
  if(under){pts+=Math.round((par(n)-t)*25*n)*mult();parClears++;shockEarned=true;}
  score+=pts;punch=1;slow=.7;
  call('Wave '+n+' cleared!',C.you);
  floats.push({x:W/2,y:H/2+40,text:t.toFixed(1)+' s'+(under?'  ·  under par!':''),life:1.6,col:under?C.igel:C.ink,big:true});
  floats.push({x:W/2,y:H/2+80,text:'+'+fmt(pts),life:1.6,col:C.you,big:true});
  if(under)setTimeout(()=>{if(st==='play')call('Shockwave earned!',C.igel);},500);
  rings.push({x:p.x,y:p.y,r:30,max:1500,life:.9,dur:.9,col:'255,210,63'});
  if(!calm)flash=Math.max(flash,.25);
  [0,4,7,12].forEach((s,j)=>tone(330*Math.pow(2,(s+12)/12),.4,'triangle',.05,0,j*.06));
  Music.accent('clear');Music.setBreak(true,BREAK_T);
  wavePhase='break';breakT=BREAK_T;
  checkRecord();
}
/* pro Frame im Spiel */
function waveTick(dt){
  if(wavePhase==='break'){breakT-=dt;if(breakT<=0)nextWave();return;}
  waveT+=dt;
  if(queue.length){queueT-=dt;if(queueT<=0){spawnAt(queue.shift());queueT=Math.max(SPAWN[2],SPAWN[0]-wave*SPAWN[1]);}}
  else if(!foes.some(hostile))waveClear();
}

/* Shockwave: alles im Umkreis des Landepunkts kommt zum Treffer dazu */
function shockTargets(x,y,hit){
  const have=new Set(hit.map(h=>h.e)),out=[];
  for(const e of foes){if(have.has(e)||e.k==='s')continue;if(Math.hypot(e.x-x,e.y-y)<SHOCK_R+e.r)out.push({e,t:1});}
  return out;
}
function shockFx(x,y,n){
  shockKills=Math.max(shockKills,n);
  call('Shockwave!',C.igel);
  rings.push({x,y,r:20,max:SHOCK_R*1.4,life:.5,dur:.5,col:'92,225,230'},{x,y,r:10,max:SHOCK_R,life:.35,dur:.35,col:'246,239,255'});
  burst(x,y,C.igel,60,700);
  if(!calm){shake=1;flash=Math.max(flash,.3);}
  tone(110,.5,'sawtooth',.08,40);hiss(.5,.1,400);
}

/* ---------- Anzeige ---------- */
function drawShockCrystal(c,e){
  const s=1+Math.sin(clock*6+e.seed)*.1,r=e.r*s;
  c.rotate(clock*1.5);
  c.fillStyle='rgba(92,225,230,.25)';c.beginPath();c.arc(0,0,r+12,0,6.3);c.fill();
  c.fillStyle=C.igel;c.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();
  c.fillStyle='#fff';c.beginPath();for(let i=0;i<6;i++){const a=i/6*6.283+.52;c.lineTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);}c.closePath();c.fill();
}
/* oben rechts: Welle, Zeit gegen Par, verbleibende Gegner */
function waveHud(g){
  g.font='18px '+DISP;g.textAlign='right';
  g.fillStyle='rgba(246,239,255,.55)';g.fillText('Wave '+Math.max(1,wave),W-26,60);
  if(wavePhase==='fight'){
    const left=queue.length+foes.filter(hostile).length,pr=par(wave),fr=Math.min(1,waveT/pr),over=waveT>pr;
    g.font='600 14px "Outfit",sans-serif';g.fillStyle=over?'rgba(255,93,115,.85)':'rgba(92,225,230,.9)';
    g.fillText(waveT.toFixed(1)+' s  /  par '+pr.toFixed(1)+' s',W-26,84);
    g.fillStyle='rgba(246,239,255,.12)';g.fillRect(W-146,94,120,3);g.fillStyle=over?C.foe:C.igel;g.fillRect(W-146,94,120*fr,3);
    g.fillStyle='rgba(246,239,255,.5)';g.fillText(left+' left',W-26,114);
  }else if(st==='play'){
    g.textAlign='center';g.font='22px '+DISP;g.fillStyle='rgba(246,239,255,'+(.5+Math.sin(clock*8)*.2)+')';
    g.fillText('Get ready  ·  Wave '+(wave+1),W/2,H-70);
  }
  if(shockReady){g.textAlign='center';g.font='16px '+DISP;g.fillStyle=C.igel;g.fillText('Shockwave ready – your next dash explodes where it lands',W/2,H-100);}
  g.textAlign='center';
}

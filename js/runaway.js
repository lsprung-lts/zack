'use strict';
/* Zack: Runaway – Endlos-Runner
   Die Kamera fährt nach rechts, links rückt die Rauschwand „The Static“ nach (= linker Bildrand).
   Bewegen nur per Dash wie in der Arena; Treffer laden nach, also bringt eine Kette Vorsprung.
   Gegner stehen in Formationen in der Welt, Laser blocken Dashes außer an der Lücke.
   Alles in Weltkoordinaten; Bildschirm-x = Welt-x − camX. */

const UNIT=10;                 // 10 Welteinheiten = 1 Meter
const ZONE_M=400;              // Meter pro Zone
const WALL_X=46;               // Breite der Wand am linken Bildrand
const CAM_LEAD=.6;             // steht der Spieler rechts von 60 %, zieht die Kamera schneller mit
const PERFECT_WIN=.08;         // ±80 ms um den Beat gilt als „Perfect“
const STREAK={4:'In the Groove!',8:'On Fire!',12:'Unstoppable!',16:'Metronome!'};

let meters=0,zone=1,nextForm=0,perfects=0,perfStreak=0,bestStreak=0,bestRun=0,flagHit=false,escArmed=false,runGoldT=0,lastM=0;
let lasers=[];
try{bestRun=+localStorage.getItem('zack.best.run')||0}catch(e){}

/* Kamera-Grundtempo: steigt pro Zone und läuft im Takt der Musik mit (Tempo Ramp) */
const camSpeed=()=>(110+14*Math.min(zone-1,10))*(Music.bpm()/124);

function runReset(){
  camX=0;meters=0;lastM=0;zone=1;nextForm=W*.95;perfects=0;perfStreak=0;bestStreak=0;
  flagHit=false;escArmed=false;lasers=[];runGoldT=rnd(6,9);
}
/* Gegner an eine feste Weltposition setzen; still = steht in der Formation */
function mk(kind,x,y,still){
  spawn(kind);const e=foes[foes.length-1];e.x=x;e.y=Math.max(60,Math.min(H-60,y));
  if(still){e.still=1;e.vx=-1;e.vy=0;}
  return e;
}
function runStart(){
  p.x=W*.3;p.y=H/2;
  for(let i=0;i<4;i++)mk('d',W*.43+i*62,H/2,1);     // Einstieg: eine Reihe, der erste Dash trifft gleich mehrere
  nextForm=W*.43+4*62+260;
}

/* ---------- Formationen ---------- */
function formation(x0){
  const z=zone,yc=rnd(150,H-150),r=Math.random();
  let w=0;                                             // Breite der Formation in x
  const pick=(...opts)=>opts[Math.random()*opts.length|0];
  const kind=z<2?pick('line','diag','column','snake','hunt')
    :z<3?pick('line','diag','column','snake','hunt','spiky','laser','dasher')
    :pick('line','diag','snake','vee','hunt','spiky','laser','laser','dasher','dasher');
  if(kind==='line'){const n=3+(Math.random()*3|0);for(let i=0;i<n;i++)mk('d',x0+i*62,yc,1);w=n*62;}
  else if(kind==='diag'){const n=4,dy=r<.5?-55:55,y0=yc-dy*1.5;for(let i=0;i<n;i++)mk('d',x0+i*60,y0+i*dy,1);w=n*60;}
  else if(kind==='column'){const n=4;for(let i=0;i<n;i++)mk('d',x0,yc+(i-1.5)*62,1);w=40;}
  else if(kind==='snake'){const n=6;for(let i=0;i<n;i++)mk('d',x0+i*55,yc+Math.sin(i*.9)*85,1);w=n*55;}
  else if(kind==='vee'){for(let i=0;i<5;i++)mk('d',x0+Math.abs(i-2)*-55+110,yc+(i-2)*60,1);w=140;}
  else if(kind==='hunt'){const n=1+(z>2?1:0);for(let i=0;i<n;i++){const e=mk('d',x0+i*90,rnd(80,H-80),0);e.spd=60+z*10;}w=90*n;}
  else if(kind==='spiky'){const e=mk('i',x0+70,yc,1);mk('d',x0,yc,1);mk('d',x0+140,yc,1);e.ph=rnd(0,2.7);w=170;}
  else if(kind==='laser'){lasers.push({x:x0+30,gy:rnd(150,H-150),gh:Math.max(150,240-z*12),ph:rnd(0,6)});
    if(Math.random()<.6)mk('d',x0+120,rnd(100,H-100),1);w=140;}
  else if(kind==='dasher'){runDasher();w=60;}
  return w;
}
/* Dasher von oben/unten, zielt mit Vorwarnung auf den Spieler */
function runDasher(){
  spawn('r');const e=foes[foes.length-1],top=Math.random()<.5;
  e.x=camX+rnd(W*.45,W*.85);e.y=top?-30:H+30;
  const a=Math.atan2(p.y-e.y,p.x-e.x)+rnd(-.08,.08);e.dx=Math.cos(a);e.dy=Math.sin(a);
}
/* Laser: Dash wird vor dem Strahl gestoppt, außer er geht durch die Lücke */
function laserClip(sx,sy,ex,ey){
  let best=null;
  for(const l of lasers){
    if((l.x-sx)*(l.x-ex)>0||Math.abs(ex-sx)<1)continue;     // Strahl liegt nicht zwischen Start und Ziel
    const t=(l.x-sx)/(ex-sx),y=sy+(ey-sy)*t;
    if(Math.abs(y-l.gy)<=l.gh/2)continue;                   // durch die Lücke
    if(!best||t<best.t)best={t,l};
  }
  if(!best)return{x:ex,y:ey,blocked:false};
  const back=14/Math.max(1,Math.hypot(ex-sx,ey-sy)),t=Math.max(0,best.t-back);
  return{x:sx+(ex-sx)*t,y:sy+(ey-sy)*t,blocked:true};
}

/* ---------- Perfect auf dem Beat ---------- */
function runPerfect(){
  const off=Music.beatOffset();
  if(off===null||Math.abs(off)>PERFECT_WIN){perfStreak=0;return false;}
  perfects++;perfStreak++;bestStreak=Math.max(bestStreak,perfStreak);
  floats.push({x:p.x,y:p.y+40,text:'Perfect!',life:.7,col:C.igel,big:false});
  tone(1760,.06,'sine',.035,2640);
  if(STREAK[perfStreak]){call(STREAK[perfStreak],C.igel);rings.push({x:p.x,y:p.y,r:20,max:160,life:.45,dur:.45,col:'92,225,230'});}
  return true;
}

/* ---------- Pro Frame (nur in Runaway) ---------- */
function runTick(dt,rdt){
  /* Kamera: Grundtempo + mitziehen, wenn der Spieler weit vorn ist */
  camX+=camSpeed()*dt;
  const lead=p.x-camX-W*CAM_LEAD;if(lead>0)camX+=lead*ease(4,dt);
  meters=camX/UNIT;
  const dm=Math.floor(meters)-lastM;if(dm>0){score+=dm;lastM+=dm;}          // 1 Punkt pro Meter
  /* Zonen */
  const z=1+Math.floor(meters/ZONE_M);
  if(z>zone){zone=z;lvl=z;zoneUp();}
  /* Neue Formationen rechts außerhalb des Bildes */
  while(nextForm<camX+W+120){const w=formation(nextForm);nextForm+=w+rnd(230,360)-Math.min(90,zone*9);}
  /* Gold öfter als in der Arena, nahe der Wand: Risiko gegen Belohnung */
  runGoldT-=dt;if(runGoldT<=0){runGoldT=rnd(8,13);spawn('g');const e=foes[foes.length-1];
    e.x=camX+rnd(150,320);e.y=rnd(110,H-110);e.vx=0;e.vy=(Math.random()<.5?-1:1)*90;tone(1320,.25,'sine',.05,1760);}
  /* Aufräumen hinter der Wand */
  for(let i=foes.length-1;i>=0;i--)if(foes[i].x<camX-220&&foes[i].k!=='r')foes.splice(i,1);
  lasers=lasers.filter(l=>l.x>camX-60);
  for(const l of lasers)l.ph+=rdt;
  /* Rekord-Fahne */
  if(bestRun>0&&!flagHit&&meters>bestRun){flagHit=true;recordHit=true;call('New Best!',C.you);
    for(let j=0;j<4;j++)tone(note(10+j),.25,'square',.05,0,j*.07);rings.push({x:p.x,y:p.y,r:30,max:700,life:.8,dur:.8,col:'255,210,63'});}
  /* Die Wand */
  const gap=p.x-(camX+WALL_X);
  if(gap<70)escArmed=true;
  else if(escArmed&&gap>170){escArmed=false;escape();}
  if(gap<7&&inv<=0)die('Static');
}
function zoneUp(){
  call('Zone '+zone+'!',C.ink);
  rings.push({x:camX+W/2,y:H/2,r:40,max:900,life:1,dur:1,col:'246,239,255'});
  [0,7,12].forEach((s,j)=>tone(440*Math.pow(2,s/12),.35,'square',.035,0,j*.1));
  Music.zoneUp();Music.accent('lvl');
}
function escape(){
  const pts=30*mult()*bonusMul();score+=pts;
  call('Escape!',C.igel);
  floats.push({x:p.x,y:p.y-70,text:'Escape +'+fmt(pts),life:1,col:C.igel,big:true});
  tone(523,.12,'triangle',.06,1046);tone(1046,.2,'sine',.04,0,.08);
}

/* ---------- Zeichnen ---------- */
/* hinter allem, in Weltkoordinaten: pulsierende Bodenlinien, Meter-Marken, Rekord-Fahne, Laser */
function runDrawBack(g){
  const pulse=Music.pulse(),x0=Math.floor(camX/160)*160;
  g.lineWidth=2;
  for(let x=x0;x<camX+W+160;x+=160){
    const major=Math.round(x/UNIT)%1000===0;
    g.strokeStyle='rgba(246,239,255,'+((major?.1:.04)+.1*pulse)+')';
    g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();
  }
  g.font='600 13px "Outfit",sans-serif';g.textAlign='center';g.fillStyle='rgba(246,239,255,.25)';
  for(let m=Math.ceil(camX/UNIT/100)*100;m*UNIT<camX+W;m+=100)g.fillText(fmt(m)+' m',m*UNIT,H-14);
  if(bestRun>0){const fx=bestRun*UNIT;
    if(fx>camX-20&&fx<camX+W+20){g.strokeStyle=flagHit?'rgba(255,210,63,.35)':C.you;g.lineWidth=3;g.setLineDash([10,8]);
      g.beginPath();g.moveTo(fx,0);g.lineTo(fx,H);g.stroke();g.setLineDash([]);
      g.fillStyle=C.you;g.beginPath();g.moveTo(fx,24);g.lineTo(fx+34,34);g.lineTo(fx,44);g.closePath();g.fill();
      g.font='16px '+DISP;g.textAlign='left';g.fillText('Best '+fmt(bestRun)+' m',fx+8,64);g.textAlign='center';}}
  for(const l of lasers){
    const fl=.75+Math.sin(l.ph*30)*.15+pulse*.25,top=l.gy-l.gh/2,bot=l.gy+l.gh/2;
    g.globalCompositeOperation='lighter';
    g.strokeStyle='rgba(255,93,115,'+(.25*fl)+')';g.lineWidth=18;
    g.beginPath();g.moveTo(l.x,0);g.lineTo(l.x,top);g.moveTo(l.x,bot);g.lineTo(l.x,H);g.stroke();
    g.strokeStyle='rgba(255,220,225,'+fl+')';g.lineWidth=4;g.stroke();
    g.globalCompositeOperation='source-over';
    g.fillStyle=C.foe;for(const y of[top,bot]){g.beginPath();g.arc(l.x,y,8,0,6.3);g.fill();}
  }
}
/* vorne, in Bildschirm-Koordinaten: die Rauschwand und Warnung bei Nähe */
function runDrawWall(g){
  const gap=p.x-(camX+WALL_X),danger=st==='play'?Math.max(0,1-gap/220):0;
  if(danger>0){const gr=g.createLinearGradient(0,0,W*.4,0);gr.addColorStop(0,'rgba(255,93,115,'+(.28*danger)+')');gr.addColorStop(1,'rgba(255,93,115,0)');
    g.fillStyle=gr;g.fillRect(0,0,W*.4,H);}
  const gr=g.createLinearGradient(0,0,WALL_X+40,0);gr.addColorStop(0,'rgba(14,8,32,.95)');gr.addColorStop(.6,'rgba(43,26,85,.9)');gr.addColorStop(1,'rgba(43,26,85,0)');
  g.fillStyle=gr;g.fillRect(0,0,WALL_X+40,H);
  for(let i=0;i<70;i++){const y=Math.random()*H,x=Math.random()*(WALL_X+6),h=2+Math.random()*10;
    g.fillStyle=Math.random()<.5?'rgba(246,239,255,'+(.15+Math.random()*.5)+')':'rgba(255,93,115,'+(.2+Math.random()*.4)+')';g.fillRect(x,y,2+Math.random()*6,h);}
  g.fillStyle='rgba(246,239,255,'+(.5+Math.random()*.4)+')';g.fillRect(WALL_X-1,0,2,H);
}
/* Anzeige oben: Meter statt Punkte, Zone mit Balken, Perfect-Serie */
function runHud(g){
  g.save();g.translate(W/2,52);const s=1+punch*.22;g.scale(s,s);g.font='60px '+DISP;g.fillStyle=frenzy>0?C.gold:C.ink;
  g.fillText(fmt(meters)+' m',0,0);g.restore();
  g.font='600 15px "Outfit",sans-serif';g.fillStyle='rgba(246,239,255,.7)';g.fillText(fmt(shown+.4)+' points',W/2,96);
  if(bestRun>0){const bw=360,bx=W/2-bw/2,by=110,fr=Math.min(1,meters/bestRun);
    g.fillStyle='rgba(246,239,255,.14)';g.fillRect(bx,by,bw,6);g.fillStyle=flagHit?C.you:C.foe;g.fillRect(bx,by,bw*fr,6);
    g.fillStyle='rgba(246,239,255,.6)';g.fillText(flagHit?'Best beaten':'Best '+fmt(bestRun)+' m',W/2,130);}
  g.font='18px '+DISP;g.textAlign='left';g.fillStyle=combo>0?C.you:'rgba(246,239,255,.4)';g.fillText('Combo '+combo,26+WALL_X,34);
  if(perfStreak>1){g.fillStyle=C.igel;g.fillText('Perfect ×'+perfStreak,26+WALL_X,60);}
  g.textAlign='right';g.fillStyle='rgba(246,239,255,.4)';g.fillText('Run '+attempt,W-26,34);
  const zf=(meters%ZONE_M)/ZONE_M;g.fillStyle='rgba(246,239,255,.55)';g.fillText('Zone '+zone,W-26,60);
  g.fillStyle='rgba(246,239,255,.12)';g.fillRect(W-126,74,100,3);g.fillStyle='rgba(246,239,255,.5)';g.fillRect(W-126,74,100*zf,3);
  g.textAlign='center';
}
/* Ergebnis: Rekord in Metern */
function runOver(){
  const old=bestRun,m=Math.floor(meters),rec=m>old;
  if(rec){bestRun=m;try{localStorage.setItem('zack.best.run',m)}catch(e){}}
  $('ovTitle').textContent=rec&&old>0?'New Best!':(!rec&&old>0&&m>=old*.8)?'So close!':reason==='Static'?'The Static got you!':reason+'!';
  $('ovSub').textContent=fmt(m)+' m · '+fmt(score)+' points · '+(rec?(old>0?fmt(m-old)+' m beyond your old best':'your first best')
    :old<=0?'no best yet, go for it':(m>=old*.8?'only '+fmt(old-m)+' m short of your best':'Best: '+fmt(old)+' m'));
  $('dA').textContent='Zone';$('sCombo').textContent=zone;
  $('dB').textContent='Best combo';$('sKills').textContent=bestCombo;
  $('dC').textContent='Perfects';$('sAcc').textContent=perfects+(bestStreak>1?' (×'+bestStreak+')':'');
  $('dD').textContent='Time';$('sTime').textContent=Math.round(runT)+' s';
}

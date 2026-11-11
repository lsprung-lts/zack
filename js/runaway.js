'use strict';
/* Zack: Runaway – Endlos-Runner
   „The Static“ ist eine Rauschwand, die dich von links jagt und jede Sekunde schneller wird.
   Bewegen nur per Dash. Treffer: volle Weite, sofort nachladen und die Wand wird zurückgestoßen.
   Fehlsprung: nur 40 % Weite und längere Pause („Stolpern“) – blind Klicken reicht nicht.
   Combo bricht ab: die Wand macht einen Satz nach vorn. Die Kamera folgt dem Spieler.
   Formationen bewegen sich (Schaukel, Rad, Pendel, Konvoi, Zickzack, Orbit, gemischte Gruppen).
   Alles in Weltkoordinaten; Bildschirm-x = Welt-x − camX. */

const UNIT=10;                 // 10 Welteinheiten = 1 Meter
const ZONE_M=400;              // Meter pro Zone
const PERFECT_WIN=.08;         // ±80 ms um den Beat gilt als „Perfect“
const STREAK={4:'In the Groove!',8:'On Fire!',12:'Unstoppable!',16:'Metronome!'};
/* Die Wand */
const WALL_V0=140;             // Startgeschwindigkeit (Einheiten/s)
const WALL_ACC=2;              // +2 Einheiten/s pro Sekunde Spielzeit
const WALL_VMAX=400;
/* Werte per Bot-Simulation abgestimmt (je 10 Runden): Blind-Klicker ~20 s, zielender Bot ~50 s im Mittel */
const WALL_START=480;          // Abstand hinter dem Spieler beim Start (~3 s Luft)
const WALL_MAXLAG=900;         // weiter als das lässt sie sich nicht zurückstoßen
const PUSH_HIT=50,PUSH_PERFECT=100,PUSH_ESCAPE=80,SURGE=60;
/* Stolpern */
const STUMBLE_RANGE=.4,STUMBLE_CD=.55;
/* Lücke zwischen Formationen (Einheiten); ein Sprung reicht 330 */
const FORM_GAP=[130,230];

let meters=0,zone=1,nextForm=0,perfects=0,perfStreak=0,bestStreak=0,bestRun=0,flagHit=false,escArmed=false,runGoldT=0,lastM=0;
let lasers=[],wallX=0,startX=0,maxX=0,wallHit=0,wallSurge=0;
try{bestRun=+localStorage.getItem('zack.best.run')||0}catch(e){}

function wallSpeed(){return Math.min(WALL_VMAX,WALL_V0+WALL_ACC*runT);}
const gapToWall=()=>p.x-wallX;

function runReset(){
  camX=0;meters=0;lastM=0;zone=1;perfects=0;perfStreak=0;bestStreak=0;
  flagHit=false;escArmed=false;lasers=[];runGoldT=rnd(6,9);wallHit=0;wallSurge=0;
}
/* Gegner an eine Weltposition setzen; mv = Bewegungsmuster der Formation */
function mk(kind,x,y,mv){
  spawn(kind);const e=foes[foes.length-1];e.x=x;e.y=y;e.still=1;e.vx=-1;e.vy=0;
  if(mv){e.mv=mv;e.ox=x;e.oy=y;}
  return e;
}
function runStart(){
  p.x=W*.3;p.y=H/2;startX=p.x;maxX=p.x;wallX=p.x-WALL_START;camX=p.x-W*.38;
  /* Einstieg: eine sanft schaukelnde Reihe direkt vor dir */
  for(let i=0;i<3;i++)mk('d',p.x+190+i*64,H/2,{t:'sway',amp:70,f:1.6,ph:0});
  nextForm=p.x+190+3*64+280;
}

/* ---------- Bewegte Formationen ---------- */
function runMove(e){
  const m=e.mv,a=e.age*m.f+m.ph,px=e.x,py=e.y;
  if(m.t==='sway'){e.y=e.oy+Math.sin(a)*m.amp;}
  else if(m.t==='ring'){e.x=e.ox+Math.cos(a)*m.r;e.y=e.oy+Math.sin(a)*m.r;}
  else if(m.t==='pend'){e.x=e.ox+Math.sin(a)*m.amp*(m.k||1);e.y=e.oy;}
  else if(m.t==='convoy'){e.x=e.ox-e.age*m.v;e.y=e.oy+Math.sin(a)*m.amp;}
  else if(m.t==='zig'){e.x=e.ox+Math.sin(a)*m.amp;e.y=e.oy+Math.cos(a*.5)*m.amp*.4;}
  e.vx=e.x-px||-.01;e.vy=e.y-py;                       // Blickrichtung der Augen
  e.y=Math.max(40,Math.min(H-40,e.y));
}
function formation(x0){
  const z=zone,yc=rnd(170,H-170),pick=a=>a[Math.random()*a.length|0];
  const pool=['sway','ring','pend','convoy','zig','orbit','mixed'];
  if(z>=2)pool.push('spiky','laser','dasher','hunt');
  if(z>=3)pool.push('laser','dasher','ring','mixed');
  const kind=pick(pool),sp=1+Math.min(.8,(z-1)*.12);   // Bewegungen werden pro Zone schneller
  const n=3+(Math.random()*(z>=3?4:3)|0);
  if(kind==='sway'){const ph=rnd(0,6);for(let i=0;i<n;i++)mk('d',x0+i*62,yc,{t:'sway',amp:rnd(70,140),f:1.4*sp,ph:ph+i*.35});return n*62;}
  if(kind==='ring'){const k=Math.min(6,n+1),r=rnd(80,110),ph=rnd(0,6);for(let i=0;i<k;i++)mk('d',x0+r,yc,{t:'ring',r,f:(Math.random()<.5?1:-1)*1.1*sp,ph:ph+i/k*6.283});return 2*r+40;}
  if(kind==='pend'){const k=Math.min(5,n);for(let i=0;i<k;i++)mk('d',x0+60,yc+(i-(k-1)/2)*58,{t:'pend',amp:90,f:1.5*sp,ph:0,k:1-Math.abs(i-(k-1)/2)*.15});return 160;}
  if(kind==='convoy'){const ph=rnd(0,6);for(let i=0;i<n;i++)mk('d',x0+80+i*58,yc,{t:'convoy',v:45*sp,amp:30,f:2,ph:ph+i*.6});return n*58+80;}
  if(kind==='zig'){const dy=Math.random()<.5?-52:52;for(let i=0;i<n;i++)mk('d',x0+i*58,yc+(i-(n-1)/2)*dy,{t:'zig',amp:60,f:1.2*sp,ph:0});return n*58+60;}
  if(kind==='orbit'){const ph=rnd(0,6);for(const s of[0,3.1416])mk('d',x0+60,yc,{t:'ring',r:48,f:2.2*sp,ph:ph+s});
    if(Math.random()<.5)for(const s of[0,3.1416])mk('d',x0+200,yc+rnd(-120,120),{t:'ring',r:48,f:-2.2*sp,ph:ph+s});return 260;}
  if(kind==='mixed'){let w=0;for(let i=0;i<n;i++){const k=z>=2&&Math.random()<.25?'i':'d',x=x0+rnd(0,220),y=rnd(90,H-90);
      const e=mk(k,x,y,Math.random()<.5?{t:'sway',amp:rnd(30,80),f:rnd(1,2)*sp,ph:rnd(0,6)}:null);if(k==='i')e.ph=rnd(0,2.7);w=Math.max(w,x-x0);}return w+60;}
  if(kind==='spiky'){const e=mk('i',x0+70,yc,{t:'sway',amp:90,f:1.1*sp,ph:0});e.ph=rnd(0,2.7);
    mk('d',x0,yc,{t:'sway',amp:90,f:1.1*sp,ph:0});mk('d',x0+140,yc,{t:'sway',amp:90,f:1.1*sp,ph:0});return 180;}
  if(kind==='laser'){lasers.push({x:x0+30,gy:rnd(150,H-150),gh:Math.max(150,240-z*12),ph:rnd(0,6),drift:z>=4?rnd(-40,40):0});
    mk('d',x0+130,rnd(100,H-100),{t:'sway',amp:60,f:1.3,ph:rnd(0,6)});return 160;}
  if(kind==='dasher'){runDasher();return 60;}
  if(kind==='hunt'){for(let i=0;i<1+(z>2?1:0);i++){const e=mk('d',x0+i*90,rnd(80,H-80));e.still=0;e.spd=60+z*10;}return 180;}
  return 100;
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
    if((l.x-sx)*(l.x-ex)>0||Math.abs(ex-sx)<1)continue;
    const t=(l.x-sx)/(ex-sx),y=sy+(ey-sy)*t;
    if(Math.abs(y-l.gy)<=l.gh/2)continue;
    if(!best||t<best.t)best={t,l};
  }
  if(!best)return{x:ex,y:ey,blocked:false};
  const back=14/Math.max(1,Math.hypot(ex-sx,ey-sy)),t=Math.max(0,best.t-back);
  return{x:sx+(ex-sx)*t,y:sy+(ey-sy)*t,blocked:true};
}

/* ---------- Perfect, Rückstoß, Surge ---------- */
function runPerfect(){
  const off=Music.beatOffset();
  if(off===null||Math.abs(off)>PERFECT_WIN){perfStreak=0;return false;}
  perfects++;perfStreak++;bestStreak=Math.max(bestStreak,perfStreak);
  floats.push({x:p.x,y:p.y+40,text:'Perfect!',life:.7,col:C.igel,big:false});
  tone(1760,.06,'sine',.035,2640);
  if(STREAK[perfStreak]){call(STREAK[perfStreak],C.igel);rings.push({x:p.x,y:p.y,r:20,max:160,life:.45,dur:.45,col:'92,225,230'});}
  return true;
}
/* Treffer stoßen die Wand zurück (nicht weiter als WALL_MAXLAG hinter dir) */
function runPush(n,perf){
  const d=n*(perf?PUSH_PERFECT:PUSH_HIT);
  wallX=Math.max(p.x-WALL_MAXLAG,wallX-d);wallHit=1;
  tone(70,.18,'sine',.09,45);
}
/* Combo vorbei: die Wand holt auf */
function runSurge(){
  wallX+=SURGE;wallSurge=1;call('Static surge!',C.foe);hiss(.3,.08,600);
}

/* ---------- Pro Frame (nur in Runaway) ---------- */
function runTick(dt,rdt){
  /* Wand jagt dich */
  wallX+=wallSpeed()*dt;
  wallHit=Math.max(0,wallHit-rdt*3);wallSurge=Math.max(0,wallSurge-rdt*2.5);
  /* Kamera folgt dem Spieler (er steht bei ~38 % des Bildes) */
  camX+=(p.x-W*.38-camX)*ease(4,rdt);
  /* Distanz = weitester Punkt; Punkte pro Meter × Multiplikator */
  maxX=Math.max(maxX,p.x);meters=Math.max(0,(maxX-startX)/UNIT);
  const dm=Math.floor(meters)-lastM;if(dm>0){score+=dm*mult();lastM+=dm;}
  /* Zonen */
  const z=1+Math.floor(meters/ZONE_M);
  if(z>zone){zone=z;lvl=z;zoneUp();}
  /* Neue Formationen rechts außerhalb des Bildes */
  /* Abstand kleiner als ein Sprung: gutes Zielen kettet von Formation zu Formation */
  while(nextForm<camX+W+120){const w=formation(nextForm);nextForm+=w+rnd(FORM_GAP[0],FORM_GAP[1])-Math.min(50,zone*5);}
  /* Gold öfter als in der Arena, zwischen Wand und dir: Risiko gegen Belohnung */
  runGoldT-=dt;if(runGoldT<=0){runGoldT=rnd(8,13);spawn('g');const e=foes[foes.length-1];
    e.x=Math.max(wallX+90,camX+90)+rnd(0,140);e.y=rnd(110,H-110);e.vx=0;e.vy=(Math.random()<.5?-1:1)*90;tone(1320,.25,'sine',.05,1760);}
  /* Aufräumen links von Wand und Bild */
  const cut=Math.min(camX,wallX)-220;
  for(let i=foes.length-1;i>=0;i--)if(foes[i].x<cut&&foes[i].k!=='r')foes.splice(i,1);
  lasers=lasers.filter(l=>l.x>cut);
  for(const l of lasers){l.ph+=rdt;if(l.drift){l.gy+=l.drift*dt;if(l.gy<120||l.gy>H-120)l.drift*=-1;}}
  /* Rekord-Fahne */
  if(bestRun>0&&!flagHit&&meters>bestRun){flagHit=true;recordHit=true;call('New Best!',C.you);
    for(let j=0;j<4;j++)tone(note(10+j),.25,'square',.05,0,j*.07);rings.push({x:p.x,y:p.y,r:30,max:700,life:.8,dur:.8,col:'255,210,63'});}
  /* Escape! und Tod */
  const gap=gapToWall();
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
  wallX=Math.max(p.x-WALL_MAXLAG,wallX-PUSH_ESCAPE);wallHit=1;
  call('Escape!',C.igel);
  floats.push({x:p.x,y:p.y-70,text:'Escape +'+fmt(pts),life:1,col:C.igel,big:true});
  tone(523,.12,'triangle',.06,1046);tone(1046,.2,'sine',.04,0,.08);
}

/* ---------- Zeichnen ---------- */
/* hinter allem, in Weltkoordinaten: pulsierende Bodenlinien, Meter-Marken, Rekord-Fahne, Laser */
function runDrawBack(g){
  const pulse=Music.pulse(),x0=Math.floor(camX/160)*160;
  g.lineWidth=2;
  for(let x=x0;x<camX+W+160;x+=160){g.strokeStyle='rgba(246,239,255,'+(.04+.1*pulse)+')';g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
  g.font='600 13px "Outfit",sans-serif';g.textAlign='center';g.fillStyle='rgba(246,239,255,.25)';
  for(let m=Math.max(100,Math.ceil((camX-startX)/UNIT/100)*100);startX+m*UNIT<camX+W;m+=100)g.fillText(fmt(m)+' m',startX+m*UNIT,H-14);
  if(bestRun>0){const fx=startX+bestRun*UNIT;
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
/* vorne, in Bildschirm-Koordinaten: die Rauschwand (oder ein Hinweis, wenn sie links außerhalb ist) */
function runDrawWall(g){
  const sx=wallX-camX,gap=gapToWall(),danger=st==='play'?Math.max(0,1-gap/260):0;
  if(danger>0){const gr=g.createLinearGradient(Math.max(0,sx),0,Math.max(0,sx)+W*.4,0);gr.addColorStop(0,'rgba(255,93,115,'+(.3*danger)+')');gr.addColorStop(1,'rgba(255,93,115,0)');
    g.fillStyle=gr;g.fillRect(0,0,W,H);}
  if(sx>-40){
    const gr=g.createLinearGradient(sx-60,0,sx+30,0);gr.addColorStop(0,'rgba(14,8,32,.96)');gr.addColorStop(.7,'rgba(43,26,85,.92)');gr.addColorStop(1,'rgba(43,26,85,0)');
    g.fillStyle=gr;g.fillRect(-20,0,sx+50,H);
    for(let i=0;i<80;i++){const y=Math.random()*H,x=sx-Math.random()*70,h=2+Math.random()*10;
      g.fillStyle=Math.random()<.5?'rgba(246,239,255,'+(.15+Math.random()*.5)+')':'rgba(255,93,115,'+(.2+Math.random()*.4)+')';g.fillRect(x,y,2+Math.random()*6,h);}
    /* Kante: weiß beim Zurückstoßen, rot beim Surge */
    g.fillStyle=wallSurge>0?'rgba(255,93,115,'+(.6+wallSurge*.4)+')':'rgba(246,239,255,'+(.5+Math.random()*.4+wallHit*.5)+')';
    g.fillRect(sx-1-wallHit*3,0,2+wallHit*6,H);
  }else{
    g.font='16px '+DISP;g.textAlign='left';g.fillStyle='rgba(246,239,255,.55)';g.fillText('◀ Static '+fmt(gap/UNIT)+' m',14,H/2);g.textAlign='center';
  }
}
/* Anzeige oben: Meter, Punkte, Abstand zur Wand, Zone */
function runHud(g){
  g.save();g.translate(W/2,52);const s=1+punch*.22;g.scale(s,s);g.font='60px '+DISP;g.fillStyle=frenzy>0?C.gold:C.ink;
  g.fillText(fmt(meters)+' m',0,0);g.restore();
  g.font='600 15px "Outfit",sans-serif';g.fillStyle='rgba(246,239,255,.7)';g.fillText(fmt(shown+.4)+' points',W/2,96);
  if(bestRun>0){const bw=360,bx=W/2-bw/2,by=110,fr=Math.min(1,meters/bestRun);
    g.fillStyle='rgba(246,239,255,.14)';g.fillRect(bx,by,bw,6);g.fillStyle=flagHit?C.you:C.foe;g.fillRect(bx,by,bw*fr,6);
    g.fillStyle='rgba(246,239,255,.6)';g.fillText(flagHit?'Best beaten':'Best '+fmt(bestRun)+' m',W/2,130);}
  const lx=26;
  g.font='18px '+DISP;g.textAlign='left';g.fillStyle=combo>0?C.you:'rgba(246,239,255,.4)';g.fillText('Combo '+combo,lx,34);
  const gm_=gapToWall()/UNIT;g.fillStyle=gm_<15?C.foe:'rgba(246,239,255,.5)';g.fillText('Static '+fmt(gm_)+' m',lx,60);
  if(perfStreak>1){g.fillStyle=C.igel;g.fillText('Perfect ×'+perfStreak,lx,86);}
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

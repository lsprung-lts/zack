'use strict';
/* Zack: Schleife, Eingabe, Start */
/* ---------- Schleife: echte Zeit statt Frames, darum gleich schnell bei 60 und 144 Hz ---------- */
let last=0,hzAcc=0,hzN=0;
function frame(ts){
  const raw=last?(ts-last)/1000:0;last=ts;
  if(raw>0&&raw<.1){hzAcc+=raw;hzN++;if(hzAcc>.6){$('hz').textContent='≈ '+Math.round(hzN/hzAcc)+' Hz';hzAcc=hzN=0;}}
  if(st!=='pause')update(Math.min(raw,.05));
  render();drawCast();drawKiller(Math.min(raw,.05));Music.tick();requestAnimationFrame(frame);
}

/* ---------- Eingabe ---------- */
function toWorld(e){const r=cv.getBoundingClientRect();aim.x=(e.clientX-r.left)/r.width*W;aim.y=(e.clientY-r.top)/r.height*H;}
function act(){if(st==='menu'||(st==='over'&&overLock<=0))start();else if(st==='pause')togglePause();else dash();}
function togglePause(){if(st==='play'){st='pause';$('pz').textContent='Resume';showPause();}else if(st==='pause'){st='play';$('pz').textContent='Pause';last=0;hidePause();}}
stage.addEventListener('pointermove',e=>{if(e.pointerType==='mouse')touchMode=false;toWorld(e);});
/* Maus: Klick springt sofort. Finger/Stift: im Spiel erst zielen (Linie + Vorschau), beim Loslassen springen */
stage.addEventListener('pointerdown',e=>{if(e.target.closest('button,.nostart'))return;e.preventDefault();toWorld(e);
  if(e.pointerType!=='mouse'){touchMode=true;if(st==='play'){touchHold=true;try{stage.setPointerCapture(e.pointerId)}catch(err){}return;}}
  act();});
stage.addEventListener('pointerup',e=>{if(!touchHold)return;touchHold=false;toWorld(e);if(st==='play')act();});
stage.addEventListener('pointercancel',()=>{touchHold=false;});
addEventListener('keydown',e=>{
  if(e.key===' '||e.key==='Enter'){if(e.target.closest&&e.target.closest('button,input'))return;e.preventDefault();if(!e.repeat)act();}
  else if(e.key==='Escape'&&st==='over')showMenu();
  else if(e.key==='p'||e.key==='P'||e.key==='Escape')togglePause();});
addEventListener('blur',()=>{if(st==='play')togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&st==='play')togglePause();});
$('go').addEventListener('click',()=>{if(st==='menu')start();$('go').blur();});
$('again').addEventListener('click',()=>{if(st==='over'&&overLock<=0)start();$('again').blur();});
$('toMenu').addEventListener('click',()=>{if(st==='over')showMenu();$('toMenu').blur();});
$('how').addEventListener('click',toggleHow);
$('set').addEventListener('click',()=>{toggleSettings();$('set').blur();});
$('pz').addEventListener('click',()=>{togglePause();$('pz').blur();});
$('resume').addEventListener('click',()=>{if(st==='pause')togglePause();$('resume').blur();});
$('quit').addEventListener('click',()=>{if(st==='pause'){$('pz').textContent='Pause';quitToMenu();}$('quit').blur();});
$('snd').addEventListener('click',()=>{muted=!muted;$('snd').textContent=muted?'Sound on':'Sound off';if(!muted)wake();$('snd').blur();});
/* Musik: Knopf oben und Regler im Menü halten sich gegenseitig aktuell */
function syncMusicUi(){const v=Music.vol,on=Music.on&&v>0;
  $('mus').textContent=Music.on?'Music off':'Music on';
  $('vol').value=v;$('vol').style.setProperty('--v',v+'%');
  $('volV').textContent=Music.on?v+'%':'off';$('vol').closest('.vol').classList.toggle('off',!on);}
$('mus').addEventListener('click',()=>{wake();Music.toggle();syncMusicUi();$('mus').blur();});
$('vol').addEventListener('input',e=>{wake();if(!Music.on)Music.toggle();Music.setVol(+e.target.value);syncMusicUi();});
syncMusicUi();

/* ---------- Start ---------- */
function boot(data){
  if(data&&data.best>best)best=data.best;
  showMenu();resize();
  if(document.fonts&&document.fonts.load)document.fonts.load('20px "Bungee"').catch(()=>{});
  requestAnimationFrame(frame);
}
const hot=window.claude&&window.claude.hot;
if(hot&&hot.snapshot)hot.snapshot(()=>({best:Math.max(best,score)}));
if(hot&&hot.ready)hot.ready(boot);else boot((hot&&hot.data)||{});

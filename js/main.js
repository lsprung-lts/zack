'use strict';
/* Zack: Schleife, Eingabe, Start */
/* ---------- Schleife: echte Zeit statt Frames, darum gleich schnell bei 60 und 144 Hz ---------- */
let last=0,hzAcc=0,hzN=0;
function frame(ts){
  const raw=last?(ts-last)/1000:0;last=ts;
  if(raw>0&&raw<.1){hzAcc+=raw;hzN++;if(hzAcc>.6){$('hz').textContent='≈ '+Math.round(hzN/hzAcc)+' Hz';hzAcc=hzN=0;}}
  if(st!=='pause')update(Math.min(raw,.05));
  render();drawCast();Music.tick();requestAnimationFrame(frame);
}

/* ---------- Eingabe ---------- */
function toWorld(e){const r=cv.getBoundingClientRect();aimS.x=(e.clientX-r.left)/r.width*W;aimS.y=(e.clientY-r.top)/r.height*H;
  aim.x=aimS.x+camX;aim.y=aimS.y;}
function act(){if(st==='menu'||(st==='over'&&overLock<=0))start();else if(st==='pause')togglePause();else dash();}
function togglePause(){if(st==='play'){st='pause';$('pz').textContent='Resume';}else if(st==='pause'){st='play';$('pz').textContent='Pause';last=0;}}
stage.addEventListener('pointermove',toWorld);
stage.addEventListener('pointerdown',e=>{if(e.target.closest('button,.nostart'))return;e.preventDefault();toWorld(e);act();});
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
$('pz').addEventListener('click',()=>{togglePause();$('pz').blur();});
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

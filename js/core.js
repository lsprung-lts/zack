'use strict';
/* Zack: Grundwerte, Zustand, Soundeffekte */
const W=1280,H=720,RANGE=330;
const cv=document.getElementById('cv'),g=cv.getContext('2d');
const stage=document.getElementById('stage'),mainEl=document.getElementById('main');
const $=id=>document.getElementById(id);
const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd=(a,b)=>a+Math.random()*(b-a);
const ease=(k,dt)=>1-Math.exp(-k*dt);          // bildratenunabhängiges Glätten
const fmt=n=>Math.round(n).toLocaleString('de-AT');
const DISP='"Bungee","Arial Black",Impact,sans-serif';
const C={you:'#ffd23f',foe:'#ff5d73',run:'#ff9a3c',igel:'#5ce1e6',gold:'#fff3b0',ink:'#f6efff'};

/* ---------- Zustand ---------- */
let st='menu',clock=0,runT=0,score=0,shown=0,punch=0,combo=0,comboT=0,bestCombo=0,kills=0,dashes=0,hits=0;
let cd=0,inv=0,frenzy=0,boost=0,hitStop=0,shake=0,flash=0,dieT=0,overLock=0,attempt=0,reason='',recordHit=false;
let best=0,spawnT=0,goldT=14;
const p={x:W/2,y:H/2},aim={x:W/2+200,y:H/2};
let foes=[],parts=[],floats=[],trails=[],calls=[];
try{best=+localStorage.getItem('zack.best')||0}catch(e){}

/* ---------- Ton ---------- */
let ac=null,muted=false;
function wake(){if(muted)return;try{if(!ac)ac=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume().catch(()=>{})}catch(e){ac=null}}
function tone(f,d,type,vol,to,delay){if(!ac||muted)return;try{
  const o=ac.createOscillator(),v=ac.createGain(),t=ac.currentTime+(delay||0);
  o.type=type||'triangle';o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
  v.gain.setValueAtTime(vol||.07,t);v.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(v).connect(ac.destination);o.start(t);o.stop(t+d+.02);}catch(e){}}
function hiss(d,vol,hp){if(!ac||muted)return;try{
  const b=ac.createBuffer(1,ac.sampleRate*d|0,ac.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,2);
  const s=ac.createBufferSource(),v=ac.createGain(),f=ac.createBiquadFilter();
  f.type='highpass';f.frequency.value=hp;v.gain.value=vol;s.buffer=b;s.connect(f).connect(v).connect(ac.destination);s.start();}catch(e){}}
const PENTA=[0,2,4,7,9];
const note=i=>330*Math.pow(2,(PENTA[i%5]+12*Math.floor(i/5))/12);   // jede Serie klingt höher


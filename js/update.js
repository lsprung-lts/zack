'use strict';
/* Zack: Simulation (bildratenunabhängig) */
/* ---------- Simulation ---------- */
function update(rdt){
  clock+=rdt;
  shake=Math.max(0,shake-rdt*4);flash=Math.max(0,flash-rdt*1.6);punch=Math.max(0,punch-rdt*5);
  if(overLock>0)overLock-=rdt;
  for(let i=calls.length-1;i>=0;i--){calls[i].t+=rdt;if(calls[i].t>1.1)calls.splice(i,1);}
  shown+=(score-shown)*ease(14,rdt);
  if(st==='dying'){dieT-=rdt;if(dieT<=0)over();}
  let dt=rdt;
  if(hitStop>0){hitStop-=rdt;dt=0;}             // Treffer-Stopp: die Welt friert kurz ein
  else if(st==='dying')dt=rdt*.12;              // Zeitlupe beim Tod
  if(slow>0){slow-=rdt;if(st==='play')dt*=.35;}  // kurze Zeitlupe nach „Feld leer“
  if(st==='play'&&dt>0){
    runT+=dt;if(cd>0)cd-=dt;if(inv>0)inv-=dt;if(frenzy>0)frenzy-=dt;if(boost>0)boost-=dt;if(clearCd>0)clearCd-=dt;
    const nl=1+Math.floor(runT/LVL_T);if(nl>lvl){lvl=nl;lvlUp();}
    if(combo>0){comboT-=dt;if(comboT<=0){bank();combo=0;}}
    spawnT-=dt;
    if(spawnT<=0&&foes.length<42){spawnT=Math.max(.27,.95-runT*.009);
      const r=Math.random();spawn(runT>10&&r<.17?'r':runT>22&&r<.38?'i':'d');}
    goldT-=dt;if(goldT<=0){goldT=rnd(13,24);spawn('g');tone(1320,.25,'sine',.05,1760);}
  }
  const edt=dt*(frenzy>0?.5:1);
  for(let i=foes.length-1;i>=0;i--){const e=foes[i];e.age+=edt;
    if(e.k==='r'){if(e.warn>0){e.warn-=edt;if(e.warn<=0)hiss(.15,.04,1500);}
      else{e.x+=e.dx*e.spd*edt;e.y+=e.dy*e.spd*edt;if(e.x<-120||e.x>W+120||e.y<-120||e.y>H+120){foes.splice(i,1);continue;}}}
    else if(e.k==='g'){e.x+=e.vx*edt;e.y+=e.vy*edt;if(e.x<60||e.x>W-60)e.vx*=-1;if(e.y<60||e.y>H-60)e.vy*=-1;
      e.life-=edt;if(e.life<=0){foes.splice(i,1);continue;}}
    else{let tx=p.x,ty=p.y;
      if(st==='menu'){tx=W/2+Math.cos(e.age*.5+e.seed)*460;ty=H/2+Math.sin(e.age*.7+e.seed)*250;}
      const a=Math.atan2(ty-e.y,tx-e.x),k=ease(2.6,edt);
      e.vx+=(Math.cos(a)*e.spd-e.vx)*k;e.vy+=(Math.sin(a)*e.spd-e.vy)*k;
      e.x+=e.vx*edt;e.y+=e.vy*edt;if(e.k==='i')e.ph+=edt;}
    if(st!=='play'||e.k==='g'||(e.k==='r'&&e.warn>0))continue;
    const dd=Math.hypot(e.x-p.x,e.y-p.y);
    if(inv<=0&&dd<e.r+7){die(e.k==='r'?'Flattened':e.k==='i'?'Skewered':'Caught');continue;}
    if(dd<e.r+7+GRAZE){if(!e.gz&&inv<=0)e.gz=1;}     // drin im knappen Bereich
    else if(e.gz===1){e.gz=2;graze(e);}            // wieder draußen und noch am Leben
  }
  if(st==='menu'&&foes.length<7)spawn('d');
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.life-=dt;if(q.life<=0){parts.splice(i,1);continue;}
    const dr=Math.exp(-3.2*dt);q.vx*=dr;q.vy*=dr;q.x+=q.vx*dt;q.y+=q.vy*dt;}
  for(let i=floats.length-1;i>=0;i--){const f=floats[i];f.life-=rdt;f.y-=46*rdt;if(f.life<=0)floats.splice(i,1);}
  for(let i=trails.length-1;i>=0;i--){trails[i].life-=rdt;if(trails[i].life<=0)trails.splice(i,1);}
  for(let i=rings.length-1;i>=0;i--){const o=rings[i];o.life-=rdt;o.r+=(o.max-o.r)*ease(6,rdt);if(o.life<=0)rings.splice(i,1);}
  /* Farbton der Stufe weich überblenden (Echtzeit) */
  const tt=LVL_TINT[st==='menu'?0:(lvl-1)%LVL_TINT.length],tk=ease(1.2,rdt);
  for(let i=0;i<4;i++)tint[i]+=(tt[i]-tint[i])*tk;
}


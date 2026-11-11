'use strict';
/* Zack: Zeichnen und Größe */
/* ---------- Zeichnen ---------- */
let bg=null,scale=1;
function drawBg(c){
  const gr=c.createRadialGradient(W/2,H/2,80,W/2,H/2,820);gr.addColorStop(0,'#2a1757');gr.addColorStop(1,'#120a28');
  c.fillStyle=gr;c.fillRect(0,0,W,H);
  c.fillStyle='rgba(246,239,255,.07)';
  for(let y=40;y<H;y+=40)for(let x=40;x<W;x+=40)c.fillRect(x-1,y-1,2,2);
}
function drawFoe(e,c){c=c||g;
  c.save();c.translate(e.x,e.y);
  if(e.spawnIn>0){const k=1-e.spawnIn/SPAWN_IN;c.globalAlpha=.25+.75*k;c.scale(.3+.7*k,.3+.7*k);}   // erscheint gerade
  if(e.k==='d'){
    const a=Math.atan2(e.vy,e.vx),wob=1+Math.sin(e.age*9+e.seed)*.06;
    c.fillStyle=e.crown?'rgba(255,243,176,'+(.25+Math.sin(clock*8)*.1)+')':'rgba(255,93,115,.18)';
    c.beginPath();c.arc(0,0,e.r+(e.crown?12:8),0,6.3);c.fill();
    c.fillStyle=C.foe;c.beginPath();c.ellipse(0,0,e.r*wob,e.r/wob,0,0,6.3);c.fill();
    if(e.crown){const y=-e.r-5+Math.sin(clock*6+e.seed)*1.5;   /* Kopfgeld-Krone */
      c.fillStyle=C.you;c.strokeStyle='#120a28';c.lineWidth=2;c.beginPath();
      c.moveTo(-11,y);c.lineTo(-12,y-11);c.lineTo(-5,y-5);c.lineTo(0,y-14);c.lineTo(5,y-5);c.lineTo(12,y-11);c.lineTo(11,y);c.closePath();
      c.stroke();c.fill();c.fillStyle='#fff';c.beginPath();c.arc(0,y-14,2,0,6.3);c.fill();}
    c.rotate(a);c.fillStyle='#fff';c.beginPath();c.arc(6,-5,4.2,0,6.3);c.arc(6,5,4.2,0,6.3);c.fill();
    c.fillStyle='#1b1036';c.beginPath();c.arc(8,-5,2,0,6.3);c.arc(8,5,2,0,6.3);c.fill();
  }else if(e.k==='r'){
    c.rotate(Math.atan2(e.dy,e.dx));const s=e.warn>0?.7+Math.sin(clock*30)*.15:1;
    c.fillStyle=C.run;c.beginPath();c.moveTo(20*s,0);c.lineTo(-14*s,-13*s);c.lineTo(-7*s,0);c.lineTo(-14*s,13*s);c.closePath();c.fill();
  }else if(e.k==='i'){
    const am=spikeAmt(e),hot=spiky(e);
    c.rotate(e.age*.8);c.fillStyle=hot?'#ffffff':C.igel;
    if(am>0){c.beginPath();for(let i=0;i<20;i++){const a=i/20*6.283,rr=i%2?e.r-2:e.r+3+am*15;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();}
    c.fillStyle=C.igel;c.beginPath();c.arc(0,0,e.r,0,6.3);c.fill();
    c.fillStyle='#1b1036';c.beginPath();c.arc(0,0,e.r*.42*(hot?1:.6+am*.4),0,6.3);c.fill();
  }else if(e.k==='u'){                              /* Untouchable-Stern: weiß mit Regenbogen-Schein */
    const blink=e.life<1.5&&Math.sin(clock*24)>0?.35:1,s=1+Math.sin(clock*7)*.12;c.globalAlpha=blink;
    c.fillStyle='hsla('+(clock*200%360)+',95%,70%,.35)';c.beginPath();c.arc(0,0,(e.r+16)*s,0,6.3);c.fill();
    c.rotate(clock*1.8);c.fillStyle='#ffffff';c.beginPath();
    for(let i=0;i<10;i++){const a=i/10*6.283-1.571,rr=i%2?e.r*.45*s:e.r*1.15*s;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fill();
  }else{
    const blink=e.life<2&&Math.sin(clock*24)>0?.35:1,s=1+Math.sin(clock*8)*.12;
    c.globalAlpha=blink;c.fillStyle='rgba(255,243,176,.2)';c.beginPath();c.arc(0,0,(e.r+14)*s,0,6.3);c.fill();
    c.rotate(clock*2.4);c.fillStyle=C.gold;c.beginPath();c.moveTo(0,-e.r*1.3*s);c.lineTo(e.r*s,0);c.lineTo(0,e.r*1.3*s);c.lineTo(-e.r*s,0);c.closePath();c.fill();
    c.fillStyle='#fff';c.beginPath();c.arc(0,0,4,0,6.3);c.fill();
  }
  c.restore();
}
function render(){
  g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';
  if(bg)g.drawImage(bg,0,0);
  const sx=Math.sin(clock*91)*14*shake*shake,sy=Math.cos(clock*77)*14*shake*shake;
  g.setTransform(scale,0,0,scale,sx*scale,sy*scale);
  if(tint[3]>.003){g.fillStyle='rgba('+(tint[0]|0)+','+(tint[1]|0)+','+(tint[2]|0)+','+tint[3]+')';g.fillRect(-20,-20,W+40,H+40);}
  if(frenzy>0){g.fillStyle='rgba(255,210,63,'+(.07+Math.sin(clock*10)*.03)*Math.min(1,frenzy)+')';g.fillRect(-20,-20,W+40,H+40);}
  g.lineCap='round';
  /* Raser-Warnung */
  for(const e of foes)if(e.k==='r'&&e.warn>0){g.strokeStyle='rgba(255,154,60,'+(.25+(1-e.warn/.85)*.5)+')';g.lineWidth=2+(1-e.warn/.85)*5;
    g.beginPath();g.moveTo(e.x,e.y);g.lineTo(e.x+e.dx*1700,e.y+e.dy*1700);g.stroke();}
  /* Ziellinie */
  if(st==='play'||st==='menu'){const dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy)||1,L=Math.min(d,reach()),ex=p.x+dx/d*L,ey=p.y+dy/d*L;
    g.strokeStyle='rgba(246,239,255,'+(cd>0?.12:.38)+')';g.lineWidth=2;g.setLineDash([3,11]);g.lineDashOffset=-clock*60;
    g.beginPath();g.moveTo(p.x,p.y);g.lineTo(ex,ey);g.stroke();g.setLineDash([]);
    g.beginPath();g.arc(ex,ey,9,0,6.3);g.stroke();}
  g.globalCompositeOperation='lighter';
  for(const t of trails){const a=t.life/.22;g.strokeStyle=t.b?'rgba(92,225,230,'+a*.9+')':skinCol(a*.9);g.lineWidth=4+18*a;g.beginPath();g.moveTo(t.x1,t.y1);g.lineTo(t.x2,t.y2);g.stroke();
    g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=2+5*a;g.stroke();
    for(const fr of[.3,.55,.8]){const gx=t.x1+(t.x2-t.x1)*fr,gy=t.y1+(t.y2-t.y1)*fr;   /* Nachbilder des Funkens */
      g.fillStyle=t.b?'rgba(92,225,230,'+a*fr*.7+')':skinCol(a*fr*.7);g.beginPath();g.arc(gx,gy,5+6*fr,0,6.3);g.fill();}}
  for(const o of rings){const a=Math.max(0,o.life/o.dur);g.strokeStyle='rgba('+o.col+','+a*.8+')';g.lineWidth=2+10*a;
    g.beginPath();g.arc(o.x,o.y,o.r,0,6.3);g.stroke();}
  g.globalCompositeOperation='source-over';
  for(const e of foes)drawFoe(e);
  /* Treffer-Vorschau: Gegner auf der Ziellinie leuchten weiß, Spikies mit Stacheln rot (= tödlich) */
  if(st==='play'&&cd<=0){const dx=aim.x-p.x,dy=aim.y-p.y,d=Math.hypot(dx,dy);
    if(d>=6){const L=Math.min(d,reach()),ex=Math.max(18,Math.min(W-18,p.x+dx/d*L)),ey=Math.max(18,Math.min(H-18,p.y+dy/d*L));let n=0,danger=false;
      for(const e of foes){if(segDist(e.x,e.y,p.x,p.y,ex,ey).d>=e.r+15)continue;
        const bad=spiky(e)&&untouch<=0;if(bad)danger=true;else if(e.k!=='u')n++;
        g.lineWidth=3;g.strokeStyle=bad?C.foe:'rgba(255,255,255,'+(.55+Math.sin(clock*12)*.25)+')';
        g.beginPath();g.arc(e.x,e.y,e.r+9,0,6.3);g.stroke();}
      if(danger||n>=2){const lab=danger?'!':'×'+n;g.font='16px '+DISP;g.textAlign='center';g.textBaseline='middle';g.lineWidth=4;g.strokeStyle='#120a28';
        g.strokeText(lab,ex,ey-22);g.fillStyle=danger?C.foe:C.ink;g.fillText(lab,ex,ey-22);}}}   // tödlicher Spiky auf der Linie: rotes ! statt Zahl
  /* Spieler mit Serien-Ring */
  if(st!=='dying'&&st!=='over'){
    const ready=cd<=0;
    if(untouch>0){const a=(untouch<1.5&&!calm&&Math.sin(clock*18)<0)?.35:1;   /* Untouchable: leuchtender Regenbogen-Ring */
      g.globalAlpha=a;g.fillStyle='rgba(255,255,255,.18)';g.beginPath();g.arc(p.x,p.y,40,0,6.3);g.fill();
      g.lineWidth=5;g.strokeStyle='hsl('+(clock*300%360)+',95%,70%)';g.beginPath();g.arc(p.x,p.y,40+Math.sin(clock*10)*3,0,6.3);g.stroke();g.globalAlpha=1;}
    if(boost>0){g.strokeStyle='rgba(92,225,230,'+(.35+Math.sin(clock*14)*.2)*Math.min(1,boost)+')';g.lineWidth=3;
      g.beginPath();g.arc(p.x,p.y,36+Math.sin(clock*9)*3,0,6.3);g.stroke();}
    if(combo>0){g.lineWidth=5;g.strokeStyle='rgba(246,239,255,.14)';g.beginPath();g.arc(p.x,p.y,28,0,6.3);g.stroke();
      /* Ring: eisblau = Timer wartet, rot = gleich vorbei */
      const fr=comboT/comboMax();g.strokeStyle=comboHold?'rgba(92,225,230,'+(.6+Math.sin(clock*6)*.3)+')':fr<.3?C.foe:C.you;
      g.beginPath();g.arc(p.x,p.y,28,-1.571,-1.571+fr*6.283);g.stroke();}
    g.fillStyle='rgba(255,210,63,'+(ready?.25:.08)+')';g.beginPath();g.arc(p.x,p.y,17+Math.sin(clock*7)*2,0,6.3);g.fill();
    g.fillStyle=ready?C.you:'#8d7fae';g.beginPath();g.arc(p.x,p.y,10,0,6.3);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,4.5,0,6.3);g.fill();
    if(!ready){const f=1-cd/Math.max(.01,cdMax);g.lineWidth=3;                       /* Aufladen: Ring füllt sich */
      g.strokeStyle='rgba(246,239,255,.15)';g.beginPath();g.arc(p.x,p.y,21,0,6.3);g.stroke();
      g.strokeStyle='rgba(246,239,255,.85)';g.beginPath();g.arc(p.x,p.y,21,-1.571,-1.571+f*6.283);g.stroke();}
    if(readyFlash>0){g.fillStyle='rgba(255,255,255,'+(readyFlash*.55)+')';g.beginPath();g.arc(p.x,p.y,12+10*(1-readyFlash),0,6.3);g.fill();}
  }
  g.globalCompositeOperation='lighter';
  for(const q of parts){g.globalAlpha=Math.min(1,q.life/q.max*1.6);g.strokeStyle=q.col;g.lineWidth=q.size;
    g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-q.vx*.035,q.y-q.vy*.035);g.stroke();}
  g.globalCompositeOperation='source-over';g.globalAlpha=1;
  g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  for(const f of floats){g.globalAlpha=Math.min(1,f.life*3)*(f.small?.9:1);g.font=(f.small?16:f.big?26:19)+'px '+DISP;
    const fx=Math.max(70,Math.min(W-70,f.x));g.lineWidth=5;g.strokeStyle='#120a28';g.strokeText(f.text,fx,f.y);g.fillStyle=f.col;g.fillText(f.text,fx,f.y);}
  g.globalAlpha=1;
  /* Anzeige */
  if(st!=='menu'){
    g.save();g.translate(W/2,52);const s=1+punch*.22;g.scale(s,s);g.font='60px '+DISP;g.fillStyle=frenzy>0?C.gold:C.ink;
    g.fillText(fmt(shown+.4),0,0);g.restore();
    if(best>0){const bw=360,bx=W/2-bw/2,by=92,fr=Math.min(1,shown/best);
      g.fillStyle='rgba(246,239,255,.14)';g.fillRect(bx,by,bw,6);g.fillStyle=recordHit?C.you:C.foe;g.fillRect(bx,by,bw*fr,6);
      g.font='600 14px "Outfit",sans-serif';g.fillStyle='rgba(246,239,255,.7)';g.fillText(recordHit?'Best beaten':'Best '+fmt(best),W/2,112);}
    drawComboHud(g);g.font='18px '+DISP;
    g.textAlign='right';g.fillStyle='rgba(246,239,255,.4)';g.fillText('Run '+attempt,W-26,34);
    /* Stufe mit Fortschrittsbalken bis zur nächsten */
    const lf=(runT%LVL_T)/LVL_T;g.fillStyle='rgba(246,239,255,.55)';g.fillText('Level '+lvl,W-26,60);
    g.fillStyle='rgba(246,239,255,.12)';g.fillRect(W-126,74,100,3);g.fillStyle='rgba(246,239,255,.5)';g.fillRect(W-126,74,100*lf,3);
    drawEffects(g);
    g.textAlign='center';
  }
  calls.slice(0,1).forEach(c=>{const t=c.t,s=t<.12?.5+t/.12*.7:1.2-Math.min(.2,(t-.12)*1.5),a=t>.8?1-(t-.8)/.3:1;   // nur die aktuelle große Meldung
    g.save();g.translate(W/2,230);g.scale(s,s);g.transform(1,0,-.14,1,0,0);g.globalAlpha=Math.max(0,a);
    g.font='68px '+DISP;g.lineWidth=10;g.strokeStyle='#120a28';g.strokeText(c.text,0,0);g.fillStyle=c.col;g.fillText(c.text,0,0);g.restore();});
  g.globalAlpha=1;
  if(flash>0){g.fillStyle='rgba(255,255,255,'+flash+')';g.fillRect(-20,-20,W+40,H+40);}
  if(st==='pause'){g.fillStyle='rgba(14,8,32,.45)';g.fillRect(-20,-20,W+40,H+40);}   // Pause-Menü liegt darüber (HTML)
}

/* ---------- Combo-Element oben links: Multiplikator groß, 5 Punkte bis zum nächsten, Zeitbalken ---------- */
function drawComboHud(g){
  const m=mult(),on=combo>0,x=26,y=44;
  g.save();g.textAlign='left';g.textBaseline='middle';g.lineJoin='round';
  g.font='44px '+DISP;const tw=g.measureText('×'+m).width;
  g.save();g.translate(x+tw/2,y);const s=1+multPop*.35;g.scale(s,s);
  g.lineWidth=7;g.strokeStyle='#120a28';g.strokeText('×'+m,-tw/2,0);
  g.fillStyle=on?(frenzy>0?C.gold:C.you):'rgba(246,239,255,.3)';g.fillText('×'+m,-tw/2,0);g.restore();
  const px=x+tw+20;
  if(m>=15){g.font='16px '+DISP;g.fillStyle=C.you;g.fillText('MAX',px,y);}
  else{const done=combo%5;
    for(let i=0;i<5;i++){g.beginPath();g.arc(px+i*18,y,6,0,6.3);
      if(i<done){g.fillStyle=C.you;g.fill();}else{g.lineWidth=2;g.strokeStyle='rgba(246,239,255,'+(on?.35:.18)+')';g.stroke();}}}
  g.font='600 13px "Outfit",sans-serif';g.fillStyle='rgba(246,239,255,'+(on?.7:.35)+')';
  g.fillText('COMBO '+combo+(m<15?'  ·  '+(5-combo%5)+' to ×'+(m+1):''),x,y+34);
  const bw=180,fr=on?Math.max(0,Math.min(1,comboT/comboMax())):0;
  g.fillStyle='rgba(246,239,255,.12)';g.fillRect(x,y+46,bw,4);
  g.fillStyle=comboHold?C.igel:fr<.3?C.foe:C.you;g.fillRect(x,y+46,bw*fr,4);
  g.restore();
}
/* ---------- Gold Rush / Overdrive als kleine ablaufende Leisten unten ---------- */
function drawEffects(g){
  const fx=[];
  if(frenzy>0)fx.push({t:'GOLD RUSH ×2',c:C.gold,f:frenzy/5});
  if(boost>0)fx.push({t:'OVERDRIVE',c:C.igel,f:boost/4});
  if(untouch>0)fx.push({t:'UNTOUCHABLE',c:'hsl('+(clock*300%360)+',95%,75%)',f:untouch/UNTOUCH_T});
  const w=190,h=30,gap=12,x0=W/2-(fx.length*w+(fx.length-1)*gap)/2;
  fx.forEach((e,i)=>{const x=x0+i*(w+gap),y=H-48;
    g.fillStyle='rgba(14,8,32,.75)';g.beginPath();if(g.roundRect)g.roundRect(x,y,w,h,10);else g.rect(x,y,w,h);g.fill();
    g.lineWidth=2;g.strokeStyle=e.c;g.stroke();
    g.fillStyle=e.c;g.fillRect(x+8,y+h-7,(w-16)*Math.max(0,Math.min(1,e.f)),3);
    g.font='14px '+DISP;g.textAlign='center';g.textBaseline='middle';g.fillText(e.t,x+w/2,y+12);});
  g.textAlign='center';
}

/* ---------- Größe ---------- */
function resize(){
  const r=mainEl.getBoundingClientRect();
  const w=Math.max(260,Math.floor(Math.min(r.width,r.height*16/9))),hh=Math.round(w*9/16);
  stage.style.width=w+'px';stage.style.height=hh+'px';
  const dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(w*dpr);cv.height=Math.round(hh*dpr);scale=cv.width/W;
  bg=document.createElement('canvas');bg.width=cv.width;bg.height=cv.height;
  const c=bg.getContext('2d');c.setTransform(scale,0,0,scale,0,0);drawBg(c);render();
}
if(window.ResizeObserver)new ResizeObserver(resize).observe(mainEl);else addEventListener('resize',resize);


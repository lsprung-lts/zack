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
  if(e.k==='d'){
    const a=Math.atan2(e.vy,e.vx),wob=1+Math.sin(e.age*9+e.seed)*.06;
    c.fillStyle='rgba(255,93,115,.18)';c.beginPath();c.arc(0,0,e.r+8,0,6.3);c.fill();
    c.fillStyle=C.foe;c.beginPath();c.ellipse(0,0,e.r*wob,e.r/wob,0,0,6.3);c.fill();
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
  for(const t of trails){const a=t.life/.22;g.strokeStyle=(t.b?'rgba(92,225,230,':'rgba(255,210,63,')+a*.9+')';g.lineWidth=4+18*a;g.beginPath();g.moveTo(t.x1,t.y1);g.lineTo(t.x2,t.y2);g.stroke();
    g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=2+5*a;g.stroke();}
  g.globalCompositeOperation='source-over';
  for(const e of foes)drawFoe(e);
  /* Spieler mit Serien-Ring */
  if(st!=='dying'&&st!=='over'){
    const m=mult(),ready=cd<=0;
    if(boost>0){g.strokeStyle='rgba(92,225,230,'+(.35+Math.sin(clock*14)*.2)*Math.min(1,boost)+')';g.lineWidth=3;
      g.beginPath();g.arc(p.x,p.y,36+Math.sin(clock*9)*3,0,6.3);g.stroke();}
    if(combo>0){g.lineWidth=5;g.strokeStyle='rgba(246,239,255,.14)';g.beginPath();g.arc(p.x,p.y,28,0,6.3);g.stroke();
      const fr=comboT/comboMax();g.strokeStyle=fr<.3?C.foe:C.you;g.beginPath();g.arc(p.x,p.y,28,-1.571,-1.571+fr*6.283);g.stroke();
      g.font='18px '+DISP;g.textAlign='center';g.textBaseline='middle';g.fillStyle=C.you;g.fillText('×'+m,p.x,p.y-46);}
    g.fillStyle='rgba(255,210,63,'+(ready?.25:.08)+')';g.beginPath();g.arc(p.x,p.y,17+Math.sin(clock*7)*2,0,6.3);g.fill();
    g.fillStyle=ready?C.you:'#8d7fae';g.beginPath();g.arc(p.x,p.y,10,0,6.3);g.fill();
    g.fillStyle='#fff';g.beginPath();g.arc(p.x,p.y,4.5,0,6.3);g.fill();
    if(!ready){g.strokeStyle=C.foe;g.lineWidth=3;g.beginPath();g.arc(p.x,p.y,16,-1.571,-1.571+(cd/.38)*6.283);g.stroke();}
  }
  g.globalCompositeOperation='lighter';
  for(const q of parts){g.globalAlpha=Math.min(1,q.life/q.max*1.6);g.strokeStyle=q.col;g.lineWidth=q.size;
    g.beginPath();g.moveTo(q.x,q.y);g.lineTo(q.x-q.vx*.035,q.y-q.vy*.035);g.stroke();}
  g.globalCompositeOperation='source-over';g.globalAlpha=1;
  g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';
  for(const f of floats){g.globalAlpha=Math.min(1,f.life*3);g.font=(f.big?26:19)+'px '+DISP;
    const fx=Math.max(70,Math.min(W-70,f.x));g.lineWidth=5;g.strokeStyle='#120a28';g.strokeText(f.text,fx,f.y);g.fillStyle=f.col;g.fillText(f.text,fx,f.y);}
  g.globalAlpha=1;
  /* Anzeige */
  if(st!=='menu'){
    g.save();g.translate(W/2,52);const s=1+punch*.22;g.scale(s,s);g.font='60px '+DISP;g.fillStyle=frenzy>0?C.gold:C.ink;
    g.fillText(fmt(shown+.4),0,0);g.restore();
    if(best>0){const bw=360,bx=W/2-bw/2,by=92,fr=Math.min(1,shown/best);
      g.fillStyle='rgba(246,239,255,.14)';g.fillRect(bx,by,bw,6);g.fillStyle=recordHit?C.you:C.foe;g.fillRect(bx,by,bw*fr,6);
      g.font='600 14px "Outfit",sans-serif';g.fillStyle='rgba(246,239,255,.7)';g.fillText(recordHit?'Rekord gebrochen':'Rekord '+fmt(best),W/2,112);}
    g.font='18px '+DISP;g.textAlign='left';g.fillStyle=combo>0?C.you:'rgba(246,239,255,.4)';g.fillText('Serie '+combo,26,34);
    g.textAlign='right';g.fillStyle='rgba(246,239,255,.4)';g.fillText('Versuch '+attempt,W-26,34);
    if(frenzy>0){g.textAlign='center';g.fillStyle=C.gold;g.fillText('Rausch  '+frenzy.toFixed(1)+' s  ·  alles doppelt',W/2,H-30);}
    if(boost>0){g.textAlign='center';g.fillStyle=C.igel;g.fillText('Vollgas  '+boost.toFixed(1)+' s  ·  weiter und ohne Pause',W/2,frenzy>0?H-58:H-30);}
    g.textAlign='center';
  }
  calls.forEach((c,i)=>{const t=c.t,s=t<.12?.5+t/.12*.7:1.2-Math.min(.2,(t-.12)*1.5),a=t>.8?1-(t-.8)/.3:1;
    g.save();g.translate(W/2,230+i*84);g.scale(s,s);g.transform(1,0,-.14,1,0,0);g.globalAlpha=Math.max(0,a);
    g.font='68px '+DISP;g.lineWidth=10;g.strokeStyle='#120a28';g.strokeText(c.text,0,0);g.fillStyle=c.col;g.fillText(c.text,0,0);g.restore();});
  g.globalAlpha=1;
  if(flash>0){g.fillStyle='rgba(255,255,255,'+flash+')';g.fillRect(-20,-20,W+40,H+40);}
  if(st==='pause'){g.fillStyle='rgba(14,8,32,.7)';g.fillRect(-20,-20,W+40,H+40);g.fillStyle=C.ink;g.font='64px '+DISP;g.fillText('Pause',W/2,H/2);}
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


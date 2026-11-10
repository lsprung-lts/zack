'use strict';
/* Zack: Mitwachsende Musik
   Synthwave, 124 BPM, Cis-Moll → A → E → H (je 2 Takte). Alles live mit WebAudio erzeugt, keine Dateien.
   Die Treffertöne (E-Dur-Pentatonik, note()) passen zu jedem dieser Akkorde.

   Intensität 0–6 folgt dem Multiplikator, jede Stufe bringt eine Spur dazu:
     0  Pad + Bass auf Vierteln          (Serie 0)
     1  + Bassdrum                       (Serie läuft)
     2  + Hi-Hat auf den Offbeats        (×2)
     3  + Clap, Bass in Achteln          (×4)
     4  + Arpeggio, Wirbel vor Wechsel   (×7)
     5  + Hi-Hat in Sechzehnteln         (×10)
     6  + Arpeggio oktaviert, Ride       (×13)
   Dazu: Filter öffnet sich mit der Intensität, Pad und Bass pumpen mit der Bassdrum,
   Rausch = Glocken + Filter ganz offen, Vollgas = schnelle Hi-Hats,
   Tod = Filter fällt zu und blendet aus, Menü/Ergebnis = ruhiges Pad.

   Zeitplanung läuft auf der Audio-Uhr (ac.currentTime) mit 0,15 s Vorlauf,
   unabhängig von der Bildrate. tick() wird einmal pro Frame aufgerufen. */
const Music=(()=>{
  const BPM=124,STEP=60/BPM/4,LOOK=.15;
  const CHORDS=[[56,61,64],[57,61,64],[56,59,64],[54,59,63]];   // Cis-Moll, A, E, H (enge Lage)
  const ROOTS=[37,33,40,35];                                     // Cis, A, E, H
  const CUT=[650,1000,1500,2300,3600,6000,10000];                // Filter je Intensität
  const VOL={menu:.3,play:.38,over:.24,pause:0,dead:0};   // bewusst unter den Soundeffekten
  const hz=m=>440*Math.pow(2,(m-69)/12);

  let on=true,bus=null,filt,pump,padF,bassF,dly,noise,mode='off',next=0,step=0,level=0,running=false;
  try{on=localStorage.getItem('zack.music')!=='0'}catch(e){}

  function init(){
    if(bus||!ac)return;
    bus=ac.createGain();bus.gain.value=0;
    const comp=ac.createDynamicsCompressor();comp.threshold.value=-20;comp.ratio.value=3;comp.attack.value=.005;comp.release.value=.15;
    filt=ac.createBiquadFilter();filt.type='lowpass';filt.frequency.value=CUT[0];filt.Q.value=.8;
    pump=ac.createGain();                                   // „Sidechain“: Pad und Bass ducken unter der Bassdrum
    padF=ac.createBiquadFilter();padF.type='lowpass';padF.frequency.value=2200;
    bassF=ac.createBiquadFilter();bassF.type='lowpass';bassF.frequency.value=650;bassF.Q.value=4;
    dly=ac.createDelay(1);dly.delayTime.value=STEP*3;      // punktiertes Achtel-Echo für Arpeggio und Glocken
    const fb=ac.createGain();fb.gain.value=.33;const wet=ac.createGain();wet.gain.value=.28;
    dly.connect(fb).connect(dly);dly.connect(wet).connect(filt);
    padF.connect(pump);bassF.connect(pump);pump.connect(filt);
    filt.connect(bus);bus.connect(comp).connect(ac.destination);
    const len=ac.sampleRate|0;noise=ac.createBuffer(1,len,ac.sampleRate);
    const d=noise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  }

  /* ---------- Instrumente ---------- */
  function osc(type,f,t,dur,vol,dest,att,det){
    const o=ac.createOscillator(),v=ac.createGain();
    o.type=type;o.frequency.value=f;if(det)o.detune.value=det;
    v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(vol,t+(att||.004));v.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(v).connect(dest);o.start(t);o.stop(t+dur+.05);
  }
  function pad(ch,t,vol){                                  // zwei verstimmte Sägezähne pro Ton, langsamer Einsatz
    const dur=32*STEP;
    for(const n of ch)for(const det of[-8,8]){
      const o=ac.createOscillator(),v=ac.createGain();o.type='sawtooth';o.frequency.value=hz(n);o.detune.value=det;
      v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(vol,t+.6);
      v.gain.setValueAtTime(vol,t+dur-.5);v.gain.linearRampToValueAtTime(0,t+dur+.1);
      o.connect(v).connect(padF);o.start(t);o.stop(t+dur+.15);
    }
  }
  function bass(root,t,vol){
    osc('sawtooth',hz(root+12),t,STEP*1.7,.05*vol,bassF);
    osc('sine',hz(root),t,STEP*1.9,.09*vol,pump);
  }
  function kick(t,vol){
    const o=ac.createOscillator(),v=ac.createGain();
    o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);
    v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(.0001,t+.3);
    o.connect(v).connect(filt);o.start(t);o.stop(t+.32);
    pump.gain.cancelScheduledValues(t);pump.gain.setValueAtTime(.28,t);pump.gain.linearRampToValueAtTime(1,t+STEP*3.2);
  }
  function nz(t,dur,vol,type,f,dest,q){
    const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),v=ac.createGain();
    s.buffer=noise;fl.type=type;fl.frequency.value=f;if(q)fl.Q.value=q;
    v.gain.setValueAtTime(vol,t);v.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(fl).connect(v).connect(dest||filt);s.start(t,Math.random()*.8);s.stop(t+dur+.02);
  }
  const hat=(t,vol)=>nz(t,.045,vol,'highpass',7500);
  const clap=t=>{for(const o of[0,.011,.023])nz(t+o,o<.02?.03:.2,.07,'bandpass',1400,filt,1.2);};
  const crash=(t,vol)=>nz(t,1.6,vol||.07,'highpass',4500,bus);
  function arp(ch,s,t,hi){                                 // auf und ab durch Akkord + Oktave
    const notes=[ch[0],ch[1],ch[2],ch[0]+12,ch[1]+12,ch[2]+12];
    const seq=[0,1,2,3,4,5,4,3,2,3,4,5,4,3,2,1],n=notes[seq[s%16]]+12;
    osc('square',hz(n),t,STEP*.85,.016,filt);osc('square',hz(n),t,STEP*.85,.01,dly);
    if(hi&&s%2===0)osc('triangle',hz(n+12),t,STEP*1.5,.014,dly);
  }
  function bell(ch,s,t){
    const n=ch[(s/2|0)%3]+24;
    osc('sine',hz(n),t,.5,.03,filt);osc('sine',hz(n)*2.01,t,.25,.01,dly);
  }

  /* ---------- Ablauf ---------- */
  function intensity(){
    if(st!=='play'||combo<=0)return 0;
    const m=mult();return m>=13?6:m>=10?5:m>=7?4:m>=4?3:m>=2?2:1;
  }
  function schedule(s,t){
    const b=s%16,ci=Math.floor(s/32)%4,ch=CHORDS[ci],root=ROOTS[ci],L=level;
    if(s%32===0)pad(ch,t,mode==='play'?.011:.009);
    if(mode==='menu'||mode==='over'){
      if(b%8===0)bass(root,t,.6);
      if(mode==='menu'&&s%2===0)osc('triangle',hz(ch[(s/2|0)%3]+12),t,STEP*3,.012,dly);
      return;
    }
    if(b%4===0)bass(root,t,1);
    if(L>=3&&b%4===2)bass(root,t,.75);
    if(L>=1&&b%4===0)kick(t,.3);
    if(L>=2&&b%4===2)hat(t,.05);
    if((L>=5||boost>0)&&b%2===1)hat(t,.025);
    if(L>=3&&(b===4||b===12))clap(t);
    if(L>=4)arp(ch,s,t,L>=6);
    if(L>=6&&b%4===2)nz(t,.35,.018,'highpass',9000);
    if(L>=4&&s%32>=28)nz(t,.07,.025+.012*(s%32-28),'bandpass',1800,filt,.9);   // Wirbel vor dem Akkordwechsel
    if(frenzy>0&&s%2===0)bell(ch,s,t);
  }
  function setMode(m){
    const now=ac.currentTime,prev=mode;mode=m;
    bus.gain.cancelScheduledValues(now);bus.gain.setValueAtTime(bus.gain.value,now);
    if(m==='dead'){                                        // Musik „stirbt“ mit: Filter zu, ausblenden
      filt.frequency.cancelScheduledValues(now);filt.frequency.setValueAtTime(filt.frequency.value,now);
      filt.frequency.exponentialRampToValueAtTime(140,now+.8);
      bus.gain.setTargetAtTime(0,now+.25,.3);return;
    }
    filt.frequency.cancelScheduledValues(now);filt.frequency.setValueAtTime(Math.max(60,filt.frequency.value),now);
    bus.gain.setTargetAtTime(VOL[m],now,m==='pause'?.05:.4);
    if(m==='play'&&prev!=='pause'){                         // neue Runde startet auf der Eins mit Becken
      step=0;next=now+.06;crash(next,.05);
    }
  }

  return{
    get on(){return on;},
    toggle(){on=!on;try{localStorage.setItem('zack.music',on?'1':'0')}catch(e){}
      if(!on&&bus)bus.gain.setTargetAtTime(0,ac.currentTime,.05);mode='off';return on;},
    /* einmal pro Frame */
    tick(){
      if(!ac||ac.state!=='running')return;
      if(!on||muted){if(bus&&mode!=='off'){bus.gain.setTargetAtTime(0,ac.currentTime,.05);mode='off';}running=false;return;}
      init();
      const want=st==='play'?'play':st==='pause'?'pause':st==='dying'?'dead':st==='over'?'over':'menu';
      if(want!==mode)setMode(want);
      if(mode==='pause')return;
      const now=ac.currentTime;
      if(!running||next<now-.1){next=now+.06;running=true;}  // nach Pause oder Hänger sauber neu einrasten
      level=intensity();
      if(mode!=='dead'){
        const cut=mode==='play'?(frenzy>0?14000:CUT[level]):mode==='menu'?900:700;
        filt.frequency.setTargetAtTime(cut,now,.3);
      }
      while(next<now+LOOK){schedule(step,next);next+=STEP;step++;}
    },
    /* Akzente aus dem Spiel: Becken auf der nächsten Sechzehntel */
    accent(kind){
      if(!bus||!on||muted||mode!=='play')return;
      const t=Math.max(next,ac.currentTime+.01);
      if(kind==='rescue'){nz(t,.25,.05,'bandpass',2500,filt,.7);return;}
      crash(t,kind==='clear'||kind==='lvl'?.08:.05);
      if(kind==='clear'||kind==='lvl')osc('sine',hz(ROOTS[Math.floor(step/32)%4]),t,1.2,.12,bus);   // tiefer Bass-Drop
    }
  };
})();

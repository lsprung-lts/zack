'use strict';
/* Zack: Records – Statistik über alle Runden und die Highscore-Seite
   Gespeichert im Browser unter „zack.stats“ (pro Gerät/Adresse). */

const STATS_KEY='zack.stats';
let stats={runs:0,kills:0,points:0,bestScore:0,bestWave:0,bestCombo:0,bestKills:0,longest:0,bestShock:0,parClears:0,waveBest:{},top:[]};
try{const s=JSON.parse(localStorage.getItem(STATS_KEY)||'null');if(s)stats=Object.assign(stats,s);}catch(e){}
if(best>stats.bestScore)stats.bestScore=best;                       // alter Rekord aus zack.best übernehmen
const saveStats=()=>{try{localStorage.setItem(STATS_KEY,JSON.stringify(stats))}catch(e){}};

/* Runde eintragen; liefert die neuen persönlichen Rekorde als kurze Texte */
function recordRun(){
  const r={score:Math.round(score),wave:Math.max(0,wavePhase==='fight'?wave:wave),cleared:Object.keys(waveTimes).length,combo:bestCombo,kills,time:runT,
    acc:dashes?Math.round(hits/dashes*100):0,date:Date.now()};
  const news=[];
  stats.runs++;stats.kills+=kills;stats.points+=r.score;stats.parClears+=parClears;
  if(r.score>stats.bestScore&&r.score>0){news.push('Best score');stats.bestScore=r.score;}
  if(r.wave>stats.bestWave){if(stats.bestWave>0)news.push('Highest wave: '+r.wave);stats.bestWave=r.wave;}
  if(r.combo>stats.bestCombo){if(stats.bestCombo>0)news.push('Best combo: '+r.combo);stats.bestCombo=r.combo;}
  if(kills>stats.bestKills){if(stats.bestKills>0)news.push('Most kills: '+kills);stats.bestKills=kills;}
  if(runT>stats.longest){if(stats.longest>0)news.push('Longest run: '+Math.round(runT)+' s');stats.longest=runT;}
  if(shockKills>stats.bestShock){if(stats.bestShock>0)news.push('Biggest Shockwave: '+shockKills);stats.bestShock=shockKills;}
  for(const[n,t]of Object.entries(waveTimes)){const old=stats.waveBest[n];
    if(old===undefined||t<old){if(old!==undefined)news.push('Wave '+n+' in '+t.toFixed(1)+' s');stats.waveBest[n]=+t.toFixed(2);}}
  stats.top.push(r);stats.top.sort((a,b)=>b.score-a.score);stats.top=stats.top.slice(0,10);
  const rank=stats.top.indexOf(r)+1;if(rank>0&&r.score>0&&stats.runs>1)news.unshift('Top 10 · #'+rank);
  saveStats();
  return news;
}

/* ---------- Highscore-Seite ---------- */
const sec=t=>t<60?Math.round(t)+' s':Math.floor(t/60)+':'+String(Math.round(t%60)).padStart(2,'0');
function buildRecords(){
  const S=stats,el=$('recBody');
  if(!S.runs){el.innerHTML='<p class="empty">No runs yet – go make some history.</p>';return;}
  const card=(label,val,sub)=>'<div class="rc"><span>'+label+'</span><b>'+val+'</b>'+(sub?'<small>'+sub+'</small>':'')+'</div>';
  let h='<div class="rcards">'+card('Best score',fmt(S.bestScore))+card('Highest wave',S.bestWave||'–')+card('Best combo',S.bestCombo)
    +card('Most kills',S.bestKills)+card('Longest run',sec(S.longest))+card('Biggest Shockwave',S.bestShock||'–',S.bestShock?'enemies at once':'')+'</div>';
  h+='<h3>Top 10 runs</h3><div class="rtw"><table class="rtab"><thead><tr><th>#</th><th>Points</th><th>Wave</th><th>Combo</th><th>Kills</th><th>Time</th><th>Date</th></tr></thead><tbody>';
  S.top.forEach((r,i)=>{const d=new Date(r.date);
    h+='<tr'+(i===0?' class="first"':'')+'><td>'+(i+1)+'</td><td>'+fmt(r.score)+'</td><td>'+r.wave+'</td><td>'+r.combo+'</td><td>'+r.kills+'</td><td>'+sec(r.time)+'</td><td>'+d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+'</td></tr>';});
  h+='</tbody></table></div>';
  const waves=Object.keys(S.waveBest).map(Number).sort((a,b)=>a-b);
  if(waves.length){h+='<h3>Fastest wave clears</h3><div class="wgrid">';
    for(const n of waves){const t=S.waveBest[n],ok=t<par(n);
      h+='<div class="wv'+(ok?' ok':'')+'" title="Par '+par(n).toFixed(1)+' s"><span>Wave '+n+'</span><b>'+t.toFixed(1)+' s</b>'+(ok?'<small>under par</small>':'<small>par '+par(n).toFixed(1)+'</small>')+'</div>';}
    h+='</div>';}
  h+='<p class="career">'+fmt(S.runs)+' runs · '+fmt(S.kills)+' kills · '+fmt(S.points)+' points · '+fmt(S.parClears)+' waves under par</p>';
  el.innerHTML=h;
}
function showRecords(){buildRecords();$('ovMenu').hidden=true;$('ovRecords').hidden=false;$('ov').classList.remove('how');$('ov').classList.add('rec-on');}
function hideRecords(){$('ovRecords').hidden=true;$('ovMenu').hidden=false;$('ov').classList.remove('rec-on');}

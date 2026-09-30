import { byId, GAMES } from './registry.js';

const id = new URLSearchParams(location.search).get('id') || 'snake';
const meta = byId(id) || GAMES[0];
const mod = await import(`./games/${meta.id}.js`).catch(() => import('./games/snake.js'));

const $ = s => document.querySelector(s);

// ✨ dreamy floating shapes backdrop
(function sparkleBackground(){
  const chars=['💖','🩷','✦','🌸','⭑','🎀','♡','✧'];
  for(let i=0;i<12;i++){
    const s=document.createElement('span');
    s.textContent = chars[(Math.random()*chars.length)|0];
    s.style.left = (Math.random()*100)+'vw';
    if(Math.random()<.4){
      s.className='twinkle';
      s.style.top=(Math.random()*100)+'vh';
      s.style.fontSize=(10+Math.random()*12)+'px';
      s.style.animationDuration=(1.8+Math.random()*2.6)+'s';
      s.style.animationDelay=(-Math.random()*4)+'s';
    } else {
      s.className='float-shape';
      s.style.fontSize=(11+Math.random()*20)+'px';
      s.style.opacity=.18+Math.random()*.3;
      s.style.animationDuration=(15+Math.random()*20)+'s';
      s.style.animationDelay=(-Math.random()*34)+'s';
    }
    document.body.appendChild(s);
  }
})();
const cv = $('#game');
cv.width = meta.w; cv.height = meta.h;

document.title = `${meta.title} · Playful Girl`;
$('#pageTitle').textContent = meta.title;
$('#pageCat').textContent = meta.cat;
$('#aboutDesc').textContent = meta.desc;
$('#controlsList').innerHTML = meta.controls.map(c=>`<li>${c}</li>`).join('');

const bestKey = 'pxden_best_' + meta.id;
let best = +(localStorage.getItem(bestKey) || 0);
$('#best').textContent = best || '—';

const sigEl = $('#callsign');
sigEl.value = localStorage.getItem('pxden_sig') || '';
sigEl.addEventListener('input', () => localStorage.setItem('pxden_sig', sigEl.value.trim()));
fetch('/api/me').then(r=>r.json()).then(m=>{
  const u = m && m.user;
  if(!u) return;
  const chip = $('#acctName'); if(chip) chip.textContent = '@' + u.name;
  if(!sigEl.value){ sigEl.value = u.name.toLowerCase(); localStorage.setItem('pxden_sig', sigEl.value); }
}).catch(()=>{});
const sig = () => sigEl.value.trim().toUpperCase().slice(0,12) || 'ANON';

function post(o){
  fetch('/api/event', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(o) })
    .catch(()=>{});
}

let inst = null;
const ov = $('#overlay');

function startRun(){
  if(inst){ inst(); inst = null; }
  ov.classList.add('hidden');
  post({ game:meta.id, kind:'play' });
  refreshLB();
  inst = mod.start(cv, {
    score: v => { $('#score').textContent = v; },
    over: info => endRun(info),
  });
}

function endRun(info){
  const sc = info.score || 0;
  const prevBest = best;
  if(sc > best){
    best = sc;
    localStorage.setItem(bestKey, best);
    $('#best').textContent = best;
  }
  if(sc > 0){ post({ game:meta.id, kind:'score', score:sc, name:sig() }); refreshLB(); }
  ov.innerHTML = `
    <h2>${info.heading || 'GAME OVER'}</h2>
    ${sc > 0 ? `<div class="big-score">${sc}</div>` : ''}
    ${sc > 0 && sc === best && sc > prevBest ? '<div class="newbest">🌟 NEW PERSONAL BEST</div>' : ''}
    ${info.sub ? `<p class="ov-sub">${info.sub}</p>` : ''}
    <div class="resgrid">
      <div><b>${sc}</b>FINAL SCORE</div>
      <div><b>${best}</b>BEST</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:8px">
      <button class="btn btn-primary" id="again">▶ PLAY AGAIN</button>
      <a class="btn btn-ghost" href="/">All games</a>
    </div>`;
  ov.classList.remove('hidden');
  $('#again').addEventListener('click', startRun);
}

async function refreshLB(){
  try{
    const d = await (await fetch('/api/stats')).json();
    const arr = ((d.games||{})[meta.id]||{}).scores || [];
    $('#leaderboard').innerHTML = arr.length
      ? arr.slice(0,5).map(s=>`<li><span>${s.n}</span><b>${s.s}</b></li>`).join('')
      : '<li class="empty">No scores yet — be the first.</li>';
  }catch{}
}

// initial start overlay
function showStart(){
  ov.innerHTML = `
    <h2>${meta.title}</h2>
    <p class="ov-sub">${meta.desc}</p>
    <div class="ov-controls">${meta.controls.map(c=>`<span class="key">${c}</span>`).join('')}</div>
    <button class="btn btn-primary" id="start" style="margin-top:6px">▶ START GAME</button>
    <p class="ov-sub" style="font-size:12px">Runs entirely in your browser 💖 scores sync to the local Playful Girl board</p>`;
  $('#start').addEventListener('click', startRun);
  ov.classList.remove('hidden');
}

$('#restartBtn').addEventListener('click', startRun);
showStart();
refreshLB();

import { GAMES, byId } from './registry.js';
import { paint } from './coverart.js';

const $ = s => document.querySelector(s);

// ✨ dreamy floating shapes backdrop
(function sparkleBackground(){
  const chars=['💖','🩷','✦','🌸','⭑','🎀','♡','✧'];
  const N = Math.min(20, Math.max(10, (typeof innerWidth!=='number'?1000:innerWidth)/90|0));
  for(let i=0;i<N;i++){
    const s=document.createElement('span');
    s.textContent = chars[(Math.random()*chars.length)|0];
    s.style.left = (Math.random()*100)+'vw';
    if(Math.random()<.4){ // twinkling star
      s.className='twinkle';
      s.style.top=(Math.random()*100)+'vh';
      s.style.fontSize=(10+Math.random()*12)+'px';
      s.style.animationDuration=(1.8+Math.random()*2.6)+'s';
      s.style.animationDelay=(-Math.random()*4)+'s';
    } else { // slow rise
      s.className='float-shape';
      s.style.fontSize=(11+Math.random()*22)+'px';
      s.style.opacity=.22+Math.random()*.38;
      s.style.animationDuration=(14+Math.random()*20)+'s';
      s.style.animationDelay=(-Math.random()*34)+'s';
    }
    document.body.appendChild(s);
  }
})();
const fmt = n => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'k' : String(n);
let cat = 'All', q = '';

const feat = byId('tetris');
$('#featTitle').innerHTML = `Today's star pick: <span>${feat.title.split(' ').slice(1).join(' ')}</span>`;
$('#featDesc').textContent = feat.desc;
$('#featPlay').href = `game.html?id=${feat.id}`;
paint($('#featCover'), feat.id);
$('#hRate').textContent = `${feat.rating} ★`;
$('#hGames').textContent = GAMES.length;

fetch('/api/me').then(r=>r.json()).then(m=>{ const el=$('#acctName'); if(m.user && el) el.textContent='@'+m.user.name; }).catch(()=>{});

// pills
const cats = ['All', ...new Set(GAMES.map(g=>g.cat))];
$('#pills').innerHTML = cats.map(c => `<button class="pill${c==='All'?' on':''}" data-cat="${c}">${c}</button>`).join('');
$('#pills').addEventListener('click', e => {
  const b = e.target.closest('.pill'); if(!b) return;
  cat = b.dataset.cat;
  document.querySelectorAll('.pill').forEach(p => p.classList.toggle('on', p === b));
  render();
});

function card(g){
  return `<article class="card" data-id="${g.id}">
    <div class="cov"><canvas width="320" height="180" data-art="${g.id}"></canvas>
      <div class="playchip"><b>💘</b></div></div>
    <div class="body">
      <h3>${g.title}</h3><p>${g.desc}</p>
      <div class="meta"><span class="chip">${g.cat}</span>
        <span class="rate">★ ${g.rating}</span>
        <span class="plays" id="plays-${g.id}">${fmt(g.plays)} plays</span></div>
    </div></article>`;
}

function render(){
  const list = GAMES.filter(g =>
    (cat === 'All' || g.cat === cat) &&
    (q === '' || (g.title+' '+g.tag+' '+g.desc+' '+g.cat).toLowerCase().includes(q)));
  $('#grid').innerHTML = list.length
    ? list.map(card).join('')
    : `<p class="empty" style="grid-column:1/-1">Nothing matches “${q}” in this category.</p>`;
  $('#count').textContent = `${list.length} of ${GAMES.length} games`;
  $('#grid').querySelectorAll('canvas[data-art]').forEach(c => paint(c, c.dataset.art));
  $('#grid').querySelectorAll('.card').forEach(el =>
    el.addEventListener('click', () => location.href = `game.html?id=${el.dataset.id}`));
  applyStats();
}

function applyStats(){
  // upgrade play counts with live server numbers
  if(window.__stats){
    for(const g of GAMES){
      const el = document.getElementById('plays-'+g.id);
      if(el && window.__stats.games[g.id]) el.textContent = fmt(window.__stats.games[g.id].plays)+' plays';
    }
    const tp = Object.values(window.__stats.games).reduce((a,g)=>a+g.plays,0);
    $('#hPlays').textContent = fmt(tp);
    $('#navStat').innerHTML = `<b>${fmt(tp)}</b> total plays`;
  }
}

$('#q').addEventListener('input', e => { q = e.target.value.trim().toLowerCase(); render(); });

render();
fetch('/api/stats').then(r=>r.json()).then(d => { window.__stats = d; applyStats(); }).catch(()=>{});

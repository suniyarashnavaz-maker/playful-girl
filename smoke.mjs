import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const base = new URL('public/js/', import.meta.url).href;

// ---- absorbing canvas context (stands in for a real 2D ctx) ----
function absorb(target){
  return new Proxy(target || {}, {
    get:(t,k)=> k in t ? t[k] : (...a)=>absorb(),
    set:(t,k,v)=>{ t[k]=v; return true; },
  });
}

let seq = 0, BQ = '';
async function loadPage(htmlFile, qs=''){
  BQ = '?r=' + (++seq);
  const html = readFileSync(root+'public/'+htmlFile, 'utf8').replace(
    /<script type="module"[^>]*><\/script>/g,''); // we'll import modules manually
  const dom = new JSDOM(html, { url:'http://localhost:4801/'+htmlFile+(qs?'?'+qs:''), runScripts:'outside-only' });
  const w = dom.window;
  w.HTMLCanvasElement.prototype.getContext = function(){ return absorb(); };
  let rafQ = [];
  w.requestAnimationFrame = cb => { rafQ.push(cb); return rafQ.length; };
  w.cancelAnimationFrame = () => {};
  global.document = w.document; global.window = w; global.location = w.location;
  global.localStorage = w.localStorage;
  global.requestAnimationFrame = w.requestAnimationFrame;
  global.cancelAnimationFrame = w.cancelAnimationFrame;
  const errors = [];
  w.addEventListener('error', e => errors.push('window.onerror: '+e.message));
  return { dom, w, errors, pump: async ms => {
    const end = Date.now()+ms;
    while(Date.now() < end && rafQ.length){
      const cbs = rafQ; rafQ = [];
      await new Promise(r=>setTimeout(r,16));
      for(const cb of cbs){ try{ cb(performance.now()); }catch(err){ errors.push('raf: '+err.stack.split('\n')[0]); } }
    }
  }};
}

// ---------- TEST 1: home page ----------
{
  const { w, errors, pump } = await loadPage('index.html');
  await import(base+'main.js'+BQ);
  await pump(250);
  const grid = w.document.getElementById('grid');
  const ids = [...grid.querySelectorAll('.card')].map(c=>c.dataset.id);
  const pills = w.document.getElementById('pills').querySelectorAll('.pill').length;
  console.log('HOME cards:', JSON.stringify(ids), '| pills:', pills,
              '| hero title set:', w.document.getElementById('featTitle').innerHTML !== '');
  if(ids.length !== 5 || pills < 5) console.log('HOME FAIL');
  if(errors.length) console.log('HOME errors:', errors.slice(0,5));
}

// ---------- TEST 2: every game page, boot each game for ~2.5s ----------
for(const id of ['snake','pong','breakout','flappy','tetris']){
  const { w, errors, pump } = await loadPage('game.html', 'id='+id);
  await import(base+'player.js'+BQ);
  await pump(100);
  // click START
  const start = w.document.getElementById('start');
  if(!start){ console.log(id, 'FAIL: no start button'); continue; }
  start.dispatchEvent(new w.Event('click'));
  await pump(2500);
  const ov = w.document.getElementById('overlay');
  const state = ov.classList.contains('hidden') ? 'running' : 'overlay:'+ov.querySelector('h2')?.textContent;
  console.log(id.toUpperCase().padEnd(9), '->', state,
              '| score HUD:', w.document.getElementById('score').textContent,
              errors.length ? '| ERRORS: '+errors.slice(0,3).join(' ;; ') : 'ok');
}
console.log('DONE');

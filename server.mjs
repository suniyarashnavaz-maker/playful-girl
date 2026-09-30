import http from 'node:http';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import path from 'node:path';

const ROOT = process.cwd();
const PUB = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data.json');
const ACCT = path.join(ROOT, 'accounts.json');
const PORT = +(process.env.PORT || 4801);

const GAMES = ['snake','pong','breakout','flappy','tetris'];
const SEED = {
  totals: { plays: 1627912, scores: 48211 },
  games: {
    snake:    { plays: 312481, scores: [{s:260,n:'VOLT',t:Date.now()-86400e3*2},{s:230,n:'AZRA',t:Date.now()-86400e3*5},{s:190,n:'PIXEL',t:Date.now()-86400e3*1},{s:150,n:'NOKTA',t:Date.now()-86400e3*9},{s:120,n:'MEGA',t:Date.now()-86400e3*12}] },
    pong:     { plays: 208774, scores: [{s:7,n:'AZRA',t:Date.now()-86400e3*3},{s:7,n:'VOLT',t:Date.now()-86400e3*6},{s:7,n:'KESTREL',t:Date.now()-86400e3*2},{s:7,n:'PIXEL',t:Date.now()-86400e3*11}] },
    breakout: { plays: 421009, scores: [{s:2280,n:'MEGA',t:Date.now()-86400e3*1},{s:2050,n:'NOKTA',t:Date.now()-86400e3*4},{s:1860,n:'AZRA',t:Date.now()-86400e3*7},{s:1540,n:'VOLT',t:Date.now()-86400e3*2}] },
    flappy:   { plays: 287442, scores: [{s:34,n:'PIXEL',t:Date.now()-86400e3*2},{s:29,n:'KESTREL',t:Date.now()-86400e3*5},{s:24,n:'VOLT',t:Date.now()-86400e3*1},{s:18,n:'AZRA',t:Date.now()-86400e3*8}] },
    tetris:   { plays: 398206, scores: [{s:9430,n:'NOKTA',t:Date.now()-86400e3*1},{s:8120,n:'MEGA',t:Date.now()-86400e3*3},{s:7640,n:'AZRA',t:Date.now()-86400e3*6},{s:6210,n:'PIXEL',t:Date.now()-86400e3*2}] }
  }
};

function load(){
  try { return JSON.parse(readFileSync(DATA,'utf8')); } catch { return structuredClone(SEED); }
}
function save(d){ writeFileSync(DATA, JSON.stringify(d,null,1)); }

/* ---------- accounts & sessions ---------- */
function loadA(){ try { return JSON.parse(readFileSync(ACCT,'utf8')); } catch { return { users:{}, sessions:{} }; } }
function saveA(a){ writeFileSync(ACCT, JSON.stringify(a,null,1)); }
const hashPw = (pw,salt) => scryptSync(pw,salt,32).toString('hex');
function checkPw(u,pw){
  const h = Buffer.from(hashPw(pw,u.salt),'hex');
  return h.length===Buffer.from(u.hash,'hex').length && timingSafeEqual(h,Buffer.from(u.hash,'hex'));
}
const pub = u => ({ name:u.name, created:u.created, games:u.games });
function cookieUser(req){
  const c = (req.headers.cookie||'').split('; ').find(x=>x.startsWith('pgtok='));
  if(!c) return null;
  const s = loadA().sessions[c.slice(6)];
  return s ? loadA().users[s] || null : null;
}
function json(res, code, obj, extra={}){
  res.writeHead(code, {'Content-Type':'application/json', ...extra});
  res.end(JSON.stringify(obj));
}
function readBody(req){
  return new Promise((res,rej)=>{ let b=''; req.on('data',c=>b+=c);
    req.on('end',()=>{ try{ res(b?JSON.parse(b):{}); }catch(e){ rej(e);} }); req.on('error',rej); });
}

const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript',
  '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.ico':'image/x-icon',
  '.woff2':'font/woff2', '.txt':'text/plain' };

const srv = http.createServer((req,res)=>{
  const u = new URL(req.url, 'http://localhost');
  const p = u.pathname;

  if(p === '/api/stats'){
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(load()));
  }
  if(p === '/api/event' && req.method === 'POST'){
    let body = '';
    req.on('data', c => body += c);
    req.on('end', ()=>{
      try {
        const e = JSON.parse(body || '{}');
        if(!GAMES.includes(e.game)) throw 0;
        const d = load();
        const g = d.games[e.game];
        if(e.kind === 'play'){ g.plays++; d.totals.plays++; }
        else if(e.kind === 'score' && +e.score > 0){
          g.scores.push({ s:+e.score, n:String(e.name||'ANON').toUpperCase().slice(0,12), t:Date.now() });
          g.scores.sort((a,b)=> b.s-a.s); g.scores = g.scores.slice(0,10);
          d.totals.scores++;
        }
        save(d);
        // tie the record to the logged-in account, if any
        const au = cookieUser(req);
        if(au){
          const a = loadA();
          const rec = (a.users[au.name.toLowerCase()].games[e.game] ||= { plays:0, best:0, last:0, t:0 });
          rec.t = Date.now();
          if(e.kind === 'play') rec.plays++;
          else if(e.kind === 'score' && +e.score > 0){ rec.last = +e.score; if(+e.score > rec.best) rec.best = +e.score; }
          saveA(a);
        }
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end('{"ok":true}');
      } catch { res.writeHead(400); res.end('{"ok":false}'); }
    });
    return;
  }

  /* ---------- auth API ---------- */
  if(p === '/api/register' && req.method === 'POST'){
    readBody(req).then(e=>{
      const name = String(e.username||'').trim(), pw = String(e.password||'');
      if(!/^[a-zA-Z0-9_]{3,12}$/.test(name)) return json(res,400,{ok:false,error:'Username: 3–12 letters, numbers or _'});
      if(pw.length < 4) return json(res,400,{ok:false,error:'Password must be at least 4 characters'});
      const a = loadA(); const key = name.toLowerCase();
      if(a.users[key]) return json(res,409,{ok:false,error:'That username is taken — try signing in'});
      const salt = randomBytes(16).toString('hex');
      a.users[key] = { name, salt, hash: hashPw(pw,salt), created: Date.now(), games: {} };
      const tok = randomBytes(24).toString('hex');
      a.sessions[tok] = key; saveA(a);
      json(res,200,{ok:true,user:pub(a.users[key])},{'Set-Cookie':`pgtok=${tok}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60*60*24*30}`});
    }).catch(()=>json(res,400,{ok:false,error:'Bad request'}));
    return;
  }
  if(p === '/api/login' && req.method === 'POST'){
    readBody(req).then(e=>{
      const u = loadA().users[String(e.username||'').trim().toLowerCase()];
      if(!u || !checkPw(u,String(e.password||''))) return json(res,401,{ok:false,error:'Wrong username or password 💔'});
      const a = loadA(); const tok = randomBytes(24).toString('hex');
      a.sessions[tok] = u.name.toLowerCase(); saveA(a);
      json(res,200,{ok:true,user:pub(u)},{'Set-Cookie':`pgtok=${tok}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${60*60*24*30}`});
    }).catch(()=>json(res,400,{ok:false,error:'Bad request'}));
    return;
  }
  if(p === '/api/logout' && req.method === 'POST'){
    const c = (req.headers.cookie||'').split('; ').find(x=>x.startsWith('pgtok='));
    if(c){ const a = loadA(); delete a.sessions[c.slice(6)]; saveA(a); }
    json(res,200,{ok:true},{'Set-Cookie':'pgtok=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0'});
    return;
  }
  if(p === '/api/me'){
    const u = cookieUser(req);
    return json(res,200,{ user: u ? { name:u.name, created:u.created, games:u.games } : null });
  }

  // static
  let fp = p === '/' ? 'index.html' : decodeURIComponent(p.replace(/^\/+/,''));
  fp = path.normalize(path.join(PUB, fp));
  if(!fp.startsWith(PUB)) { res.writeHead(403); return res.end('Forbidden'); }
  try {
    if(statSync(fp).isFile()){
      res.writeHead(200, {'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream'});
      res.end(readFileSync(fp));
    } else { res.writeHead(404); res.end('404 — not found'); }
  } catch { res.writeHead(404); res.end('404 — not found'); }
});

srv.listen(PORT, ()=> console.log(`Playful Girl online → http://localhost:${PORT}`));

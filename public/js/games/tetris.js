import { rr } from './util.js';

export const W = 460, H = 468;
const BW = 10, BH = 20, S = 22, OX = 14, OY = 14;
const PANEL_X = 248, PANEL_W = 190;

const SHAPES = {
  I:{ c:'#ff5fa8', cells:[[0,0],[1,0],[2,0],[3,0]] },
  O:{ c:'#ffd166', cells:[[0,0],[1,0],[0,1],[1,1]] },
  T:{ c:'#c084fc', cells:[[1,0],[0,1],[1,1],[2,1]] },
  S:{ c:'#5eead4', cells:[[1,0],[2,0],[0,1],[1,1]] },
  Z:{ c:'#fda4af', cells:[[0,0],[1,0],[1,1],[2,1]] },
  J:{ c:'#e879f9', cells:[[0,0],[0,1],[1,1],[2,1]] },
  L:{ c:'#8ec5ff', cells:[[2,0],[0,1],[1,1],[2,1]] },
};
const POINTS = [0, 40, 100, 300, 1200];

function norm(cells){
  const mx = Math.min(...cells.map(c=>c[0])), my = Math.min(...cells.map(c=>c[1]));
  return cells.map(([x,y]) => [x-mx, y-my]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
}
function rotate(cells){ return norm(cells.map(([x,y]) => [-y, x])); }
function shuffle(a){
  for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

export function start(cv, { score, over }){
  const ctx = cv.getContext('2d');
  let board, bag, cur, next, dropMs, acc, last, raf, live, pts, lines, level;

  const occupied = (cx,cy) =>
    cy >= BH ? true : cx < 0 || cx >= BW ? true : cy >= 0 && !!board[cy][cx];

  function hits(cells, ox, oy){
    return cells.some(([cx,cy]) => {
      const bx = ox+cx, by = oy+cy;
      if(bx < 0 || bx >= BW || by >= BH) return true;
      return by >= 0 && !!board[by][bx];
    });
  }
  function pull(){
    if(!bag.length) bag = shuffle(Object.keys(SHAPES));
    return bag.pop();
  }
  function spawn(){
    cur = { type:next, cells: norm(SHAPES[next].cells.slice()), x:(BW-4)/2|0, y:0 };
    const maxX = Math.max(...cur.cells.map(c=>c[0]));
    cur.x = Math.max(0, (BW - maxX - 1)|0);
    next = pull();
    if(hits(cur.cells, cur.x, cur.y)){
      live = false; cancelAnimationFrame(raf);
      over({ score:pts, heading:'GAME OVER', sub:`Stack topped out. ${lines} lines · Level ${level}.` });
    }
  }
  function dropY(){
    let dy = cur.y;
    while(!hits(cur.cells, cur.x, dy+1)) dy++;
    return dy;
  }
  function lock(){
    for(const [cx,cy] of cur.cells){
      const by = cur.y+cy;
      if(by < 0){
        live = false; cancelAnimationFrame(raf);
        over({ score:pts, heading:'GAME OVER', sub:`Topped out at the ceiling. ${lines} lines.` });
        return;
      }
      board[by][cur.x+cx] = cur.type;
    }
    const kept = board.filter(row => row.some(c => !c));
    const cleared = BH - kept.length;
    while(kept.length < BH) kept.unshift(Array(BW).fill(null));
    board = kept;
    if(cleared){
      pts += POINTS[cleared] * level;
      lines += cleared;
      level = 1 + (lines/10|0);
      dropMs = Math.max(110, 750 - (level-1)*65);
      score(pts);
    }
    spawn();
  }
  function move(dx){
    if(live && !hits(cur.cells, cur.x+dx, cur.y)) cur.x += dx;
  }
  function soft(){
    if(!live) return;
    if(!hits(cur.cells, cur.x, cur.y+1)){ cur.y++; } else lock();
  }
  function hard(){
    if(!live) return;
    cur.y = dropY();
    lock();
  }
  function rot(){
    if(!live) return;
    const rc = rotate(cur.cells);
    for(const k of [0,-1,1,-2,2]){
      if(!hits(rc, cur.x+k, cur.y)){ cur.x += k; cur.cells = rc; return; }
    }
  }

  function step(){
    soft();
    if(hits(cur.cells, cur.x, cur.y+1)) lock();
  }

  function cellRect(cx, cy, s){
    return [OX + cx*s, OY + cy*s, s, s];
  }
  function piece(xo, yo, cells, col, ghost){
    for(const [cx,cy] of cells){
      const [bx,by,bw,bh] = cellRect(xo+cx, yo+cy, S);
      if(ghost){
        ctx.strokeStyle = col; ctx.globalAlpha = .35; ctx.lineWidth = 2;
        rr(ctx, bx+2, by+2, bw-4, bh-4, 4); ctx.stroke();
        ctx.globalAlpha = 1;
      } else {
        ctx.fillStyle = col;
        rr(ctx, bx+1.5, by+1.5, bw-3, bh-3, 4); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.30)';
        ctx.fillRect(bx+4, by+4, bw-8, 3);
      }
    }
  }

  function box(x, y, w, h, label, value){
    ctx.fillStyle = '#12162e'; rr(ctx, x, y, w, h, 8); ctx.fill();
    ctx.strokeStyle = '#4a2a55'; ctx.lineWidth = 1.5; rr(ctx, x, y, w, h, 8); ctx.stroke();
    ctx.fillStyle = '#cf9fce'; ctx.font = '700 11px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText(label, x+12, y+20);
    ctx.fillStyle = '#fff0f9'; ctx.font = '800 24px Segoe UI';
    ctx.fillText(String(value), x+12, y+h-12);
  }

  function draw(){
    ctx.fillStyle = '#170b20'; ctx.fillRect(0,0,W,H);
    // board frame
    ctx.fillStyle = '#241233'; ctx.fillRect(OX-4, OY-4, BW*S+8, BH*S+8);
    ctx.strokeStyle = '#52305f'; ctx.lineWidth = 2;
    ctx.strokeRect(OX-4, OY-4, BW*S+8, BH*S+8);
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1;
    for(let i=1;i<BW;i++){ ctx.beginPath(); ctx.moveTo(OX+i*S,OY); ctx.lineTo(OX+i*S,OY+BH*S); ctx.stroke(); }
    for(let i=1;i<BH;i++){ ctx.beginPath(); ctx.moveTo(OX,OY+i*S); ctx.lineTo(OX+BW*S,OY+i*S); ctx.stroke(); }
    // settled
    for(let ry=0;ry<BH;ry++) for(let rx=0;rx<BW;rx++){
      const t = board[ry][rx];
      if(t) piece(rx, ry, [[0,0]], SHAPES[t].c, false);
    }
    // ghost + current
    const gy = dropY();
    if(gy !== cur.y) piece(cur.x, gy, cur.cells, SHAPES[cur.type].c, true);
    piece(cur.x, cur.y, cur.cells, SHAPES[cur.type].c, false);
    // side panel
    box(PANEL_X, 14, PANEL_W, 110, 'NEXT', '');
    const nCells = SHAPES[next].cells, nc = SHAPES[next].c;
    const mxc = Math.max(...nCells.map(c=>c[0])), myc = Math.max(...nCells.map(c=>c[1]));
    const ms = 20, nx0 = PANEL_X + (PANEL_W - (mxc+1)*ms)/2, ny0 = 14 + (110 - (myc+1)*ms)/2;
    for(const [cx,cy] of nCells){
      ctx.fillStyle = nc;
      rr(ctx, nx0+cx*ms+1.5, ny0+cy*ms+1.5, ms-3, ms-3, 4); ctx.fill();
    }
    box(PANEL_X, 136, PANEL_W, 74, 'SCORE', pts);
    box(PANEL_X, 222, PANEL_W, 74, 'LINES', lines);
    box(PANEL_X, 308, PANEL_W, 74, 'LEVEL', level);
    ctx.fillStyle = '#8b91c2'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText('SPACE = hard drop', PANEL_X, 402);
    ctx.fillText('X / ↑ = rotate', PANEL_X, 418);
  }

  function loop(t){
    raf = requestAnimationFrame(loop);
    const dt = t-last; last = t;
    acc += dt;
    while(acc >= dropMs && live){ acc -= dropMs; step(); if(!live) break; }
    draw();
  }

  function kd(e){
    switch(e.code){
      case 'ArrowLeft': move(-1); e.preventDefault(); break;
      case 'ArrowRight': move(1); e.preventDefault(); break;
      case 'ArrowDown': soft(); e.preventDefault(); break;
      case 'ArrowUp': case 'KeyX': rot(); e.preventDefault(); break;
      case 'Space': hard(); e.preventDefault(); break;
    }
  }
  window.addEventListener('keydown', kd);

  board = Array.from({length:BH}, () => Array(BW).fill(null));
  bag = []; pts = 0; lines = 0; level = 1; dropMs = 750; acc = 0; live = true;
  next = pull();
  spawn();
  score(0);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); };
}

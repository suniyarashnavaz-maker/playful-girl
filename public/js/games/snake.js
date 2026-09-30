import { rr, TAU } from './util.js';

export const W = 480, H = 480;
const C = 24, N = 20;

export function start(cv, { score, over }){
  const ctx = cv.getContext('2d');
  let snake, d, q, food, stepMs, acc, last, raf, alive, pts;

  function reset(){
    snake = [{x:8,y:10},{x:7,y:10},{x:6,y:10}];
    d = {x:1,y:0}; q = []; pts = 0; stepMs = 130; acc = 0; alive = true;
    place(); score(0);
  }
  function place(){
    do { food = { x:(Math.random()*N)|0, y:(Math.random()*N)|0 }; }
    while(snake.some(s=>s.x===food.x && s.y===food.y));
  }
  function die(sub){ if(!alive) return; alive = false; over({ score:pts, sub }); }

  function tick(){
    while(q.length){
      const n = q.shift();
      if(!(n.x === -d.x && n.y === -d.y)){ d = n; break; }
    }
    const h = { x:snake[0].x+d.x, y:snake[0].y+d.y };
    if(h.x<0 || h.y<0 || h.x>=N || h.y>=N) return die('You ran into the wall.');
    if(snake.some((s,i)=> i < snake.length-1 && s.x===h.x && s.y===h.y)) return die('You bit your own tail.');
    snake.unshift(h);
    if(h.x===food.x && h.y===food.y){
      pts += 10; score(pts); stepMs = Math.max(60, stepMs-3); place();
    } else snake.pop();
  }

  function draw(){
    ctx.fillStyle = '#1d0f24'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(74,222,128,.06)';
    for(let i=1;i<N;i++){
      ctx.beginPath(); ctx.moveTo(i*C,0); ctx.lineTo(i*C,H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*C); ctx.lineTo(W,i*C); ctx.stroke();
    }
    ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff4d6d';
    ctx.beginPath(); ctx.arc(food.x*C+C/2, food.y*C+C/2, C/2-5, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    for(let i=snake.length-1;i>=0;i--){
      const s = snake[i];
      ctx.fillStyle = i===0 ? '#ff5fa8' : (i%2 ? '#ff9ccb' : '#e14d9b');
      rr(ctx, s.x*C+2, s.y*C+2, C-4, C-4, i===0 ? 8 : 6); ctx.fill();
    }
    const hd = snake[0];
    ctx.fillStyle = '#4a0d2e';
    ctx.beginPath();
    ctx.arc(hd.x*C+C/2 + d.x*5 - d.y*5, hd.y*C+C/2 + d.y*5 - d.x*5, 2.6, 0, TAU);
    ctx.arc(hd.x*C+C/2 + d.x*5 + d.y*5, hd.y*C+C/2 + d.y*5 + d.x*5, 2.6, 0, TAU);
    ctx.fill();
  }

  function loop(t){
    raf = requestAnimationFrame(loop);
    const dt = t-last; last = t;
    acc += dt;
    while(acc >= stepMs && alive){ acc -= stepMs; tick(); }
    draw();
  }

  const KEY = { ArrowUp:{x:0,y:-1},KeyW:{x:0,y:-1},ArrowDown:{x:0,y:1},KeyS:{x:0,y:1},
                ArrowLeft:{x:-1,y:0},KeyA:{x:-1,y:0},ArrowRight:{x:1,y:0},KeyD:{x:1,y:0} };
  function kd(e){
    const k = KEY[e.code]; if(!k) return;
    e.preventDefault();
    if(q.length < 3) q.push(k);
  }
  window.addEventListener('keydown', kd);
  reset();
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); };
}

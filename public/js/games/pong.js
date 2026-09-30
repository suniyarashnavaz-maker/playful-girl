import { clamp, rand, rr } from './util.js';

export const W = 720, H = 440;
const PW = 14, PH = 84, PAD = 28, R = 9, WIN = 7;

export function start(cv, { score, over }){
  const ctx = cv.getContext('2d');
  let py, ay, ball, ps, cs, live, raf, last, keys = new Set(), trail = [];

  function serve(dir){
    ball = { x:W/2, y:H/2, vx:dir*rand(4.6,5.4), vy:rand(-3.2,3.2) };
    trail = [];
  }
  function end(win){
    if(!live) return;
    live = false;
    cancelAnimationFrame(raf);
    over({
      score: ps,
      heading: win ? 'VICTORY!' : 'DEFEAT',
      sub: win ? `You close it out ${ps}–${cs}.` : `The CPU takes it ${ps}–${cs}.`,
    });
  }
  function step(f){
    if(keys.has('up'))   py -= 8*f;
    if(keys.has('down')) py += 8*f;
    py = clamp(py, 6, H-PH-6);
    const target = ball.y - PH/2;
    ay += clamp(target-ay, -3.7*f, 3.7*f);
    ay = clamp(ay, 6, H-PH-6);

    ball.x += ball.vx*f; ball.y += ball.vy*f;
    if(ball.y < R){ ball.y = R; ball.vy *= -1; }
    if(ball.y > H-R){ ball.y = H-R; ball.vy *= -1; }

    // player paddle
    if(ball.vx < 0 && ball.x-R <= PAD+PW && ball.x-R >= PAD-12 && ball.y > py-R && ball.y < py+PH+R){
      const rel = clamp((ball.y-(py+PH/2))/(PH/2), -1, 1);
      const sp = Math.min(11.5, Math.hypot(ball.vx,ball.vy)*1.05 + 0.2);
      ball.vx = Math.cos(rel*1.05)*sp; ball.vy = Math.sin(rel*1.05)*sp;
      ball.x = PAD+PW+R;
    }
    // cpu paddle
    if(ball.vx > 0 && ball.x+R >= W-PAD-PW && ball.x+R <= W-PAD+12 && ball.y > ay-R && ball.y < ay+PH+R){
      const rel = clamp((ball.y-(ay+PH/2))/(PH/2), -1, 1);
      const sp = Math.min(11.5, Math.hypot(ball.vx,ball.vy)*1.05 + 0.2);
      ball.vx = -Math.cos(rel*1.05)*sp; ball.vy = Math.sin(rel*1.05)*sp;
      ball.x = W-PAD-PW-R;
    }

    trail.push({x:ball.x, y:ball.y}); if(trail.length > 7) trail.shift();

    if(ball.x < -24){ cs++; score(ps); if(cs >= WIN) return end(false); serve(1); }
    if(ball.x > W+24){ ps++; score(ps); if(ps >= WIN) return end(true); serve(-1); }
  }

  function draw(){
    ctx.fillStyle = '#170b20'; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = 'rgba(124,92,255,.35)'; ctx.lineWidth = 3; ctx.setLineDash([12,14]);
    ctx.beginPath(); ctx.moveTo(W/2,10); ctx.lineTo(W/2,H-10); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = '800 84px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(34,211,238,.20)'; ctx.fillText(ps, W/2-110, 108);
    ctx.fillStyle = 'rgba(251,146,60,.20)'; ctx.fillText(cs, W/2+110, 108);
    trail.forEach((p,i)=>{ ctx.fillStyle = `rgba(255,255,255,${0.05*(i+1)})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,R*(i/6+0.3),0,7); ctx.fill(); });
    ctx.shadowColor = '#ff5fa8'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff5fa8'; rr(ctx, PAD, py, PW, PH, 7); ctx.fill();
    ctx.shadowColor = '#c084fc';
    ctx.fillStyle = '#c084fc'; rr(ctx, W-PAD-PW, ay, PW, PH, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, 7); ctx.fill();
  }

  function loop(t){
    raf = requestAnimationFrame(loop);
    const f = clamp((t-last)/16.667, 0, 2.5); last = t;
    if(live) step(f);
    draw();
  }
  function kd(e){
    if(e.code==='ArrowUp'||e.code==='KeyW'){ keys.add('up'); e.preventDefault(); }
    if(e.code==='ArrowDown'||e.code==='KeyS'){ keys.add('down'); e.preventDefault(); }
  }
  function ku(e){
    if(e.code==='ArrowUp'||e.code==='KeyW') keys.delete('up');
    if(e.code==='ArrowDown'||e.code==='KeyS') keys.delete('down');
  }
  function mm(e){
    const r = cv.getBoundingClientRect();
    py = clamp((e.clientY-r.top)*(H/r.height) - PH/2, 6, H-PH-6);
  }
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  cv.addEventListener('mousemove', mm);

  py = ay = (H-PH)/2; ps = 0; cs = 0; live = true;
  serve(Math.random() < 0.5 ? 1 : -1);
  score(0);
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return ()=>{
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    cv.removeEventListener('mousemove', mm);
  };
}

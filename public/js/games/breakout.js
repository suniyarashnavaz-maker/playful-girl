import { clamp, rand, rr } from './util.js';

export const W = 680, H = 460;
const COLS = 8, ROWS = 5, GAP = 6, PX = 24, TOP = 52;
const BW = (W - 2*PX - (COLS-1)*GAP) / COLS, BH = 17;
const PW = 100, PH = 12, PY = H-30;
const ROWCOL = ['#ff7ab8','#ffa3d4','#ffd166','#5eead4','#c084fc'];

export function start(cv, { score, over }){
  const ctx = cv.getContext('2d');
  let px, ball, bricks, lives, cleared, total, stuck, pts, live, raf, last, keys = new Set();

  function reset(){
    px = (W-PW)/2; lives = 3; cleared = 0; total = COLS*ROWS; pts = 0;
    bricks = Array.from({length:ROWS}, () => Array(COLS).fill(true));
    launch(); live = true; score(0);
  }
  function launch(){
    stuck = true;
    const ang = rand(-1.05,-0.55);
    ball = { x:px+PW/2, y:PY-9, vx:Math.cos(ang)*6.5, vy:Math.sin(ang)*6.5, r:8 };
  }
  function finish(head, sub){
    if(!live) return;
    live = false; cancelAnimationFrame(raf);
    over({ score:pts, heading:head, sub });
  }
  function collideBrick(bx,by){
    const dx = ball.r + BW/2 - Math.abs(ball.x-(bx+BW/2));
    const dy = ball.r + BH/2 - Math.abs(ball.y-(by+BH/2));
    if(dx <= 0 || dy <= 0) return null;
    return dx < dy ? 'x' : 'y';
  }
  function stepBall(f){
    ball.x += ball.vx*f; ball.y += ball.vy*f;
    if(ball.x < ball.r){ ball.x = ball.r; ball.vx *= -1; }
    if(ball.x > W-ball.r){ ball.x = W-ball.r; ball.vx *= -1; }
    if(ball.y < ball.r){ ball.y = ball.r; ball.vy *= -1; }

    if(ball.vy > 0 && ball.y + ball.r >= PY && ball.y < PY+PH && ball.x > px-10 && ball.x < px+PW+10){
      const rel = clamp((ball.x-(px+PW/2))/(PW/2), -1, 1);
      const sp = Math.min(12, Math.hypot(ball.vx,ball.vy)*1.02 + 0.1);
      ball.vx = Math.cos(rel*1.08)*sp; ball.vy = -Math.sin(rel*1.08)*sp;
      ball.y = PY - ball.r;
    }

    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      if(!bricks[r][c]) continue;
      const bx = PX + c*(BW+GAP), by = TOP + r*(BH+GAP);
      const axis = collideBrick(bx,by);
      if(axis){
        bricks[r][c] = false; cleared++;
        pts += (ROWS-r)*5 + 5; score(pts);
        if(axis === 'x') ball.vx *= -1; else ball.vy *= -1;
        if(cleared === total) return finish('BOARD CLEARED!', 'Every single brick destroyed. Flawless.');
        return;
      }
    }
  }

  function step(f){
    if(keys.has('left'))  px -= 9*f;
    if(keys.has('right')) px += 9*f;
    px = clamp(px, 6, W-PW-6);
    if(stuck){
      ball.x = px + PW/2;
      ball.y = PY - ball.r;
    } else {
      const half = f/2.5;
      for(let i=0;i<3;i++){ stepBall(half); if(!live) return; }
    }
    if(ball.y - ball.r > H){
      lives--;
      if(lives <= 0) return finish('GAME OVER', 'Out of lives. The wall wins this round.');
      launch();
    }
  }

  function draw(){
    ctx.fillStyle = '#170b20'; ctx.fillRect(0,0,W,H);
    // lives
    ctx.font = '18px Segoe UI'; ctx.textAlign = 'left';
    let hearts = ''; for(let i=0;i<lives;i++) hearts += '♥ ';
    ctx.fillStyle = '#ff5fa8'; ctx.fillText(hearts, 16, 28);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '12px Segoe UI';
    ctx.fillText(stuck ? 'CLICK OR PRESS SPACE TO LAUNCH' : '', 16, H-14);
    // bricks
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      if(!bricks[r][c]) continue;
      const bx = PX + c*(BW+GAP), by = TOP + r*(BH+GAP);
      ctx.fillStyle = ROWCOL[r];
      rr(ctx, bx, by, BW, BH, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.fillRect(bx+3, by+2, BW-6, 3);
    }
    // paddle
    const g = ctx.createLinearGradient(px,0,px+PW,0);
    g.addColorStop(0,'#ff5fa8'); g.addColorStop(1,'#c084fc');
    ctx.fillStyle = g; rr(ctx, px, PY, PW, PH, 7); ctx.fill();
    // ball
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function loop(t){
    raf = requestAnimationFrame(loop);
    const f = clamp((t-last)/16.667, 0, 2.5); last = t;
    if(live) step(f);
    draw();
  }
  function fire(){ if(live && stuck) stuck = false; }
  function kd(e){
    if(e.code==='ArrowLeft'||e.code==='KeyA'){ keys.add('left'); e.preventDefault(); }
    if(e.code==='ArrowRight'||e.code==='KeyD'){ keys.add('right'); e.preventDefault(); }
    if(e.code==='Space'){ fire(); e.preventDefault(); }
  }
  function ku(e){
    if(e.code==='ArrowLeft'||e.code==='KeyA') keys.delete('left');
    if(e.code==='ArrowRight'||e.code==='KeyD') keys.delete('right');
  }
  function mm(e){
    const r = cv.getBoundingClientRect();
    px = clamp((e.clientX-r.left)*(W/r.width) - PW/2, 6, W-PW-6);
  }
  cv.addEventListener('mousedown', fire);
  cv.addEventListener('mousemove', mm);
  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);

  reset();
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return ()=>{
    cancelAnimationFrame(raf);
    cv.removeEventListener('mousedown', fire);
    cv.removeEventListener('mousemove', mm);
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
  };
}

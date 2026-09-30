import { clamp, rand, rr } from './util.js';

export const W = 460, H = 600;
const GROUND = H-48, BX = 110, R = 15;
const GRAV = 0.42, FLAP = -7.7, SPEED = 2.75, GAP = 150, PWD = 64, SPACING = 250;

export function start(cv, { score, over }){
  const ctx = cv.getContext('2d');
  let y, vy, pipes, pts, live, raf, last, phase, offset;

  function reset(){
    y = H*0.4; vy = 0; pts = 0; phase = 0; offset = 0; live = true;
    pipes = [{ x: W+180, gap: rand(140, GROUND-260), passed:false }];
    score(0);
  }
  function die(sub){
    if(!live) return;
    live = false; cancelAnimationFrame(raf);
    over({ score:pts, sub });
  }
  function flap(){ if(live) vy = FLAP; }

  function step(f){
    vy += GRAV*f; y += vy*f;
    if(y - R < 0){ y = R; vy = Math.max(vy, 0); }
    if(y + R >= GROUND){ y = GROUND-R; return die('You hit the ground.'); }
    phase += f*0.35;

    for(const p of pipes){
      p.x -= SPEED*f;
      if(!p.passed && p.x + PWD < BX - R){ p.passed = true; pts++; score(pts); }
      if(BX + R > p.x && BX - R < p.x + PWD){
        if(y - R < p.gap || y + R > p.gap + GAP) return die('You clipped a pipe.');
      }
    }
    pipes = pipes.filter(p => p.x > -PWD-20);
    if(pipes[pipes.length-1].x < W - SPACING){
      pipes.push({ x: W+20, gap: rand(130, GROUND-250), passed:false });
    }
    offset = (offset + SPEED*f) % 48;
  }

  function pipe(x, gy, alpha){
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(x,0,x+PWD,0);
    g.addColorStop(0,'#5eead4'); g.addColorStop(.5,'#0d9488'); g.addColorStop(1,'#0f766e');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, PWD, gy-R*0.6);
    ctx.fillRect(x, gy+GAP+R*0.6, PWD, GROUND-(gy+GAP)-R*0.6);
    ctx.fillStyle = '#115e59';
    rr(ctx, x-5, gy-R*0.6-16, PWD+10, 16, 4); ctx.fill();
    rr(ctx, x-5, gy+GAP+R*0.6, PWD+10, 16, 4); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function draw(){
    const sky = ctx.createLinearGradient(0,0,0,H);
    sky.addColorStop(0,'#c084fc'); sky.addColorStop(.65,'#ff8ac4'); sky.addColorStop(1,'#ff5fa8');
    ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
    // far clouds
    ctx.fillStyle = 'rgba(255,255,255,.14)';
    for(let i=0;i<4;i++){
      const cx = ((i*170 - offset*0.4) % (W+120) + W+120) % (W+120) - 60;
      ctx.beginPath();
      ctx.arc(cx, 90+i*52, 26, 0, 7); ctx.arc(cx+30, 96+i*52, 20, 0, 7); ctx.fill();
    }
    for(const p of pipes) pipe(p.x, p.gap, 1);
    // ground
    ctx.fillStyle = '#3f3f46'; ctx.fillRect(0, GROUND, W, H-GROUND);
    ctx.fillStyle = '#52525b'; ctx.fillRect(0, GROUND, W, 6);
    ctx.fillStyle = '#29292e';
    for(let gx = -offset; gx < W+48; gx += 48) ctx.fillRect(gx, GROUND+14, 24, 5);
    // bird
    ctx.save();
    ctx.translate(BX, y);
    ctx.rotate(clamp(vy*0.055, -0.5, 1.25));
    ctx.fillStyle = '#ffe4f0';
    ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    ctx.fillStyle = '#fda4af';
    ctx.beginPath(); ctx.ellipse(-4, 4, 9, 6, -0.35 + Math.sin(phase)*0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -5, 4.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(7.4, -5, 2.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#fb923c';
    ctx.beginPath(); ctx.moveTo(R-2, -2); ctx.lineTo(R+8, 2); ctx.lineTo(R-2, 6); ctx.fill();
    ctx.restore();
    // score HUD
    ctx.font = '800 44px Segoe UI'; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.strokeText(pts, W/2, 66);
    ctx.fillStyle = '#fff'; ctx.fillText(pts, W/2, 66);
  }

  function loop(t){
    raf = requestAnimationFrame(loop);
    const f = clamp((t-last)/16.667, 0, 2.5); last = t;
    if(live) step(f);
    draw();
  }

  function kd(e){
    if(['Space','ArrowUp','KeyW'].includes(e.code)){ e.preventDefault(); flap(); }
  }
  window.addEventListener('keydown', kd);
  cv.addEventListener('mousedown', flap);
  cv.addEventListener('touchstart', e=>{ e.preventDefault(); flap(); }, {passive:false});

  reset();
  last = performance.now();
  raf = requestAnimationFrame(loop);
  return ()=>{
    cancelAnimationFrame(raf);
    window.removeEventListener('keydown', kd);
    cv.removeEventListener('mousedown', flap);
    cv.removeEventListener('touchstart', flap);
  };
}

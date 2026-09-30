import { rr, TAU } from './games/util.js';

const ROW = ['#ff7ab8','#ffa3d4','#ffd166','#5eead4','#c084fc'];

function bg(x,W,H,c1,c2){ const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,c1); g.addColorStop(1,c2); x.fillStyle=g; x.fillRect(0,0,W,H); }

export function paint(cv,id){
  const x = cv.getContext('2d'), W = cv.width, H = cv.height;
  x.save();
  if(id==='snake'){
    bg(x,W,H,'#2b1233','#120716');
    x.strokeStyle='rgba(255,122,184,.08)';
    for(let i=1;i<12;i++){ x.beginPath(); x.moveTo(i*W/12,0); x.lineTo(i*W/12,H); x.stroke();
      x.beginPath(); x.moveTo(0,i*H/12); x.lineTo(W,i*H/12); x.stroke(); }
    for(let i=0;i<15;i++){
      const t=i/14, sx=W*0.10+t*W*0.72, sy=H*0.5+Math.sin(t*Math.PI*2)*H*0.20;
      const s=H*(0.20-t*0.11);
      x.fillStyle= i===14 ? '#ff5fa8' : (i%2? '#ff8ac4':'#d946a0');
      rr(x,sx-s/2,sy-s/2,s,s,i===14?s*0.4:s*0.3); x.fill();
    }
    const hx=W*0.82, hy=H*0.5+Math.sin(Math.PI*2)*H*0.20;
    x.fillStyle='#120716'; x.beginPath(); x.arc(hx+H*0.03,hy-H*0.025,H*0.02,0,TAU); x.fill();
    x.fillStyle='#ffd166'; x.beginPath(); x.arc(W*0.93,H*0.5,H*0.055,0,TAU); x.fill();
    x.fillStyle='#ffe3a3'; x.beginPath(); x.ellipse(W*0.945,H*0.435,H*0.02,H*0.032,-0.6,0,TAU); x.fill();
  }
  else if(id==='pong'){
    bg(x,W,H,'#1c0f2e','#0a0512');
    x.strokeStyle='rgba(255,122,184,.25)'; x.setLineDash([H*0.05,H*0.06]);
    x.beginPath(); x.moveTo(W/2,0); x.lineTo(W/2,H); x.stroke(); x.setLineDash([]);
    x.fillStyle='#ff5fa8'; rr(x,W*0.07,H*0.42,W*0.02,H*0.18,6); x.fill();
    x.fillStyle='#c084fc'; rr(x,W*0.91,H*0.38,W*0.02,H*0.18,6); x.fill();
    for(let i=4;i>=1;i--){ x.fillStyle=`rgba(255,255,255,${0.06*i})`;
      x.beginPath(); x.arc(W*0.55+i*W*0.02,H*0.42-i*H*0.02,H*0.045,0,TAU); x.fill(); }
    x.shadowColor='#fff'; x.shadowBlur=18;
    x.fillStyle='#fff'; x.beginPath(); x.arc(W*0.55,H*0.42,H*0.045,0,TAU); x.fill(); x.shadowBlur=0;
    x.font=`800 ${H*0.13}px Segoe UI`; x.textAlign='center';
    x.fillStyle='rgba(255,255,255,.35)'; x.fillText('7',W*0.30,H*0.30); x.fillText('5',W*0.70,H*0.30);
  }
  else if(id==='breakout'){
    bg(x,W,H,'#2a1040','#12061f');
    const cols=8, bw=(W-W*0.12-(cols-1)*6)/cols, bh=H*0.10, top=H*0.12;
    for(let r=0;r<4;r++) for(let c=0;c<cols;c++){
      if((r*cols+c)%7===3) continue;
      x.fillStyle=ROW[r]; x.globalAlpha=.92;
      rr(x, W*0.06+c*(bw+6), top+r*(bh+5), bw, bh, 4); x.fill();
    }
    x.globalAlpha=1;
    x.strokeStyle='rgba(255,95,168,.8)'; x.lineWidth=2; x.setLineDash([7,7]);
    x.beginPath(); x.moveTo(W*0.42,H*0.78); x.lineTo(W*0.62,H*0.30); x.stroke(); x.setLineDash([]);
    x.fillStyle='#fff'; x.beginPath(); x.arc(W*0.62,H*0.30,H*0.03,0,TAU); x.fill();
    const g=x.createLinearGradient(W*0.35,0,W*0.62,0); g.addColorStop(0,'#ff5fa8'); g.addColorStop(1,'#c084fc');
    x.fillStyle=g; rr(x,W*0.35,H*0.80,W*0.27,H*0.05,8); x.fill();
  }
  else if(id==='flappy'){
    const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#ffb3d9'); g.addColorStop(.7,'#ff8ac4'); g.addColorStop(1,'#c084fc');
    x.fillStyle=g; x.fillRect(0,0,W,H);
    x.fillStyle='rgba(255,224,138,.95)'; x.beginPath(); x.arc(W*0.85,H*0.16,H*0.09,0,TAU); x.fill();
    x.fillStyle='rgba(255,255,255,.35)';
    [[W*0.18,H*0.25],[W*0.45,H*0.14],[W*0.70,H*0.42]].forEach(([cx,cy])=>{
      x.beginPath(); x.arc(cx,cy,H*0.05,0,TAU); x.arc(cx+H*0.05,cy+H*0.015,H*0.04,0,TAU); x.arc(cx-H*0.05,cy+H*0.02,H*0.035,0,TAU); x.fill(); });
    const pipe=(px,gy,alpha,w2)=>{ x.globalAlpha=alpha;
      const pg=x.createLinearGradient(px,0,px+w2,0); pg.addColorStop(0,'#5eead4'); pg.addColorStop(1,'#0d9488');
      x.fillStyle=pg;
      x.fillRect(px,0,w2,gy-H*0.05); x.fillRect(px,gy+H*0.05,w2,H);
      x.fillStyle='#0f766e'; rr(x,px-w2*0.12,gy-H*0.05,w2*1.24,H*0.06,4); x.fill();
      rr(x,px-w2*0.12,gy+H*0.02,w2*1.24,H*0.06,4); x.fill(); x.globalAlpha=1; };
    pipe(W*0.30, H*0.38, .55, W*0.055);
    pipe(W*0.64, H*0.55, 1, W*0.08);
    const bx=W*0.30, by=H*0.55;
    x.fillStyle='#fb7185'; x.beginPath(); x.arc(bx,by,H*0.055,0,TAU); x.fill();
    x.fillStyle='#fda4af'; x.beginPath(); x.ellipse(bx-H*0.02,by+H*0.015,H*0.035,H*0.022,-0.4,0,TAU); x.fill();
    x.fillStyle='#fff'; x.beginPath(); x.arc(bx+H*0.025,by-H*0.02,H*0.018,0,TAU); x.fill();
    x.fillStyle='#111'; x.beginPath(); x.arc(bx+H*0.03,by-H*0.02,H*0.009,0,TAU); x.fill();
    x.fillStyle='#ffffff'; x.beginPath(); x.moveTo(bx+H*0.05,by); x.lineTo(bx+H*0.085,by+H*0.012); x.lineTo(bx+H*0.05,by+H*0.024); x.fill();
  }
  else if(id==='tetris'){
    bg(x,W,H,'#170b26','#2a1140');
    x.strokeStyle='rgba(255,255,255,.05)';
    for(let i=1;i<10;i++){ x.beginPath(); x.moveTo(W*0.06+i*W*0.09,0); x.lineTo(W*0.06+i*W*0.09,H); x.stroke(); }
    const S=W*0.09, ox=W*0.06, oy=H-S, C={I:'#ff5fa8',T:'#c084fc',O:'#ffd166',L:'#5eead4',J:'#8ec5ff'};
    const blk=(c,r,col)=>{ x.fillStyle=col; rr(x,ox+c*S+2,oy-r*S-2+S,S-4,S-4,4); x.fill();
      x.fillStyle='rgba(255,255,255,.25)'; x.fillRect(ox+c*S+4,oy-r*S-2+S+2,S-8,3); };
    [[[0,0,C.I],[1,0,C.O],[2,0,C.T]],[[0,1,C.L],[1,1,C.L],[2,1,C.J],[3,1,C.J]],
     [[0,2,C.I],[1,2,C.T],[2,2,C.O],[3,2,C.J],[4,2,C.L]],[[0,3,C.T],[1,3,C.I],[3,3,C.O],[4,3,C.I]]]
      .flat().forEach(([c,r,col])=>blk(c,r,col));
    // floating T above
    x.shadowColor='#ff5fa8'; x.shadowBlur=16;
    [[1,0,C.T],[0,1,C.T],[1,1,C.T],[2,1,C.T]].forEach(([c,r,col])=>{
      x.fillStyle=col; rr(x,W*0.42+c*S*0.8,H*0.20+r*S*0.8,S*0.8-4,S*0.8-4,4); x.fill(); });
    x.shadowBlur=0;
  }
  x.restore();
}

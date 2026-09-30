export const TAU = Math.PI*2;
export const rand = (a,b)=> a + Math.random()*(b-a);
export const pick = a => a[(Math.random()*a.length)|0];
export const clamp = (v,a,b)=> Math.max(a, Math.min(b, v));
export function rr(ctx,x,y,w,h,r){
  const rad = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rad,y);
  ctx.arcTo(x+w,y,x+w,y+h,rad);
  ctx.arcTo(x+w,y+h,x,y+h,rad);
  ctx.arcTo(x,y+h,x,y,rad);
  ctx.arcTo(x,y,x+w,y,rad);
  ctx.closePath();
}

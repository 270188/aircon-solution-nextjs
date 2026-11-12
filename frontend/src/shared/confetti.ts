import { prefersReducedMotion } from './motion';

/** Lluvia de confeti en los colores de la marca (sin librerías). */
export function launchConfetti(origin: HTMLElement): void {
  if (prefersReducedMotion()) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1400' });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const r = origin.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 3;
  const colors = ['#5ec6ff', '#1e88e5', '#f5821f', '#ffb057', '#25d366', '#ffffff'];
  const pieces = Array.from({ length: 160 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 9 + 4;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      w: Math.random() * 8 + 4,
      h: Math.random() * 5 + 3,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      color: colors[(Math.random() * colors.length) | 0],
    };
  });

  const start = performance.now();
  const tick = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of pieces) {
      p.vy += 0.28;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - elapsed / 3200);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (elapsed < 3200) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, inject, viewChild } from '@angular/core';

import { prefersReducedMotion } from '../shared/motion';

interface Particle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  hue: number;
}

/**
 * Partículas de "aire frío" que fluyen por la portada y se apartan del cursor.
 * Se pausa cuando no está visible para no gastar batería.
 */
@Component({
  selector: 'app-airflow-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #c aria-hidden="true"></canvas>`,
  styles: `:host { position: absolute; inset: 0; pointer-events: none; } canvas { width: 100%; height: 100%; }`,
})
export class AirflowCanvasComponent implements OnInit {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('c');
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (prefersReducedMotion()) return;
    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let running = false;
    let t = 0;
    const mouse = { x: -9999, y: -9999 };
    const dpr = Math.min(devicePixelRatio || 1, 2);

    const spawn = (anywhere: boolean): Particle => ({
      x: anywhere ? Math.random() * w : -10,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vx: Math.random() * 0.6 + 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.5 + 0.2,
      hue: Math.random() < 0.8 ? 200 : 28,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(140, (w * h) / 9000));
      particles = Array.from({ length: count }, () => spawn(true));
    };

    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        // corriente ondulada tipo flujo de aire
        p.vy += Math.sin(p.x * 0.006 + t * 3) * 0.006;
        p.vy *= 0.98;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 16000) {
          const f = (16000 - d2) / 16000;
          p.x += (dx / Math.sqrt(d2 + 1)) * f * 3;
          p.y += (dy / Math.sqrt(d2 + 1)) * f * 3;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > w + 10 || p.y < -10 || p.y > h + 10) Object.assign(p, spawn(false));

        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 95%, 75%, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        // estela
        ctx.strokeStyle = `hsla(${p.hue}, 95%, 75%, ${p.a * 0.25})`;
        ctx.lineWidth = p.r;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 14, p.y - p.vy * 14);
        ctx.stroke();
      }
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(draw);
      }
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));

    resize();
    visibility.observe(canvas);
    addEventListener('resize', resize);
    addEventListener('pointermove', onMove, { passive: true });

    this.destroyRef.onDestroy(() => {
      stop();
      visibility.disconnect();
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onMove);
    });
  }
}

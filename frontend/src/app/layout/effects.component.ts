import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';

import { whatsappLink } from '../core/site.data';
import { IconComponent } from '../shared/icon.component';
import { hasFinePointer, prefersReducedMotion } from '../shared/motion';

/**
 * Efectos globales: barra de progreso de lectura, luz que sigue al cursor,
 * botón de WhatsApp con ondas y botón "volver arriba" con anillo de progreso.
 */
@Component({
  selector: 'app-effects',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="progress" [style.transform]="'scaleX(' + progress() + ')'" aria-hidden="true"></div>
    <div #glow class="glow" aria-hidden="true"></div>

    <a class="wa" [href]="wa" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
      <span class="pulse"></span><span class="pulse two"></span>
      <app-icon name="whatsapp" [size]="30" />
      <span class="tip">¿Hablamos? Respondemos al toque</span>
    </a>

    <button class="top" type="button" [class.show]="progress() > 0.08" (click)="toTop()" aria-label="Volver arriba">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="21" class="track" />
        <circle cx="24" cy="24" r="21" class="fill" [style.stroke-dashoffset]="132 - 132 * progress()" />
      </svg>
      <app-icon name="arrowUp" [size]="18" />
    </button>
  `,
  styles: `
    .progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 90; transform-origin: 0 50%;
      background: var(--grad-brand); box-shadow: 0 0 12px rgba(94,198,255,.7); }
    .glow { position: fixed; top: 0; left: 0; width: 420px; height: 420px; margin: -210px 0 0 -210px; border-radius: 50%;
      pointer-events: none; z-index: 1; opacity: 0; transition: opacity .4s;
      background: radial-gradient(circle, rgba(94,198,255,.10), transparent 65%); mix-blend-mode: screen; }
    .glow.on { opacity: 1; }
    .wa { position: fixed; right: 20px; bottom: 22px; z-index: 85; width: 60px; height: 60px; border-radius: 50%;
      background: #25d366; color: #fff; display: grid; place-items: center; box-shadow: 0 14px 30px -8px rgba(37,211,102,.7);
      transition: transform .35s var(--ease-spring); animation: fadeUp .8s 1.5s both; }
    .wa:hover { transform: scale(1.1) rotate(-8deg); }
    .pulse { position: absolute; inset: 0; border-radius: 50%; background: #25d366; z-index: -1; animation: pulseRing 2.2s ease-out infinite; }
    .pulse.two { animation-delay: 1.1s; }
    .tip { position: absolute; right: 74px; white-space: nowrap; background: var(--bg-elevated); color: var(--text);
      padding: 8px 14px; border-radius: 12px; font-size: .85rem; font-weight: 600; box-shadow: var(--shadow-md);
      opacity: 0; transform: translateX(10px); transition: all .3s var(--ease-out); pointer-events: none; }
    .wa:hover .tip { opacity: 1; transform: none; }
    .top { position: fixed; right: 26px; bottom: 96px; z-index: 85; width: 48px; height: 48px; border-radius: 50%;
      display: grid; place-items: center; background: var(--bg-elevated); color: var(--text); box-shadow: var(--shadow-md);
      opacity: 0; transform: translateY(20px) scale(.8); pointer-events: none; transition: all .45s var(--ease-spring); }
    .top.show { opacity: 1; transform: none; pointer-events: auto; }
    .top:hover { color: var(--blue-500); }
    .top svg { position: absolute; inset: 0; transform: rotate(-90deg); fill: none; stroke-width: 3; }
    .track { stroke: var(--border); }
    .fill { stroke: var(--blue-500); stroke-dasharray: 132; stroke-linecap: round; }
    @media (max-width: 560px) { .tip { display: none; } }
  `,
})
export class EffectsComponent implements OnInit {
  protected readonly wa = whatsappLink();
  protected readonly progress = signal(0);
  private readonly glow = viewChild.required<ElementRef<HTMLElement>>('glow');
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        this.progress.set(max > 0 ? Math.min(scrollY / max, 1) : 0);
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let onMove: ((e: PointerEvent) => void) | null = null;
    if (hasFinePointer() && !prefersReducedMotion()) {
      const glow = this.glow().nativeElement;
      onMove = (e: PointerEvent) => {
        glow.classList.add('on');
        glow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      };
      addEventListener('pointermove', onMove, { passive: true });
    }

    this.destroyRef.onDestroy(() => {
      removeEventListener('scroll', onScroll);
      if (onMove) removeEventListener('pointermove', onMove);
    });
  }

  protected toTop(): void {
    scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
}

import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';

import { testimonials } from '../core/site.data';
import { IconComponent } from '../shared/icon.component';
import { prefersReducedMotion } from '../shared/motion';
import { RevealDirective } from '../shared/reveal.directive';

/** Carrusel de testimonios con avance automático, barra de progreso y gesto de deslizar. */
@Component({
  selector: 'app-testimonials',
  imports: [IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section testi" id="testimonios" aria-labelledby="testi-title"
      (mouseenter)="paused.set(true)" (mouseleave)="paused.set(false)" (focusin)="paused.set(true)" (focusout)="paused.set(false)">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow" appReveal="blur">Testimonios</span>
          <h2 class="section-title" id="testi-title" appReveal="up">Lo que dicen <span class="text-gradient">nuestros clientes</span></h2>
        </div>

        <div class="stage" appReveal="zoom" (touchstart)="tx = $event.touches[0].clientX"
          (touchend)="swipe($event.changedTouches[0].clientX - tx)" aria-roledescription="carrusel">
          <span class="quote" aria-hidden="true">“</span>
          @for (t of items; track t.name; let i = $index) {
            <figure class="slide" [class.active]="i === index()" [attr.aria-hidden]="i !== index()"
              aria-roledescription="testimonio" [attr.aria-label]="(i + 1) + ' de ' + items.length">
              <div class="stars" [attr.aria-label]="t.rating + ' de 5 estrellas'">
                @for (s of [1, 2, 3, 4, 5]; track s) {
                  <span [style.--s]="s"><app-icon name="star" [size]="20" /></span>
                }
              </div>
              <blockquote>{{ t.text }}</blockquote>
              <figcaption>
                <img [src]="t.img" [alt]="t.name" width="56" height="56" loading="lazy" />
                <div><strong>{{ t.name }}</strong><span>{{ t.role }}</span></div>
              </figcaption>
            </figure>
          }
        </div>

        <div class="controls">
          <button type="button" class="arrow" (click)="go(-1)" aria-label="Testimonio anterior"><app-icon name="arrowLeft" [size]="20" /></button>
          <div class="dots">
            @for (t of items; track t.name; let i = $index) {
              <button type="button" [class.active]="i === index()" (click)="select(i)" [attr.aria-label]="'Ver testimonio ' + (i + 1)">
                @if (i === index()) { <span class="bar" [class.paused]="paused()"></span> }
              </button>
            }
          </div>
          <button type="button" class="arrow" (click)="go(1)" aria-label="Testimonio siguiente"><app-icon name="arrowRight" [size]="20" /></button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .testi { background: radial-gradient(circle at 20% 10%, rgba(30,136,229,.10), transparent 40%), var(--bg-soft); }
    .stage { position: relative; max-width: 820px; margin: 0 auto; min-height: 340px; display: grid; }
    .quote { position: absolute; top: -50px; left: 50%; transform: translateX(-50%); font-family: Georgia, serif; font-size: 10rem; line-height: 1;
      background: var(--grad-brand); -webkit-background-clip: text; background-clip: text; color: transparent; opacity: .35; }
    .slide { grid-area: 1 / 1; text-align: center; padding: 50px 20px 0; opacity: 0; transform: translateY(30px) scale(.97);
      transition: opacity .7s var(--ease-out), transform .7s var(--ease-out); pointer-events: none; }
    .slide.active { opacity: 1; transform: none; pointer-events: auto; }
    .stars { display: flex; justify-content: center; gap: 4px; color: #fbbf24; margin-bottom: 20px; }
    .stars span { display: inline-flex; transform: scale(0); }
    .stars ::ng-deep svg { fill: currentColor; }
    .active .stars span { animation: starPop .5s var(--ease-spring) forwards; animation-delay: calc(.2s + var(--s) * .08s); }
    @keyframes starPop { to { transform: none; } }
    blockquote { font-family: var(--font-display); font-size: clamp(1.15rem, 2.4vw, 1.55rem); font-weight: 600; line-height: 1.5; margin-bottom: 30px; }
    figcaption { display: inline-flex; gap: 14px; align-items: center; text-align: left; }
    figcaption img { border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 3px var(--bg), 0 0 0 5px var(--blue-500); }
    figcaption strong { display: block; } figcaption span { color: var(--text-muted); font-size: .9rem; }
    .controls { display: flex; justify-content: center; align-items: center; gap: 22px; margin-top: 30px; }
    .arrow { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; border: 1.5px solid var(--border);
      background: var(--bg-elevated); transition: all .3s var(--ease-spring); }
    .arrow:hover { background: var(--blue-500); color: #fff; border-color: transparent; transform: scale(1.08); }
    .dots { display: flex; gap: 8px; }
    .dots button { width: 10px; height: 10px; border-radius: 10px; background: var(--border); position: relative; overflow: hidden;
      transition: width .5s var(--ease-out); }
    .dots button.active { width: 44px; }
    .bar { position: absolute; inset: 0; background: var(--grad-ice); transform-origin: left; animation: fill 6s linear forwards; }
    .bar.paused { animation-play-state: paused; }
    @keyframes fill { from { transform: scaleX(0); } }
  `,
})
export class TestimonialsComponent implements OnInit {
  protected readonly items = testimonials;
  protected readonly index = signal(0);
  protected readonly paused = signal(false);
  protected tx = 0;
  private readonly destroyRef = inject(DestroyRef);
  private elapsed = 0;

  ngOnInit(): void {
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => {
      if (this.paused() || document.hidden) return;
      this.elapsed += 100;
      if (this.elapsed >= 6000) this.go(1);
    }, 100);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected go(delta: number): void {
    this.select((this.index() + delta + this.items.length) % this.items.length);
  }

  protected select(i: number): void {
    this.elapsed = 0;
    this.index.set(i);
  }

  protected swipe(dx: number): void {
    if (Math.abs(dx) > 50) this.go(dx < 0 ? 1 : -1);
  }
}

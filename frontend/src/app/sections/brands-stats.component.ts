import { ChangeDetectionStrategy, Component } from '@angular/core';

import { brands, stats } from '../core/site.data';
import { CountUpDirective } from '../shared/count-up.directive';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-brands-stats',
  imports: [CountUpDirective, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="brands" aria-label="Marcas con las que trabajamos">
      <p class="title" appReveal="blur">Trabajamos con todas las marcas</p>
      <div class="marquee">
        <div class="track">
          @for (round of [0, 1]; track round) {
            @for (b of brands; track b.name) {
              <div class="brand" [attr.aria-hidden]="round === 1">
                @if (b.src) {
                  <img [src]="b.src" [alt]="b.name" loading="lazy" height="34" />
                } @else {
                  <span>{{ b.name }}</span>
                }
              </div>
            }
          }
        </div>
      </div>
    </section>

    <section class="stats" aria-label="AIRCONSOLUTION SERVICES SAC en números">
      <div class="container grid">
        @for (s of stats; track s.label; let i = $index) {
          <div class="stat" appReveal="flip" [revealDelay]="i * 110">
            <strong><span [appCountUp]="s.value"></span><em>{{ s.suffix }}</em></strong>
            <span>{{ s.label }}</span>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .brands { background: var(--bg-soft); padding: 44px 0 40px; overflow: hidden; }
    .title { text-align: center; font-family: var(--font-display); font-weight: 700; letter-spacing: .16em; text-transform: uppercase;
      font-size: .82rem; color: var(--text-muted); margin-bottom: 26px; }
    .marquee { mask-image: linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent); }
    .track { display: flex; width: max-content; animation: marquee 32s linear infinite; }
    .marquee:hover .track { animation-play-state: paused; }
    .brand { flex-shrink: 0; padding: 0 44px; height: 44px; display: grid; place-items: center; filter: grayscale(1); opacity: .55;
      transition: filter .4s, opacity .4s, transform .4s var(--ease-spring); }
    .brand:hover { filter: none; opacity: 1; transform: scale(1.12); }
    .brand img { height: 30px; width: auto; max-width: none; min-width: 90px; object-fit: contain; }
    .brand span { font-family: var(--font-display); font-weight: 800; font-size: 1.5rem; letter-spacing: .02em; color: var(--text); }
    :host-context([data-theme='dark']) .brand img { filter: invert(1) brightness(1.6); }
    @keyframes marquee { to { transform: translateX(-50%); } }

    .stats { padding: 0; margin-top: -1px; background: linear-gradient(180deg, var(--bg-soft) 50%, var(--bg) 50%); }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1px; border-radius: var(--radius-lg); overflow: hidden;
      background: rgba(255,255,255,.08); box-shadow: var(--shadow-lg); }
    @media (min-width: 860px) { .grid { grid-template-columns: repeat(4, 1fr); } }
    .stat { background: linear-gradient(150deg, #0d1b2e, #14263d); color: #fff; padding: 34px 20px; text-align: center; position: relative; overflow: hidden; }
    .stat::before { content: ''; position: absolute; inset: auto -40% -60% -40%; height: 120%; background: radial-gradient(circle, rgba(94,198,255,.22), transparent 60%);
      transition: transform .8s var(--ease-out); transform: translateY(30%); }
    .stat:hover::before { transform: none; }
    strong { display: block; font-family: var(--font-display); font-size: clamp(2.2rem, 4vw, 3rem); line-height: 1; margin-bottom: 8px; position: relative; }
    em { font-style: normal; color: var(--orange-500); }
    .stat > span { color: #b7c3d1; font-size: .92rem; position: relative; }
  `,
})
export class BrandsStatsComponent {
  protected readonly brands = brands;
  protected readonly stats = stats;
}

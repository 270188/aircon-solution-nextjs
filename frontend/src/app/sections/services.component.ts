import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { services } from '../core/site.data';
import { UiService } from '../core/ui.service';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { TiltDirective } from '../shared/tilt.directive';

@Component({
  selector: 'app-services',
  imports: [IconComponent, RevealDirective, TiltDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" id="servicios" aria-labelledby="services-title">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow" appReveal="blur">Nuestros servicios</span>
          <h2 class="section-title" id="services-title" appReveal="up" [revealDelay]="80">
            Todo lo que tu equipo <span class="text-gradient">necesita</span>
          </h2>
          <p appReveal="up" [revealDelay]="160">Desde la instalación hasta el mantenimiento y la reparación, con un mismo equipo técnico de confianza.</p>
        </div>

        <div class="grid">
          @for (s of services; track s.id; let i = $index) {
            <article class="svc" appTilt [tiltMax]="7" appReveal="up" [revealDelay]="(i % 3) * 120">
              <div class="media">
                <picture>
                  <source [srcset]="s.image + '.webp'" type="image/webp" />
                  <img [src]="s.image + '.jpg'" [alt]="s.title" loading="lazy" width="600" height="400" />
                </picture>
                <span class="num">0{{ i + 1 }}</span>
              </div>
              <div class="body">
                <span class="ic"><app-icon [name]="s.icon" [size]="26" /></span>
                <h3>{{ s.title }}</h3>
                <p>{{ s.description }}</p>
                <ul>
                  @for (f of s.features; track f) {
                    <li><app-icon name="check" [size]="16" [stroke]="2.6" /> {{ f }}</li>
                  }
                </ul>
                <button type="button" class="link" (click)="ui.bookService(s.id)">
                  Reservar este servicio <app-icon name="arrowRight" [size]="18" />
                </button>
              </div>
              <span class="spot" aria-hidden="true"></span>
            </article>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .grid { display: grid; gap: 28px; grid-template-columns: 1fr; }
    @media (min-width: 720px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1080px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    .svc { position: relative; border-radius: var(--radius-lg); background: var(--bg-elevated); border: 1px solid var(--border);
      box-shadow: var(--shadow-md); overflow: hidden; display: flex; flex-direction: column; isolation: isolate; }
    .svc:hover { box-shadow: var(--shadow-lg); }
    .spot { position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0; transition: opacity .4s;
      background: radial-gradient(500px circle at var(--mx, 50%) var(--my, 50%), rgba(94,198,255,.16), transparent 45%); }
    .svc:hover .spot { opacity: 1; }
    .media { position: relative; aspect-ratio: 3 / 2; overflow: hidden; }
    .media img { width: 100%; height: 100%; object-fit: cover; transition: transform 1.2s var(--ease-out), filter .6s; }
    .svc:hover .media img { transform: scale(1.1); }
    .media::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(5,13,26,.55), transparent 55%); }
    .num { position: absolute; top: 14px; right: 18px; z-index: 1; font-family: var(--font-display); font-weight: 800; font-size: 2.6rem;
      color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,.75); line-height: 1; }
    .body { padding: 0 26px 26px; display: flex; flex-direction: column; flex: 1; transform: translateZ(30px); }
    .ic { width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center; color: #fff; background: var(--grad-ice);
      margin-top: -29px; position: relative; z-index: 2; box-shadow: 0 12px 26px -10px rgba(30,136,229,.8);
      transition: transform .6s var(--ease-spring), background .4s; }
    .svc:hover .ic { transform: rotate(-12deg) scale(1.08); background: var(--grad-fire); }
    h3 { font-size: 1.25rem; margin: 18px 0 10px; }
    p { color: var(--text-muted); font-size: .96rem; }
    ul { display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0 20px; }
    li { display: inline-flex; align-items: center; gap: 6px; font-size: .8rem; font-weight: 600; padding: 6px 10px; border-radius: 999px;
      background: var(--bg-soft); color: var(--text); }
    li app-icon { color: var(--blue-500); }
    .link { margin-top: auto; align-self: flex-start; display: inline-flex; gap: 8px; align-items: center; font-weight: 700; color: var(--blue-500); }
    .link app-icon { transition: transform .35s var(--ease-spring); }
    .link:hover app-icon { transform: translateX(6px); }
  `,
})
export class ServicesComponent {
  protected readonly ui = inject(UiService);
  protected readonly services = services;
}

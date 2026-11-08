import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { checklist } from '../core/site.data';
import { UiService } from '../core/ui.service';
import { IconComponent } from '../shared/icon.component';
import { ParallaxDirective } from '../shared/parallax.directive';
import { RevealDirective } from '../shared/reveal.directive';
import { RippleDirective } from '../shared/ripple.directive';

@Component({
  selector: 'app-about',
  imports: [IconComponent, ParallaxDirective, RevealDirective, RippleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" id="nosotros" aria-labelledby="about-title">
      <div class="container grid">
        <div class="visual">
          <div class="frame main" appReveal="mask">
            <picture>
              <source srcset="images/trabajos/tecnico-york.webp" type="image/webp" />
              <img src="images/trabajos/tecnico-york.jpg" alt="Técnico de AIRCONSOLUTION SERVICES SAC trabajando en un equipo York" loading="lazy" />
            </picture>
          </div>
          <div class="frame small" [appParallax]="0.12">
            <picture>
              <source srcset="images/trabajos/cortina-aire.webp" type="image/webp" />
              <img src="images/trabajos/cortina-aire.jpg" alt="Mantenimiento de cortina de aire" loading="lazy" />
            </picture>
          </div>
          <div class="badge" appReveal="zoom" [revealDelay]="400">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <defs><path id="circ" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" /></defs>
              <text><textPath href="#circ">CALIDAD · GARANTÍA · CONFIANZA · </textPath></text>
            </svg>
            <app-icon name="snow" [size]="34" />
          </div>
        </div>

        <div class="text">
          <span class="eyebrow" appReveal="blur">Quiénes somos</span>
          <h2 class="section-title" id="about-title" appReveal="up">
            Tu equipo técnico de <span class="text-gradient">confianza</span> en Lima
          </h2>
          <p appReveal="up" [revealDelay]="80">
            En <strong>AIRCONSOLUTION SERVICES SAC</strong> somos especialistas en climatización y electricidad. Atendemos hogares,
            oficinas, restaurantes, locales comerciales e industrias con la misma dedicación: trabajo limpio,
            puntual y bien hecho.
          </p>
          <p appReveal="up" [revealDelay]="140">
            Cada servicio lo realiza personal capacitado y uniformado, con herramientas profesionales y
            repuestos originales. Te explicamos qué tiene tu equipo antes de tocar nada.
          </p>
          <ul class="checks">
            @for (c of checklist; track c; let i = $index) {
              <li appReveal="left" [revealDelay]="200 + i * 90">
                <span class="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg></span>
                {{ c }}
              </li>
            }
          </ul>
          <button type="button" class="btn btn-primary" appRipple (click)="ui.scrollTo('reservar')" appReveal="up" [revealDelay]="560">
            Agenda una visita <app-icon name="arrowRight" [size]="18" />
          </button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .grid { display: grid; gap: 64px; align-items: center; }
    @media (min-width: 980px) { .grid { grid-template-columns: 1fr 1fr; gap: 80px; } }
    .visual { position: relative; padding: 0 0 60px 0; max-width: 560px; }
    .frame { border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-lg); }
    .frame img { width: 100%; height: 100%; object-fit: cover; }
    .main { aspect-ratio: 4 / 4.4; width: 82%; }
    .small { position: absolute; right: 0; bottom: 0; width: 46%; aspect-ratio: 1; border: 6px solid var(--bg); }
    .badge { position: absolute; top: 24px; right: 4%; width: 120px; height: 120px; border-radius: 50%; display: grid; place-items: center;
      background: var(--grad-fire); color: #fff; box-shadow: 0 20px 40px -14px rgba(245,130,31,.7); }
    .badge svg { position: absolute; inset: 0; animation: spin 16s linear infinite; }
    .badge text { fill: #fff; font-size: 11px; font-weight: 700; letter-spacing: 2.6px; font-family: var(--font-display); }
    .text p { color: var(--text-muted); margin-bottom: 14px; font-size: 1.05rem; }
    .text strong { color: var(--text); }
    .checks { display: grid; gap: 14px; margin: 26px 0 34px; }
    .checks li { display: flex; align-items: center; gap: 14px; font-weight: 600; }
    .tick { width: 30px; height: 30px; border-radius: 50%; background: rgba(30,136,229,.12); display: grid; place-items: center; flex-shrink: 0; }
    .tick svg { width: 16px; fill: none; stroke: var(--blue-500); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round;
      stroke-dasharray: 24; stroke-dashoffset: 24; transition: stroke-dashoffset .8s .4s var(--ease-out); }
    .checks li.is-visible .tick svg { stroke-dashoffset: 0; }
  `,
})
export class AboutComponent {
  protected readonly ui = inject(UiService);
  protected readonly checklist = checklist;
}

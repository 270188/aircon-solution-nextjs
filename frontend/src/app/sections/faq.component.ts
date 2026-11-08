import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { faqs, whatsappLink } from '../core/site.data';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-faq',
  imports: [IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section faq" aria-labelledby="faq-title">
      <div class="container grid">
        <div class="intro">
          <span class="eyebrow" appReveal="blur">Preguntas frecuentes</span>
          <h2 class="section-title" id="faq-title" appReveal="up">¿Tienes <span class="text-gradient">dudas?</span></h2>
          <p appReveal="up" [revealDelay]="80">Estas son las consultas más comunes. Si no encuentras la tuya, escríbenos y te respondemos al momento.</p>
          <a class="btn btn-whatsapp" [href]="wa" target="_blank" rel="noopener" appReveal="up" [revealDelay]="160">
            <app-icon name="whatsapp" [size]="20" /> Hacer una pregunta
          </a>
        </div>
        <div class="list">
          @for (f of faqs; track f.q; let i = $index) {
            <div class="item" [class.open]="open() === i" appReveal="up" [revealDelay]="i * 70">
              <h3>
                <button type="button" [id]="'faq-q' + i" [attr.aria-expanded]="open() === i" [attr.aria-controls]="'faq-a' + i"
                  (click)="open.set(open() === i ? -1 : i)">
                  <span>{{ f.q }}</span>
                  <span class="plus" aria-hidden="true"></span>
                </button>
              </h3>
              <div class="answer" [id]="'faq-a' + i" role="region" [attr.aria-labelledby]="'faq-q' + i">
                <div><p>{{ f.a }}</p></div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .grid { display: grid; gap: 48px; }
    @media (min-width: 980px) { .grid { grid-template-columns: .8fr 1.2fr; gap: 72px; } .intro { position: sticky; top: 120px; align-self: start; } }
    .intro p { color: var(--text-muted); margin-bottom: 26px; font-size: 1.05rem; }
    .list { display: grid; gap: 14px; }
    .item { border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg-elevated); transition: box-shadow .4s, border-color .4s; }
    .item.open { box-shadow: var(--shadow-md); border-color: rgba(30,136,229,.45); }
    h3 { font-size: 1.02rem; font-weight: 600; }
    button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 22px; text-align: left; font-weight: 600; }
    .plus { position: relative; width: 30px; height: 30px; border-radius: 50%; background: var(--bg-soft); flex-shrink: 0; transition: transform .5s var(--ease-spring), background .3s; }
    .plus::before, .plus::after { content: ''; position: absolute; left: 50%; top: 50%; width: 12px; height: 2px; margin: -1px 0 0 -6px; border-radius: 2px;
      background: currentColor; transition: transform .4s var(--ease-out); }
    .plus::after { transform: rotate(90deg); }
    .open .plus { transform: rotate(180deg); background: var(--grad-ice); color: #fff; }
    .open .plus::after { transform: rotate(0); }
    /* altura animada con grid-template-rows */
    .answer { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .5s var(--ease-out); }
    .answer > div { overflow: hidden; }
    .open .answer { grid-template-rows: 1fr; }
    p { padding: 0 22px 22px; color: var(--text-muted); opacity: 0; transform: translateY(-8px); transition: opacity .4s .1s, transform .4s .1s var(--ease-out); }
    .open p { opacity: 1; transform: none; }
  `,
})
export class FaqComponent {
  protected readonly faqs = faqs;
  protected readonly open = signal(0);
  protected readonly wa = whatsappLink('Hola AIRCONSOLUTION SERVICES SAC, tengo una consulta:');
}

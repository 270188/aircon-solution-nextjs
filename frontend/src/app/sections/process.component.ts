import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';

import { processSteps } from '../core/site.data';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';

/** Línea de tiempo cuyo trazo se "dibuja" mientras haces scroll. */
@Component({
  selector: 'app-process',
  imports: [IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section process" aria-labelledby="process-title">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow" appReveal="blur">Cómo trabajamos</span>
          <h2 class="section-title" id="process-title" appReveal="up">Simple, rápido y <span class="text-gradient">transparente</span></h2>
        </div>
        <div class="timeline" #line>
          <div class="rail" aria-hidden="true"><span [style.transform]="'scaleY(' + progress() + ')'"></span></div>
          @for (step of steps; track step.title; let i = $index) {
            <div class="step" [class.right]="i % 2 === 1" [class.lit]="progress() > (i + 0.3) / steps.length">
              <div class="node"><app-icon [name]="step.icon" [size]="24" /></div>
              <div class="card" [appReveal]="i % 2 === 1 ? 'left' : 'right'">
                <span class="n">Paso {{ i + 1 }}</span>
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .process { background: var(--bg-soft); overflow: hidden; }
    .timeline { position: relative; max-width: 960px; margin: 0 auto; display: grid; gap: 34px; }
    .rail { position: absolute; top: 0; bottom: 0; left: 31px; width: 3px; background: var(--border); border-radius: 3px; }
    .rail span { display: block; height: 100%; transform-origin: top; background: var(--grad-brand); border-radius: 3px;
      box-shadow: 0 0 14px rgba(94,198,255,.7); transition: transform .15s linear; }
    .step { position: relative; padding-left: 90px; }
    .node { position: absolute; left: 0; top: 10px; width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center;
      background: var(--bg-elevated); border: 3px solid var(--border); color: var(--text-muted); z-index: 1;
      transition: all .6s var(--ease-spring); }
    .lit .node { background: var(--grad-ice); border-color: transparent; color: #fff; transform: scale(1.1); box-shadow: 0 0 0 8px rgba(30,136,229,.15); }
    .card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 26px; box-shadow: var(--shadow-sm); }
    .n { font-size: .75rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--orange-500); }
    h3 { margin: 6px 0 8px; font-size: 1.25rem; }
    p { color: var(--text-muted); }
    @media (min-width: 860px) {
      .rail { left: 50%; margin-left: -1.5px; }
      .step { padding: 0; width: 50%; padding-right: 64px; }
      .step.right { margin-left: 50%; padding: 0 0 0 64px; }
      .node { left: auto; right: -32px; }
      .step.right .node { right: auto; left: -32px; }
      .step:not(.right) .card { text-align: right; }
    }
  `,
})
export class ProcessComponent implements OnInit {
  protected readonly steps = processSteps;
  protected readonly progress = signal(0);
  private readonly line = viewChild.required<ElementRef<HTMLElement>>('line');
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = this.line().nativeElement.getBoundingClientRect();
        const p = (innerHeight * 0.6 - r.top) / r.height;
        this.progress.set(Math.max(0, Math.min(1, p)));
      });
    };
    addEventListener('scroll', update, { passive: true });
    update();
    this.destroyRef.onDestroy(() => removeEventListener('scroll', update));
  }
}

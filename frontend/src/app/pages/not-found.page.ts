import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../shared/icon.component';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="big" aria-hidden="true"><span>4</span><span class="flake"><app-icon name="snow" [size]="120" [stroke]="1.4" /></span><span>4</span></div>
      <h1>Esta página se congeló</h1>
      <p>No encontramos lo que buscabas. Volvamos a un lugar más cálido.</p>
      <a routerLink="/" class="btn btn-primary"><app-icon name="home" [size]="18" /> Ir al inicio</a>
    </div>
  `,
  styles: `
    .wrap { min-height: 90vh; display: grid; place-content: center; justify-items: center; text-align: center; gap: 14px; padding: 120px 20px 60px; }
    .big { display: flex; align-items: center; font-family: var(--font-display); font-weight: 800; font-size: clamp(6rem, 20vw, 11rem); line-height: 1;
      background: var(--grad-ice); -webkit-background-clip: text; background-clip: text; color: transparent; }
    .flake { color: var(--ice-400); animation: spin 8s linear infinite; display: inline-flex; margin: 0 6px; }
    p { color: var(--text-muted); margin-bottom: 10px; }
  `,
})
export class NotFoundPage {}

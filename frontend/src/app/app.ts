import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { EffectsComponent } from './layout/effects.component';
import { FooterComponent } from './layout/footer.component';
import { HeaderComponent } from './layout/header.component';
import { PreloaderComponent } from './layout/preloader.component';
import { ToastsComponent } from './layout/toasts.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, PreloaderComponent, EffectsComponent, ToastsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    <app-preloader />
    <app-header />
    <main id="contenido" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
    <app-effects />
    <app-toasts />
  `,
})
export class App {}

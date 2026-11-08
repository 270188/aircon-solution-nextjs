import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';

import { business, whatsappLink } from '../core/site.data';
import { UiService } from '../core/ui.service';
import { IconComponent } from '../shared/icon.component';
import { MagneticDirective } from '../shared/magnetic.directive';
import { prefersReducedMotion } from '../shared/motion';
import { ParallaxDirective } from '../shared/parallax.directive';
import { RippleDirective } from '../shared/ripple.directive';
import { AirflowCanvasComponent } from './airflow-canvas.component';

@Component({
  selector: 'app-hero',
  imports: [IconComponent, MagneticDirective, RippleDirective, ParallaxDirective, AirflowCanvasComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit {
  protected readonly ui = inject(UiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly business = business;
  protected readonly wa = whatsappLink('Hola AIRCONSOLUTION SERVICES SAC, necesito una cotización.');
  protected readonly words = ['Climatización', 'Mantenimiento', 'Electricidad', 'Reparaciones'];
  protected readonly typed = signal('');
  protected readonly titleWords = ['Soluciones', 'expertas', 'en'];

  ngOnInit(): void {
    if (prefersReducedMotion()) {
      this.typed.set(this.words[0]);
      return;
    }
    // Efecto máquina de escribir que rota entre palabras.
    let word = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = this.words[word];
      chars += deleting ? -1 : 1;
      this.typed.set(current.slice(0, chars));
      let delay = deleting ? 45 : 95;
      if (!deleting && chars === current.length) {
        deleting = true;
        delay = 2000;
      } else if (deleting && chars === 0) {
        deleting = false;
        word = (word + 1) % this.words.length;
        delay = 350;
      }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 1400);
    this.destroyRef.onDestroy(() => clearTimeout(timer));
  }
}

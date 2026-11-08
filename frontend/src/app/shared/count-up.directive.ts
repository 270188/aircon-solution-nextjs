import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

import { prefersReducedMotion } from './motion';

/** Cuenta desde 0 hasta el valor cuando el número aparece en pantalla. */
@Directive({ selector: '[appCountUp]' })
export class CountUpDirective implements OnInit, OnDestroy {
  readonly appCountUp = input.required<number>();
  readonly duration = input(2000);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private frame = 0;

  ngOnInit(): void {
    const node = this.el.nativeElement;
    const target = this.appCountUp();
    const format = (n: number) => Math.round(n).toLocaleString('es-PE');
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      node.textContent = format(target);
      return;
    }
    node.textContent = '0';
    this.observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      this.observer?.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / this.duration(), 1);
        const eased = 1 - Math.pow(1 - t, 4);
        node.textContent = format(target * eased);
        if (t < 1) this.frame = requestAnimationFrame(tick);
      };
      this.frame = requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
  }
}

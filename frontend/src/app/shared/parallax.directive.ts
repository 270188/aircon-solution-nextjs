import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

import { prefersReducedMotion } from './motion';

/** Desplaza el elemento más lento (o más rápido) que el scroll para dar profundidad. */
@Directive({ selector: '[appParallax]' })
export class ParallaxDirective implements OnInit, OnDestroy {
  readonly appParallax = input(0.2);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private frame = 0;
  private readonly onScroll = () => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const node = this.el.nativeElement;
      const r = node.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const offset = (r.top + r.height / 2 - innerHeight / 2) * this.appParallax();
      node.style.transform = `translate3d(0, ${-offset}px, 0)`;
    });
  };

  ngOnInit(): void {
    if (prefersReducedMotion()) return;
    addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  ngOnDestroy(): void {
    removeEventListener('scroll', this.onScroll);
    cancelAnimationFrame(this.frame);
  }
}

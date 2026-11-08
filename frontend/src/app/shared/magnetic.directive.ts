import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

import { hasFinePointer, prefersReducedMotion } from './motion';

/** El elemento se "atrae" suavemente hacia el cursor (botones principales). */
@Directive({ selector: '[appMagnetic]' })
export class MagneticDirective implements OnInit, OnDestroy {
  readonly strength = input(0.3);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly cleanups: (() => void)[] = [];

  ngOnInit(): void {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const node = this.el.nativeElement;
    const move = (e: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * this.strength();
      const y = (e.clientY - (r.top + r.height / 2)) * this.strength();
      node.style.transform = `translate(${x}px, ${y}px)`;
    };
    const leave = () => (node.style.transform = '');
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    this.cleanups.push(
      () => node.removeEventListener('pointermove', move),
      () => node.removeEventListener('pointerleave', leave),
    );
  }

  ngOnDestroy(): void {
    this.cleanups.forEach((fn) => fn());
  }
}

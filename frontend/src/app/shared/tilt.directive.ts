import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

import { hasFinePointer, prefersReducedMotion } from './motion';

/**
 * Inclinación 3D que sigue al mouse + un foco de luz (variables --mx / --my
 * que el CSS de la tarjeta usa para pintar el brillo).
 */
@Directive({ selector: '[appTilt]' })
export class TiltDirective implements OnInit, OnDestroy {
  readonly tiltMax = input(10);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private frame = 0;
  private readonly cleanups: (() => void)[] = [];

  ngOnInit(): void {
    if (!hasFinePointer() || prefersReducedMotion()) return;
    const node = this.el.nativeElement;
    node.style.transformStyle = 'preserve-3d';
    node.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';

    const move = (e: PointerEvent) => {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => {
        const r = node.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const max = this.tiltMax();
        node.style.transition = 'transform .12s linear';
        node.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
        node.style.setProperty('--mx', `${px * 100}%`);
        node.style.setProperty('--my', `${py * 100}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(this.frame);
      node.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
      node.style.transform = '';
    };
    node.addEventListener('pointermove', move);
    node.addEventListener('pointerleave', leave);
    this.cleanups.push(
      () => node.removeEventListener('pointermove', move),
      () => node.removeEventListener('pointerleave', leave),
    );
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.cleanups.forEach((fn) => fn());
  }
}

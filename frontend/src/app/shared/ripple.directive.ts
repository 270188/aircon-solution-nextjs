import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/** Onda expansiva tipo Material en el punto exacto del clic. */
@Directive({ selector: '[appRipple]' })
export class RippleDirective {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('pointerdown', ['$event'])
  onDown(e: PointerEvent): void {
    const node = this.el.nativeElement;
    const r = node.getBoundingClientRect();
    const size = Math.max(r.width, r.height);
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.width = wave.style.height = `${size}px`;
    wave.style.left = `${e.clientX - r.left - size / 2}px`;
    wave.style.top = `${e.clientY - r.top - size / 2}px`;
    node.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove());
  }
}

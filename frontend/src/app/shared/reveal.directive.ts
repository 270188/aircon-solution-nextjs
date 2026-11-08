import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

export type RevealVariant = 'up' | 'down' | 'left' | 'right' | 'zoom' | 'blur' | 'flip' | 'mask';

/**
 * Anima un elemento cuando entra en pantalla.
 * Uso: <div appReveal="left" [revealDelay]="120"></div>
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  readonly appReveal = input<RevealVariant | ''>('up');
  readonly revealDelay = input(0);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.dataset['reveal'] = this.appReveal() || 'up';
    node.style.setProperty('--reveal-delay', `${this.revealDelay()}ms`);
    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('is-visible');
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('is-visible');
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

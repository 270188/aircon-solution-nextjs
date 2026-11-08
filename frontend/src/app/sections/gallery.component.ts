import { ChangeDetectionStrategy, Component, HostListener, computed, signal } from '@angular/core';

import { GalleryCategory, galleryFilters, galleryItems } from '../core/site.data';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-gallery',
  imports: [IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent {
  protected readonly filters = galleryFilters;
  protected readonly filter = signal<GalleryCategory | 'todos'>('todos');
  protected readonly items = computed(() =>
    this.filter() === 'todos' ? galleryItems : galleryItems.filter((g) => g.category === this.filter()),
  );
  protected readonly openIndex = signal<number | null>(null);
  protected readonly current = computed(() => {
    const i = this.openIndex();
    return i === null ? null : this.items()[i];
  });
  protected readonly direction = signal<'next' | 'prev'>('next');

  private touchX = 0;
  private lastFocus: HTMLElement | null = null;

  protected setFilter(f: GalleryCategory | 'todos'): void {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    // Las tarjetas se reacomodan con animación si el navegador lo soporta.
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doc.startViewTransition(() => this.filter.set(f));
    } else {
      this.filter.set(f);
    }
  }

  protected open(i: number, e: Event): void {
    this.lastFocus = e.currentTarget as HTMLElement;
    this.openIndex.set(i);
    document.body.classList.add('no-scroll');
    setTimeout(() => (document.querySelector('.lightbox .close') as HTMLElement | null)?.focus(), 50);
  }

  protected close(): void {
    this.openIndex.set(null);
    document.body.classList.remove('no-scroll');
    this.lastFocus?.focus();
  }

  protected step(delta: number): void {
    const i = this.openIndex();
    if (i === null) return;
    const n = this.items().length;
    this.direction.set(delta > 0 ? 'next' : 'prev');
    this.openIndex.set((i + delta + n) % n);
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(e: KeyboardEvent): void {
    if (this.openIndex() === null) return;
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowRight') this.step(1);
    if (e.key === 'ArrowLeft') this.step(-1);
  }

  protected touchStart(e: TouchEvent): void {
    this.touchX = e.touches[0].clientX;
  }

  protected touchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.touchX;
    if (Math.abs(dx) > 50) this.step(dx < 0 ? 1 : -1);
  }
}

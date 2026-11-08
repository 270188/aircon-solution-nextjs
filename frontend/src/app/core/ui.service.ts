import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { ServiceId } from './site.data';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  text?: string;
}

/** Estado de interfaz compartido: avisos (toasts), tema y servicio preseleccionado para reservar. */
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly doc = inject(DOCUMENT);
  private nextId = 1;

  readonly toasts = signal<Toast[]>([]);
  readonly theme = signal<'light' | 'dark'>(
    (this.doc.documentElement.dataset['theme'] as 'light' | 'dark' | undefined) ?? 'light',
  );
  readonly preselectedService = signal<ServiceId | null>(null);

  toast(kind: Toast['kind'], title: string, text?: string): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, kind, title, text }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 7000 : 5000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  /** Cambia el tema con una revelación circular desde el punto del clic (View Transitions API). */
  toggleTheme(origin?: { x: number; y: number }): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    const apply = () => {
      this.doc.documentElement.dataset['theme'] = next;
      this.theme.set(next);
      try {
        localStorage.setItem('acs-theme', next);
      } catch {
        /* almacenamiento no disponible */
      }
    };
    const doc = this.doc as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce || !origin) {
      apply();
      return;
    }
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    doc.startViewTransition(apply).ready.then(() => {
      this.doc.documentElement.animate(
        { clipPath: [`circle(0 at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  }

  scrollTo(id: string): void {
    this.doc.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  bookService(id: ServiceId): void {
    this.preselectedService.set(id);
    this.scrollTo('reservar');
  }
}

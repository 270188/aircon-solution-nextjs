import { useSyncExternalStore } from 'react';

import type { ServiceId } from './site.data';

export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  title: string;
  text?: string;
}

interface UiState {
  toasts: Toast[];
  theme: 'light' | 'dark';
  preselectedService: ServiceId | null;
}

/** Estado de interfaz compartido: avisos (toasts), tema y servicio preseleccionado para reservar. */
let state: UiState = {
  toasts: [],
  theme: (document.documentElement.dataset['theme'] as 'light' | 'dark' | undefined) ?? 'light',
  preselectedService: null,
};
const listeners = new Set<() => void>();
let nextId = 1;

function set(patch: Partial<UiState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useUi<T>(select: (s: UiState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => select(state),
  );
}

export const ui = {
  toast(kind: Toast['kind'], title: string, text?: string): void {
    const id = nextId++;
    set({ toasts: [...state.toasts, { id, kind, title, text }] });
    setTimeout(() => ui.dismiss(id), kind === 'error' ? 7000 : 5000);
  },

  dismiss(id: number): void {
    set({ toasts: state.toasts.filter((t) => t.id !== id) });
  },

  /** Cambia el tema con una revelación circular desde el punto del clic (View Transitions API). */
  toggleTheme(origin?: { x: number; y: number }): void {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset['theme'] = next;
      set({ theme: next });
      try {
        localStorage.setItem('acs-theme', next);
      } catch {
        /* almacenamiento no disponible */
      }
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce || !origin) {
      apply();
      return;
    }
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    doc.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0 at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' },
      );
    });
  },

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  bookService(id: ServiceId): void {
    set({ preselectedService: id });
    ui.scrollTo('reservar');
  },

  setPreselectedService(id: ServiceId | null): void {
    set({ preselectedService: id });
  },
};

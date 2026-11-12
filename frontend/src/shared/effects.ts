import { useEffect } from 'react';

import { hasFinePointer, prefersReducedMotion } from './motion';

/**
 * Efectos declarativos mediante atributos, igual que las directivas del sitio anterior:
 *  - data-reveal="up|down|left|right|zoom|blur|flip|mask" + style --reveal-delay → animación al entrar en pantalla
 *  - data-tilt="10"   → inclinación 3D que sigue al mouse (y foco de luz con --mx/--my)
 *  - data-magnetic    → el botón se atrae hacia el cursor
 *  - data-ripple      → onda en el punto del clic
 *  - data-parallax="0.2" → desplazamiento con el scroll
 * Un solo observador cubre los elementos que aparecen al cambiar de página o al abrir paneles.
 */
export function useGlobalEffects(): void {
  useEffect(() => {
    const reduce = prefersReducedMotion();
    const fine = hasFinePointer();

    // ---- Revelado al hacer scroll ----
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                if (e.isIntersecting) {
                  e.target.classList.add('is-visible');
                  io?.unobserve(e.target);
                }
              }
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' },
          );
    const watch = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal-watched])').forEach((el) => {
        el.dataset['revealWatched'] = '';
        if (io) io.observe(el);
        else el.classList.add('is-visible');
      });
    };
    watch(document);
    const mo = new MutationObserver(() => watch(document));
    mo.observe(document.body, { childList: true, subtree: true });

    // ---- Parallax ----
    let frame = 0;
    const onScroll = () => {
      if (reduce) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > innerHeight + 200) return;
          const speed = Number(el.dataset['parallax']) || 0.2;
          const offset = (r.top + r.height / 2 - innerHeight / 2) * speed;
          el.style.transform = `translate3d(0, ${-offset}px, 0)`;
        });
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ---- Tilt y magnético (solo con mouse) ----
    let tiltFrame = 0;
    let activeTilt: HTMLElement | null = null;
    let activeMagnet: HTMLElement | null = null;
    const onMove = (e: PointerEvent) => {
      if (!fine || reduce) return;
      const target = e.target as HTMLElement | null;
      const tilt = target?.closest<HTMLElement>('[data-tilt]') ?? null;
      if (activeTilt && activeTilt !== tilt) resetTilt(activeTilt);
      activeTilt = tilt;
      if (tilt) {
        cancelAnimationFrame(tiltFrame);
        tiltFrame = requestAnimationFrame(() => {
          const r = tilt.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const max = Number(tilt.dataset['tilt']) || 10;
          tilt.style.transformStyle = 'preserve-3d';
          tilt.style.transition = 'transform .12s linear';
          tilt.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0)`;
          tilt.style.setProperty('--mx', `${px * 100}%`);
          tilt.style.setProperty('--my', `${py * 100}%`);
        });
      }
      const magnet = target?.closest<HTMLElement>('[data-magnetic]') ?? null;
      if (activeMagnet && activeMagnet !== magnet) activeMagnet.style.transform = '';
      activeMagnet = magnet;
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        magnet.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.3}px, ${(e.clientY - (r.top + r.height / 2)) * 0.3}px)`;
      }
    };
    const resetTilt = (el: HTMLElement) => {
      el.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
      el.style.transform = '';
    };
    const onLeaveDoc = () => {
      if (activeTilt) resetTilt(activeTilt);
      if (activeMagnet) activeMagnet.style.transform = '';
      activeTilt = activeMagnet = null;
    };
    addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeaveDoc);

    // ---- Ripple ----
    const onDown = (e: PointerEvent) => {
      const host = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-ripple]');
      if (!host) return;
      const r = host.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - r.left - size / 2}px`;
      wave.style.top = `${e.clientY - r.top - size / 2}px`;
      host.appendChild(wave);
      wave.addEventListener('animationend', () => wave.remove());
    };
    addEventListener('pointerdown', onDown);

    return () => {
      io?.disconnect();
      mo.disconnect();
      removeEventListener('scroll', onScroll);
      removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeaveDoc);
      removeEventListener('pointerdown', onDown);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(tiltFrame);
    };
  }, []);
}

/** Estilo para el retraso de una animación de revelado. */
export function delay(ms: number): React.CSSProperties {
  return { ['--reveal-delay' as string]: `${ms}ms` };
}

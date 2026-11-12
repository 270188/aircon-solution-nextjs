import { useEffect, useRef, useState } from 'react';

import { whatsappLink } from '../core/site.data';
import { Icon } from '../shared/Icon';
import { hasFinePointer, prefersReducedMotion } from '../shared/motion';

const wa = whatsappLink();

/**
 * Efectos globales: barra de progreso de lectura, luz que sigue al cursor,
 * botón de WhatsApp con ondas y botón "volver arriba" con anillo de progreso.
 */
export function Effects() {
  const [progress, setProgress] = useState(0);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        setProgress(max > 0 ? Math.min(scrollY / max, 1) : 0);
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let onMove: ((e: PointerEvent) => void) | null = null;
    if (hasFinePointer() && !prefersReducedMotion() && glow.current) {
      const el = glow.current;
      onMove = (e: PointerEvent) => {
        el.classList.add('on');
        el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      };
      addEventListener('pointermove', onMove, { passive: true });
    }
    return () => {
      removeEventListener('scroll', onScroll);
      if (onMove) removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const toTop = () => scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  return (
    <div className="c-effects" style={{ display: 'contents' }}>
      <div className="progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true"></div>
      <div ref={glow} className="glow" aria-hidden="true"></div>

      <a className="wa" href={wa} target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
        <span className="pulse"></span>
        <span className="pulse two"></span>
        <Icon name="whatsapp" size={30} />
        <span className="tip">¿Hablamos? Respondemos al toque</span>
      </a>

      <button className={`top${progress > 0.08 ? ' show' : ''}`} type="button" onClick={toTop} aria-label="Volver arriba">
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="21" className="track" />
          <circle cx="24" cy="24" r="21" className="fill" style={{ strokeDashoffset: 132 - 132 * progress }} />
        </svg>
        <Icon name="arrowUp" size={18} />
      </button>
    </div>
  );
}

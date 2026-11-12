import { useEffect, useRef } from 'react';

import { prefersReducedMotion } from './motion';

/** Cuenta desde 0 hasta el valor cuando el número aparece en pantalla. */
export function CountUp({ value, duration = 2000 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const format = (n: number) => Math.round(n).toLocaleString('es-PE');
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      node.textContent = format(value);
      return;
    }
    node.textContent = '0';
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          node.textContent = format(value * (1 - Math.pow(1 - t, 4)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={ref} />;
}

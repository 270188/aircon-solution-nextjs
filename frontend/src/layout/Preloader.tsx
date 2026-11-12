import { useEffect, useState } from 'react';

const angles = [0, 60, 120, 180, 240, 300];

/** Pantalla de carga inicial con el copo/sol del logo girando. */
export function Preloader() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const finish = () => {
      timers.push(setTimeout(() => setLeaving(true), 350));
      timers.push(setTimeout(() => setGone(true), 1300));
    };
    if (document.readyState === 'complete') finish();
    else addEventListener('load', finish, { once: true });
    // Nunca bloquear más de 3 s aunque alguna imagen tarde.
    timers.push(setTimeout(() => setLeaving(true), 3000));
    timers.push(setTimeout(() => setGone(true), 4000));
    return () => {
      timers.forEach(clearTimeout);
      removeEventListener('load', finish);
    };
  }, []);

  if (gone) return null;
  return (
    <div className="c-preloader" style={{ display: 'contents' }}>
      <div className={`preloader${leaving ? ' leaving' : ''}`} role="status" aria-label="Cargando">
        <div className="emblem">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="44" className="ring" />
            <g className="flake">
              {angles.map((a) => (
                <g key={a} transform={`rotate(${a} 50 50)`}>
                  <path d="M50 50V18M50 28l-7-7M50 28l7-7" />
                </g>
              ))}
            </g>
          </svg>
        </div>
        <p className="word"><span className="air">AIRCON</span><span className="con">SOLUTION</span> SERVICES SAC</p>
        <div className="bar"><span></span></div>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

import { processSteps } from '../core/site.data';
import { Icon } from '../shared/Icon';

/** Línea de tiempo cuyo trazo se "dibuja" mientras haces scroll. */
export function Process() {
  const [progress, setProgress] = useState(0);
  const line = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!line.current) return;
        const r = line.current.getBoundingClientRect();
        setProgress(Math.max(0, Math.min(1, (innerHeight * 0.6 - r.top) / r.height)));
      });
    };
    addEventListener('scroll', update, { passive: true });
    update();
    return () => {
      removeEventListener('scroll', update);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="c-process" style={{ display: 'contents' }}>
      <section className="section process" aria-labelledby="process-title">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow" data-reveal="blur">Cómo trabajamos</span>
            <h2 className="section-title" id="process-title" data-reveal="up">
              Simple, rápido y <span className="text-gradient">transparente</span>
            </h2>
          </div>
          <div className="timeline" ref={line}>
            <div className="rail" aria-hidden="true"><span style={{ transform: `scaleY(${progress})` }}></span></div>
            {processSteps.map((step, i) => (
              <div
                key={step.title}
                className={['step', i % 2 === 1 ? 'right' : '', progress > (i + 0.3) / processSteps.length ? 'lit' : ''].filter(Boolean).join(' ')}
              >
                <div className="node"><Icon name={step.icon} size={24} /></div>
                <div className="card" data-reveal={i % 2 === 1 ? 'left' : 'right'}>
                  <span className="n">Paso {i + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

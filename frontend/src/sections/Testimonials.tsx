import { useEffect, useRef, useState } from 'react';

import { testimonials } from '../core/site.data';
import { Icon } from '../shared/Icon';
import { prefersReducedMotion } from '../shared/motion';

/** Carrusel de testimonios con avance automático, barra de progreso y gesto de deslizar. */
export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const elapsed = useRef(0);
  const tx = useRef(0);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const select = (i: number) => {
    elapsed.current = 0;
    setIndex(i);
  };
  const go = (delta: number) => setIndex((i) => {
    elapsed.current = 0;
    return (i + delta + testimonials.length) % testimonials.length;
  });

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = setInterval(() => {
      if (pausedRef.current || document.hidden) return;
      elapsed.current += 100;
      if (elapsed.current >= 6000) go(1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="c-testimonials" style={{ display: 'contents' }}>
      <section
        className="section testi"
        id="testimonios"
        aria-labelledby="testi-title"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="container">
          <div className="section-head">
            <span className="eyebrow" data-reveal="blur">Testimonios</span>
            <h2 className="section-title" id="testi-title" data-reveal="up">
              Lo que dicen <span className="text-gradient">nuestros clientes</span>
            </h2>
          </div>

          <div
            className="stage"
            data-reveal="zoom"
            aria-roledescription="carrusel"
            onTouchStart={(e) => (tx.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              const dx = e.changedTouches[0].clientX - tx.current;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }}
          >
            <span className="quote" aria-hidden="true">“</span>
            {testimonials.map((t, i) => (
              <figure
                key={t.name}
                className={`slide${i === index ? ' active' : ''}`}
                aria-hidden={i !== index}
                aria-roledescription="testimonio"
                aria-label={`${i + 1} de ${testimonials.length}`}
              >
                <div className="stars" aria-label={`${t.rating} de 5 estrellas`}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ ['--s' as string]: s }}><Icon name="star" size={20} /></span>
                  ))}
                </div>
                <blockquote>{t.text}</blockquote>
                <figcaption>
                  <img src={t.img} alt={t.name} width={56} height={56} loading="lazy" />
                  <div><strong>{t.name}</strong><span>{t.role}</span></div>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="controls">
            <button type="button" className="arrow" onClick={() => go(-1)} aria-label="Testimonio anterior"><Icon name="arrowLeft" size={20} /></button>
            <div className="dots">
              {testimonials.map((t, i) => (
                <button key={t.name} type="button" className={i === index ? 'active' : ''} onClick={() => select(i)} aria-label={`Ver testimonio ${i + 1}`}>
                  {i === index && <span key={index} className={`bar${paused ? ' paused' : ''}`}></span>}
                </button>
              ))}
            </div>
            <button type="button" className="arrow" onClick={() => go(1)} aria-label="Testimonio siguiente"><Icon name="arrowRight" size={20} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}

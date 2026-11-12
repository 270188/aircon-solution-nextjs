import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { galleryFilters, galleryItems, type GalleryCategory } from '../core/site.data';
import { delay } from '../shared/effects';
import { Icon } from '../shared/Icon';

type Filter = GalleryCategory | 'todos';

export function Gallery() {
  const [filter, setFilter] = useState<Filter>('todos');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const items = useMemo(() => (filter === 'todos' ? galleryItems : galleryItems.filter((g) => g.category === filter)), [filter]);
  const current = openIndex === null ? null : items[openIndex];
  const touchX = useRef(0);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const changeFilter = (f: Filter) => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    // Las tarjetas se reacomodan con animación si el navegador lo soporta.
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      doc.startViewTransition(() => flushSync(() => setFilter(f)));
    } else {
      setFilter(f);
    }
  };

  const open = (i: number, e: React.MouseEvent<HTMLElement>) => {
    lastFocus.current = e.currentTarget;
    setOpenIndex(i);
    document.body.classList.add('no-scroll');
  };

  const close = () => {
    setOpenIndex(null);
    document.body.classList.remove('no-scroll');
    lastFocus.current?.focus();
  };

  const step = (delta: number) => {
    setDirection(delta > 0 ? 'next' : 'prev');
    setOpenIndex((i) => (i === null ? i : (i + delta + items.length) % items.length));
  };

  useEffect(() => {
    if (openIndex === null) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex === null]);

  return (
    <div className="c-gallery" style={{ display: 'contents' }}>
      <section className="section" id="trabajos" aria-labelledby="gallery-title">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow" data-reveal="blur">Trabajos reales</span>
            <h2 className="section-title" id="gallery-title" data-reveal="up">
              Nuestro trabajo <span className="text-gradient">habla por nosotros</span>
            </h2>
            <p data-reveal="up" style={delay(100)}>
              Fotos de servicios realizados por nuestro equipo en hogares, oficinas, locales comerciales e industrias.
            </p>
          </div>

          <div className="filters" role="tablist" aria-label="Filtrar trabajos" data-reveal="up" style={delay(150)}>
            {galleryFilters.map((f) => (
              <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'active' : ''} onClick={() => changeFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="masonry">
            {items.map((item, i) => (
              <button
                key={item.image}
                type="button"
                className={`tile${item.tall ? ' tall' : ''}`}
                style={{ viewTransitionName: 'g' + item.image.replaceAll('/', '-'), ...delay((i % 4) * 70) }}
                onClick={(e) => open(i, e)}
                aria-label={`Ampliar foto: ${item.caption}`}
                data-reveal="zoom"
              >
                <picture>
                  <source srcSet={`${item.image}.webp`} type="image/webp" />
                  <img src={`${item.image}.jpg`} alt={item.caption} loading="lazy" />
                </picture>
                <span className="cap">
                  <span>{item.caption}</span>
                  <span className="zoom"><Icon name="zoom" size={20} /></span>
                </span>
              </button>
            ))}
            {items.length === 0 && <p className="empty">Pronto subiremos fotos de esta categoría.</p>}
          </div>
        </div>
      </section>

      {current && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={current.caption}
          onClick={close}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          }}
        >
          <button ref={closeBtn} type="button" className="close" onClick={close} aria-label="Cerrar"><Icon name="close" size={26} /></button>
          <button type="button" className="nav prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label="Foto anterior">
            <Icon name="chevronLeft" size={30} />
          </button>
          <figure key={openIndex} className={direction} onClick={(e) => e.stopPropagation()}>
            <picture>
              <source srcSet={`${current.image}.webp`} type="image/webp" />
              <img src={`${current.image}.jpg`} alt={current.caption} />
            </picture>
            <figcaption>{current.caption} <span>{(openIndex ?? 0) + 1} / {items.length}</span></figcaption>
          </figure>
          <button type="button" className="nav next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label="Foto siguiente">
            <Icon name="chevronRight" size={30} />
          </button>
        </div>
      )}
    </div>
  );
}

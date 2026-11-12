import { brands, stats } from '../core/site.data';
import { CountUp } from '../shared/CountUp';
import { delay } from '../shared/effects';

export function BrandsStats() {
  return (
    <div className="c-brands-stats" style={{ display: 'contents' }}>
      <section className="brands" aria-label="Marcas con las que trabajamos">
        <p className="title" data-reveal="blur">Trabajamos con todas las marcas</p>
        <div className="marquee">
          <div className="track">
            {[0, 1].map((round) =>
              brands.map((b) => (
                <div key={`${round}-${b.name}`} className="brand" aria-hidden={round === 1}>
                  {b.src ? <img src={b.src} alt={b.name} loading="lazy" height={34} /> : <span>{b.name}</span>}
                </div>
              )),
            )}
          </div>
        </div>
      </section>

      <section className="stats" aria-label="AIRCONSOLUTION SERVICES SAC en números">
        <div className="container grid">
          {stats.map((s, i) => (
            <div key={s.label} className="stat" data-reveal="flip" style={delay(i * 110)}>
              <strong><CountUp value={s.value} /><em>{s.suffix}</em></strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

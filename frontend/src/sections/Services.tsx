import { services } from '../core/site.data';
import { ui } from '../core/ui';
import { delay } from '../shared/effects';
import { Icon } from '../shared/Icon';

export function Services() {
  return (
    <div className="c-services" style={{ display: 'contents' }}>
      <section className="section" id="servicios" aria-labelledby="services-title">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow" data-reveal="blur">Nuestros servicios</span>
            <h2 className="section-title" id="services-title" data-reveal="up" style={delay(80)}>
              Todo lo que tu equipo <span className="text-gradient">necesita</span>
            </h2>
            <p data-reveal="up" style={delay(160)}>
              Desde la instalación hasta el mantenimiento y la reparación, con un mismo equipo técnico de confianza.
            </p>
          </div>

          <div className="grid">
            {services.map((s, i) => (
              <article key={s.id} className="svc" data-tilt="7" data-reveal="up" style={delay((i % 3) * 120)}>
                <div className="media">
                  <picture>
                    <source srcSet={`${s.image}.webp`} type="image/webp" />
                    <img src={`${s.image}.jpg`} alt={s.title} loading="lazy" width={600} height={400} />
                  </picture>
                  <span className="num">0{i + 1}</span>
                </div>
                <div className="body">
                  <span className="ic"><Icon name={s.icon} size={26} /></span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <ul>
                    {s.features.map((f) => (
                      <li key={f}><Icon name="check" size={16} stroke={2.6} /> {f}</li>
                    ))}
                  </ul>
                  <button type="button" className="link" onClick={() => ui.bookService(s.id)}>
                    Reservar este servicio <Icon name="arrowRight" size={18} />
                  </button>
                </div>
                <span className="spot" aria-hidden="true"></span>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

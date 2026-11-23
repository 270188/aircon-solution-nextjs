import { Link } from 'react-router';

import { coverage, sectors, servicePages } from '../core/site.data';
import { delay } from '../shared/effects';
import { Icon } from '../shared/Icon';

/** Portada: soluciones corporativas, con enlaces a la página de cada una. */
export function Solutions() {
  return (
    <div className="c-solutions" style={{ display: 'contents' }}>
      <section className="section solutions" id="soluciones" aria-labelledby="solutions-title">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow" data-reveal="blur">Soluciones corporativas</span>
            <h2 className="section-title" id="solutions-title" data-reveal="up" style={delay(80)}>
              Soluciones <span className="text-gradient">integrales</span> para tu empresa
            </h2>
            <p data-reveal="up" style={delay(160)}>
              Para {sectors.map((s) => s.label.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' y $1')}.
            </p>
          </div>
          <ul className="cards">
            {servicePages.map((p, i) => (
              <li key={p.slug} data-reveal="up" style={delay((i % 4) * 100)}>
                <Link to={`/${p.slug}`}>
                  <span className="ic"><Icon name={p.icon} size={24} /></span>
                  <h3>{p.h1}</h3>
                  <p>{p.intro.split('. ')[0]}.</p>
                  <span className="more">Ver detalles y cotizar <Icon name="arrowRight" size={18} /></span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="zones" data-reveal="up">
            <h3>Aire acondicionado en toda Lima y Callao</h3>
            <p>
              Estamos en Los Olivos y atendemos casas, oficinas y negocios en toda Lima Metropolitana y Callao.{' '}
              <Link to="/aire-acondicionado-los-olivos">Ver atención en Lima Norte</Link>
            </p>
            <ul>
              {coverage.map((c) => (
                <li key={c.zone}><strong>{c.zone}:</strong> {c.districts}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

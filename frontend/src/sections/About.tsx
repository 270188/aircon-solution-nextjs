import { checklist } from '../core/site.data';
import { ui } from '../core/ui';
import { delay } from '../shared/effects';
import { Icon } from '../shared/Icon';

export function About() {
  return (
    <div className="c-about" style={{ display: 'contents' }}>
      <section className="section" id="nosotros" aria-labelledby="about-title">
        <div className="container grid">
          <div className="visual">
            <div className="frame main" data-reveal="mask">
              <picture>
                <source srcSet="images/trabajos/tecnico-york.webp" type="image/webp" />
                <img src="images/trabajos/tecnico-york.jpg" alt="Técnico de AIRCONSOLUTION SERVICES SAC trabajando en un equipo York" loading="lazy" />
              </picture>
            </div>
            <div className="frame small" data-parallax="0.12">
              <picture>
                <source srcSet="images/trabajos/cortina-aire.webp" type="image/webp" />
                <img src="images/trabajos/cortina-aire.jpg" alt="Mantenimiento de cortina de aire" loading="lazy" />
              </picture>
            </div>
            <div className="badge" data-reveal="zoom" style={delay(400)}>
              <svg viewBox="0 0 120 120" aria-hidden="true">
                <defs><path id="circ" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" /></defs>
                <text><textPath href="#circ">CALIDAD · GARANTÍA · CONFIANZA · </textPath></text>
              </svg>
              <Icon name="snow" size={34} />
            </div>
          </div>

          <div className="text">
            <span className="eyebrow" data-reveal="blur">Quiénes somos</span>
            <h2 className="section-title" id="about-title" data-reveal="up">
              Tu equipo técnico de <span className="text-gradient">confianza</span> en Lima
            </h2>
            <p data-reveal="up" style={delay(80)}>
              En <strong>AIRCONSOLUTION SERVICES SAC</strong> somos especialistas en climatización y electricidad. Atendemos hogares,
              oficinas, restaurantes, locales comerciales e industrias con la misma dedicación: trabajo limpio,
              puntual y bien hecho.
            </p>
            <p data-reveal="up" style={delay(140)}>
              Cada servicio lo realiza personal capacitado y uniformado, con herramientas profesionales y
              repuestos originales. Te explicamos qué tiene tu equipo antes de tocar nada.
            </p>
            <ul className="checks">
              {checklist.map((c, i) => (
                <li key={c} data-reveal="left" style={delay(200 + i * 90)}>
                  <span className="tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg></span>
                  {c}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" data-ripple onClick={() => ui.scrollTo('reservar')} data-reveal="up" style={delay(560)}>
              Agenda una visita <Icon name="arrowRight" size={18} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

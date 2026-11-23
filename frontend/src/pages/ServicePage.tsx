import { Link, useNavigate } from 'react-router';

import {
  brands,
  business,
  coverage,
  galleryItems,
  quoteProcess,
  sectors,
  servicePages,
  whatsappLink,
  type ServicePageData,
} from '../core/site.data';
import { ui } from '../core/ui';
import { delay } from '../shared/effects';
import { Icon } from '../shared/Icon';
import { photoSrcSet } from '../shared/photo';

const captionOf = (image: string) => galleryItems.find((g) => g.image === image)?.caption ?? business.name;

function Photo({ image, eager = false }: { image: string; eager?: boolean }) {
  return (
    <picture>
      <source srcSet={photoSrcSet(image)} sizes="(min-width: 960px) 420px, 50vw" type="image/webp" />
      <img src={`/${image}.jpg`} alt={captionOf(image)} loading={eager ? 'eager' : 'lazy'} width={600} height={750} />
    </picture>
  );
}

/** Página de una solución (mantenimiento para empresas, instalación, refrigeración, contratos). */
export function ServicePage({ page }: { page: ServicePageData }) {
  const navigate = useNavigate();
  const quote = whatsappLink(page.quoteMessage);
  const others = servicePages.filter((p) => p.slug !== page.slug);

  const book = (e: React.MouseEvent) => {
    e.preventDefault();
    ui.setPreselectedService(page.bookingService);
    navigate({ pathname: '/', hash: 'reservar' });
  };

  const ctas = (
    <div className="ctas">
      <a href={quote} target="_blank" rel="noopener" className="btn btn-accent" data-magnetic data-ripple>
        <Icon name="whatsapp" size={20} /> Solicitar cotización
      </a>
      <a href="/#reservar" className="btn btn-outline" onClick={book}>
        <Icon name="calendar" size={18} /> Agendar visita técnica
      </a>
    </div>
  );

  return (
    <div className="c-service-page">
      <section className="sp-hero">
        <div className="container sp-hero-grid">
          <div>
            <nav className="crumbs" aria-label="Ruta de navegación">
              <Link to="/">Inicio</Link> <span aria-hidden="true">›</span> <Link to="/#soluciones">Soluciones</Link>{' '}
              <span aria-hidden="true">›</span> <span aria-current="page">{page.label}</span>
            </nav>
            <span className="eyebrow">{page.eyebrow ?? 'Soluciones corporativas integrales'}</span>
            <h1>{page.h1}</h1>
            <p className="lead">{page.intro}</p>
            {ctas}
            <p className="call">
              O llámanos: <a href={`tel:${business.phone}`}>{business.phoneDisplay}</a> ·{' '}
              <a href={`tel:${business.phone2}`}>{business.phone2Display}</a>
            </p>
          </div>
          <div className="sp-hero-photo">
            <Photo image={page.photos[0]} eager />
            <span className="badge"><strong>20+</strong> años de experiencia</span>
          </div>
        </div>
      </section>

      <section className="sp-block">
        <div className="container">
          <h2 className="sp-title" data-reveal="up">Atendemos a</h2>
          <ul className="sectors">
            {sectors.map((s, i) => (
              <li key={s.label} data-reveal="up" style={delay((i % 3) * 80)}>
                <span className="ic"><Icon name={s.icon} size={22} /></span>
                <strong>{s.label}</strong>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sp-block alt">
        <div className="container includes-grid">
          <div data-reveal="up">
            <h2 className="sp-title">¿Qué incluye?</h2>
            <ul className="includes">
              {page.includes.map((item) => (
                <li key={item}><Icon name="checkCircle" size={22} /> {item}</li>
              ))}
            </ul>
          </div>
          <div className="includes-photo" data-reveal="up" style={delay(120)}>
            <Photo image={page.photos[1]} />
          </div>
        </div>
      </section>

      <section className="sp-block">
        <div className="container">
          <h2 className="sp-title" data-reveal="up">Trabajos reales de nuestro equipo</h2>
          <p className="sp-sub" data-reveal="up">Fotos tomadas por nuestros técnicos en servicios realizados en Lima.</p>
          <div className="photos">
            {page.photos.map((image, i) => (
              <figure key={image} data-reveal="up" style={delay((i % 3) * 80)}>
                <Photo image={image} />
                <figcaption>{captionOf(image)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="sp-block alt">
        <div className="container">
          <h2 className="sp-title" data-reveal="up">Experiencia que puedes comprobar</h2>
          <ul className="proof">
            <li data-reveal="up"><strong>20+</strong><span>años de experiencia en aire acondicionado y electricidad</span></li>
            <li data-reveal="up" style={delay(80)}><strong>RUC</strong><span>Empresa formal {business.legalName} · RUC {business.ruc}</span></li>
            <li data-reveal="up" style={delay(160)}><strong>Garantía</strong><span>por escrito en cada trabajo, con factura electrónica</span></li>
            <li data-reveal="up" style={delay(240)}><strong>Marcas</strong><span>{brands.map((b) => b.name).join(', ')} y más</span></li>
          </ul>
        </div>
      </section>

      <section className="sp-block">
        <div className="container">
          <h2 className="sp-title" data-reveal="up">Proceso de atención</h2>
          <ol className="steps">
            {quoteProcess.map((step, i) => (
              <li key={step.title} data-reveal="up" style={delay(i * 80)}>
                <span className="n">{i + 1}</span>
                <span className="ic"><Icon name={step.icon} size={22} /></span>
                <strong>{step.title}</strong>
                <span>{step.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sp-block alt">
        <div className="container">
          <h2 className="sp-title" data-reveal="up">Cobertura en Lima y Callao</h2>
          <p className="sp-sub" data-reveal="up">Vamos a tu empresa, edificio o negocio en toda Lima Metropolitana y Callao.</p>
          <ul className="coverage">
            {coverage.map((c, i) => (
              <li key={c.zone} data-reveal="up" style={delay((i % 3) * 80)}>
                <Icon name="pin" size={20} />
                <div><strong>{c.zone}</strong><span>{c.districts}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sp-cta">
        <div className="container" data-reveal="up">
          <h2>¿Necesitas una cotización?</h2>
          <p>Cuéntanos cuántos equipos tienes y dónde están. Te respondemos por WhatsApp el mismo día.</p>
          {ctas}
        </div>
      </section>

      <section className="sp-block">
        <div className="container">
          <h2 className="sp-title" data-reveal="up">Otras soluciones</h2>
          <ul className="others">
            {others.map((p) => (
              <li key={p.slug} data-reveal="up">
                <Link to={`/${p.slug}`}>
                  <Icon name={p.icon} size={22} />
                  <span className="txt">{p.label}</span>
                  <Icon name="arrowRight" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

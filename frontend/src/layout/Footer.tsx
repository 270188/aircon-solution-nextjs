import { Link, useLocation, useNavigate } from 'react-router';

import { business, navLinks, services, whatsappLink, type ServiceId } from '../core/site.data';
import { ui } from '../core/ui';
import { FACEBOOK_ANDROID_PACKAGE, TIKTOK_ANDROID_PACKAGE, appLink } from '../shared/appLink';
import { delay } from '../shared/effects';
import { Icon } from '../shared/Icon';

const wa = whatsappLink();
const tiktok = appLink(business.tiktok, TIKTOK_ANDROID_PACKAGE);
const facebook = appLink(business.facebook, FACEBOOK_ANDROID_PACKAGE);
const year = new Date().getFullYear();

export function Footer() {
  const location = useLocation();
  const navigate = useNavigate();

  const go = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== '/') navigate({ pathname: '/', hash: id });
    else ui.scrollTo(id);
  };

  const book = (id: ServiceId, e: React.MouseEvent) => {
    ui.setPreselectedService(id);
    go('reservar', e);
  };

  return (
    <div className="c-footer" style={{ display: 'contents' }}>
      <footer className="footer">
        <svg className="waves" viewBox="0 0 2880 120" preserveAspectRatio="none" aria-hidden="true">
          <path className="w1" d="M0 60c240 40 480 40 720 0s480-40 720 0 480 40 720 0 480-40 720 0v60H0z" />
        </svg>
        <div className="container grid">
          <div className="brand" data-reveal="up">
            <div className="logo">
              <img src="/images/logo.jpg" alt="" width={52} height={52} />
              <div>
                <strong><span>AIRCON</span><span className="con">SOLUTION</span></strong>
                <small>SERVICES SAC</small>
              </div>
            </div>
            <p>Expertos en climatización, electricidad y mantenimiento para hogares, negocios e industrias en Lima.</p>
            <div className="social">
              <a href={wa} target="_blank" rel="noopener" aria-label="WhatsApp"><Icon name="whatsapp" size={20} /></a>
              {business.facebook && (
                <a href={facebook.href} target={facebook.newTab ? '_blank' : undefined} rel="noopener" aria-label="Facebook"><Icon name="facebook" size={20} /></a>
              )}
              {business.instagram && (
                <a href={business.instagram} target="_blank" rel="noopener" aria-label="Instagram"><Icon name="instagram" size={20} /></a>
              )}
              {business.tiktok && (
                <a href={tiktok.href} target={tiktok.newTab ? '_blank' : undefined} rel="noopener" aria-label="TikTok"><Icon name="tiktok" size={20} /></a>
              )}
              <a href={`mailto:${business.email}`} aria-label="Correo"><Icon name="mail" size={20} /></a>
            </div>
          </div>

          <div data-reveal="up" style={delay(80)}>
            <h4>Navegación</h4>
            <ul>
              {navLinks.map((l) => (
                <li key={l.id}><a href={`/#${l.id}`} onClick={(e) => go(l.id, e)}>{l.label}</a></li>
              ))}
              <li><Link to="/seguimiento">Seguir mi reserva</Link></li>
            </ul>
          </div>

          <div data-reveal="up" style={delay(160)}>
            <h4>Servicios</h4>
            <ul>
              {services.map((s) => (
                <li key={s.id}><a href="/#reservar" onClick={(e) => book(s.id, e)}>{s.title}</a></li>
              ))}
            </ul>
          </div>

          <div data-reveal="up" style={delay(240)}>
            <h4>Contacto</h4>
            <ul className="contact">
              <li><Icon name="phone" size={18} /><a href={`tel:${business.phone}`}>{business.phoneDisplay}</a></li>
              <li><Icon name="phone" size={18} /><a href={`tel:${business.phone2}`}>{business.phone2Display}</a></li>
              <li><Icon name="mail" size={18} /><a href={`mailto:${business.email}`}>{business.email}</a></li>
              <li><Icon name="pin" size={18} /><span>{business.address}</span></li>
              <li><Icon name="clock" size={18} /><span>{business.hours}</span></li>
            </ul>
          </div>
        </div>
        <div className="container bottom">
          <p>© {year} {business.name}. Todos los derechos reservados.</p>
          <nav aria-label="Legal">
            <Link to="/privacidad">Política de privacidad</Link>
            <Link to="/admin">Panel</Link>
          </nav>
        </div>
        <p className="container credit">
          Esta página fue realizada por la desarrolladora de software <strong>Angela Valeria Ruiz León</strong>
          {' · '}
          <a className="dev-phone" href="https://wa.me/51990073634" target="_blank" rel="noopener" aria-label="WhatsApp de la desarrolladora: 990 073 634">
            <Icon name="whatsapp" size={15} /> 990 073 634
          </a>
        </p>
      </footer>
    </div>
  );
}

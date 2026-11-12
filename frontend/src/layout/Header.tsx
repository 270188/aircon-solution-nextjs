import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { business, navLinks, whatsappLink } from '../core/site.data';
import { ui, useUi } from '../core/ui';
import { FACEBOOK_ANDROID_PACKAGE, TIKTOK_ANDROID_PACKAGE, appLink } from '../shared/appLink';
import { Icon } from '../shared/Icon';

const wa = whatsappLink();
const tiktok = appLink(business.tiktok, TIKTOK_ANDROID_PACKAGE);
const facebook = appLink(business.facebook, FACEBOOK_ANDROID_PACKAGE);

export function Header() {
  const theme = useUi((s) => s.theme);
  const location = useLocation();
  const navigate = useNavigate();
  const onHome = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('inicio');
  const lastY = useRef(0);
  const menuRef = useRef(menuOpen);
  menuRef.current = menuOpen;

  useEffect(() => {
    const onScroll = () => {
      const y = scrollY;
      setScrolled(y > 40);
      // Se oculta al bajar y reaparece al subir.
      setHidden(y > 400 && y > lastY.current && !menuRef.current);
      lastY.current = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  // Resalta en el menú la sección visible (scrollspy).
  useEffect(() => {
    if (!onHome) return;
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    const t = setTimeout(() => navLinks.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) spy.observe(el);
    }), 300);
    return () => {
      clearTimeout(t);
      spy.disconnect();
    };
  }, [onHome]);

  const closeMenu = () => {
    setMenuOpen(false);
    document.body.classList.remove('no-scroll');
  };

  const go = (id: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    closeMenu();
    if (!onHome) navigate({ pathname: '/', hash: id });
    else ui.scrollTo(id);
  };

  const toggleMenu = () => {
    const next = !menuOpen;
    setMenuOpen(next);
    document.body.classList.toggle('no-scroll', next);
  };

  const headerClass = ['header', scrolled || !onHome ? 'scrolled' : '', hidden ? 'hidden' : '', menuOpen ? 'menu-open' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className="c-header" style={{ display: 'contents' }}>
      <header className={headerClass}>
        <div className="container bar">
          <a href="/#inicio" className="logo" onClick={(e) => go('inicio', e)} aria-label="AIRCONSOLUTION SERVICES SAC, ir al inicio">
            <img src="/images/logo.jpg" alt="" width={44} height={44} className="logo-mark" />
            <span className="logo-words">
              <span className="logo-text"><span className="air">AIRCON</span><span className="con">SOLUTION</span></span>
              <span className="logo-sub">SERVICES SAC</span>
            </span>
          </a>

          <nav className="nav" aria-label="Principal">
            {navLinks.map((link) => (
              <a key={link.id} href={`/#${link.id}`} className={onHome && active === link.id ? 'active' : ''} onClick={(e) => go(link.id, e)}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="actions">
            <button
              className="icon-btn"
              type="button"
              onClick={(e) => ui.toggleTheme({ x: e.clientX, y: e.clientY })}
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              <span className={`theme-icon${theme === 'dark' ? ' dark' : ''}`}>
                <Icon name="sun" size={20} />
                <Icon name="moon" size={20} />
              </span>
            </button>
            <Link to="/seguimiento" className="icon-btn track" aria-label="Seguir mi reserva" title="Seguir mi reserva">
              <Icon name="ticket" size={20} />
            </Link>
            <a href="/#reservar" className="btn btn-accent btn-sm cta" data-magnetic data-ripple onClick={(e) => go('reservar', e)}>
              <Icon name="calendar" size={18} /> Reservar cita
            </a>
            <button
              className="burger"
              type="button"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className={`mobile${menuOpen ? ' open' : ''}`} aria-hidden={!menuOpen} inert={!menuOpen}>
        <nav aria-label="Menú móvil">
          {navLinks.map((link, i) => (
            <a key={link.id} href={`/#${link.id}`} style={{ ['--i' as string]: i }} onClick={(e) => go(link.id, e)}>
              <span className="num">0{i + 1}</span>
              {link.label}
            </a>
          ))}
          <Link to="/seguimiento" style={{ ['--i' as string]: navLinks.length }} onClick={closeMenu}>
            <span className="num">0{navLinks.length + 1}</span>Seguir mi reserva
          </Link>
        </nav>
        <div className="mobile-cta" style={{ ['--i' as string]: navLinks.length + 1 }}>
          <a href="/#reservar" className="btn btn-accent btn-block" onClick={(e) => go('reservar', e)}>Reservar cita</a>
          <a href={wa} target="_blank" rel="noopener" className="btn btn-whatsapp btn-block">
            <Icon name="whatsapp" size={20} /> WhatsApp
          </a>
          <div className="social">
            <a href={facebook.href} target={facebook.newTab ? '_blank' : undefined} rel="noopener" aria-label="Facebook"><Icon name="facebook" size={20} /></a>
            <a href={business.instagram} target="_blank" rel="noopener" aria-label="Instagram"><Icon name="instagram" size={20} /></a>
            <a href={tiktok.href} target={tiktok.newTab ? '_blank' : undefined} rel="noopener" aria-label="TikTok"><Icon name="tiktok" size={20} /></a>
          </div>
        </div>
      </div>
    </div>
  );
}

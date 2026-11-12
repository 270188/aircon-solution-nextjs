import { useEffect, useState } from 'react';

import { whatsappLink } from '../core/site.data';
import { ui } from '../core/ui';
import { Icon } from '../shared/Icon';
import { prefersReducedMotion } from '../shared/motion';
import { AirflowCanvas } from './AirflowCanvas';

const wa = whatsappLink('Hola AIRCONSOLUTION SERVICES SAC, necesito una cotización.');
const words = ['Climatización', 'Mantenimiento', 'Electricidad', 'Reparaciones'];
const titleWords = ['Soluciones', 'expertas', 'en'];

/** Efecto máquina de escribir que rota entre palabras. */
function useTypewriter(): string {
  const [typed, setTyped] = useState(prefersReducedMotion() ? words[0] : '');
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let word = 0;
    let chars = 0;
    let deleting = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const current = words[word];
      chars += deleting ? -1 : 1;
      setTyped(current.slice(0, chars));
      let wait = deleting ? 45 : 95;
      if (!deleting && chars === current.length) {
        deleting = true;
        wait = 2000;
      } else if (deleting && chars === 0) {
        deleting = false;
        word = (word + 1) % words.length;
        wait = 350;
      }
      timer = setTimeout(tick, wait);
    };
    timer = setTimeout(tick, 1400);
    return () => clearTimeout(timer);
  }, []);
  return typed;
}

export function Hero() {
  const typed = useTypewriter();
  const scroll = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    ui.scrollTo(id);
  };

  return (
    <div className="c-hero" style={{ display: 'contents' }}>
      <section className="hero" id="inicio" aria-labelledby="hero-title">
        <div className="bg" data-parallax="-0.25">
          <picture>
            <source srcSet="images/hero.webp" type="image/webp" />
            <img src="images/hero.jpg" alt="" fetchPriority="high" />
          </picture>
        </div>
        <div className="overlay"></div>
        <div className="aurora"><span></span><span></span><span></span></div>
        <AirflowCanvas />

        <div className="container content">
          <p className="badge"><span className="dot"></span> Atención de emergencias 24/7 en Lima</p>

          <h1 id="hero-title">
            <span className="line">
              {titleWords.map((w, i) => (
                <span key={w} className="word" style={{ ['--d' as string]: i }}>{w}&nbsp;</span>
              ))}
            </span>
            <span className="line typed-line">
              <span className="typed text-gradient">{typed}</span>
              <span className="caret" aria-hidden="true"></span>
            </span>
            <span className="line">
              <span className="word" style={{ ['--d' as string]: 4 }}>y&nbsp;</span>
              <span className="word fire" style={{ ['--d' as string]: 5 }}>confort</span>
            </span>
          </h1>
          <span className="sr-only">Climatización, mantenimiento, electricidad y reparaciones.</span>

          <p className="lead">
            Instalamos, reparamos y mantenemos tus equipos de aire acondicionado e instalaciones eléctricas,
            con técnicos capacitados, repuestos originales y garantía por escrito.
          </p>

          <div className="cta">
            <a href="#reservar" className="btn btn-accent" data-magnetic data-ripple onClick={scroll('reservar')}>
              <Icon name="calendar" size={20} /> Reserva tu visita
            </a>
            <a href={wa} target="_blank" rel="noopener" className="btn btn-ghost" data-magnetic data-ripple>
              <Icon name="whatsapp" size={20} /> Cotiza por WhatsApp
            </a>
          </div>

          <ul className="trust">
            <li><Icon name="shield" size={18} /> Garantía por escrito</li>
            <li><Icon name="clock" size={18} /> Respuesta el mismo día</li>
            <li><Icon name="checkCircle" size={18} /> Todas las marcas</li>
          </ul>
        </div>

        <div className="floating">
          <div className="glass-card c1">
            <span className="ic ice"><Icon name="snow" size={22} /></span>
            <div><strong>18 °C</strong><small>Confort garantizado</small></div>
          </div>
          <div className="glass-card c2">
            <div className="stars">
              {[1, 2, 3, 4, 5].map((s) => <Icon key={s} name="star" size={16} />)}
            </div>
            <small>Clientes felices en Lima</small>
          </div>
          <div className="glass-card c3">
            <span className="ic fire-bg"><Icon name="bolt" size={22} /></span>
            <div><strong>24/7</strong><small>Emergencias</small></div>
          </div>
        </div>

        <a href="#servicios" className="scroll-cue" onClick={scroll('servicios')} aria-label="Ver servicios">
          <span className="mouse"><span></span></span>
        </a>
      </section>
    </div>
  );
}

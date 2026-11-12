import { useState } from 'react';

import { faqs, whatsappLink } from '../core/site.data';
import { delay } from '../shared/effects';
import { Icon } from '../shared/Icon';

const wa = whatsappLink('Hola AIRCONSOLUTION SERVICES SAC, tengo una consulta:');

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="c-faq" style={{ display: 'contents' }}>
      <section className="section faq" aria-labelledby="faq-title">
        <div className="container grid">
          <div className="intro">
            <span className="eyebrow" data-reveal="blur">Preguntas frecuentes</span>
            <h2 className="section-title" id="faq-title" data-reveal="up">¿Tienes <span className="text-gradient">dudas?</span></h2>
            <p data-reveal="up" style={delay(80)}>
              Estas son las consultas más comunes. Si no encuentras la tuya, escríbenos y te respondemos al momento.
            </p>
            <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noopener" data-reveal="up" style={delay(160)}>
              <Icon name="whatsapp" size={20} /> Hacer una pregunta
            </a>
          </div>
          <div className="list">
            {faqs.map((f, i) => (
              <div key={f.q} className={`item${open === i ? ' open' : ''}`} data-reveal="up" style={delay(i * 70)}>
                <h3>
                  <button type="button" id={`faq-q${i}`} aria-expanded={open === i} aria-controls={`faq-a${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
                    <span>{f.q}</span>
                    <span className="plus" aria-hidden="true"></span>
                  </button>
                </h3>
                <div className="answer" id={`faq-a${i}`} role="region" aria-labelledby={`faq-q${i}`}>
                  <div><p>{f.a}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

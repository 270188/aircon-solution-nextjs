import { useRef, useState } from 'react';
import { Link } from 'react-router';

import { api, describeError } from '../core/api';
import { business, whatsappLink } from '../core/site.data';
import { ui } from '../core/ui';
import { delay } from '../shared/effects';
import { EMAIL, PHONE, useForm } from '../shared/form';
import { Icon } from '../shared/Icon';

const wa = whatsappLink();
const initialForm = { name: '', phone: '', email: '', message: '', privacyAccepted: false, website: '' };
type ContactForm = typeof initialForm;

function validate(v: ContactForm): Partial<Record<keyof ContactForm, string>> {
  return {
    name: !v.name.trim() ? 'Este campo es obligatorio.' : v.name.trim().length < 3 ? 'Es demasiado corto.' : '',
    phone: !v.phone.trim() ? 'Este campo es obligatorio.' : !PHONE.test(v.phone) ? 'Ingresa un teléfono válido.' : '',
    email: v.email && !EMAIL.test(v.email) ? 'Ingresa un correo válido.' : '',
    message: !v.message.trim() ? 'Este campo es obligatorio.' : v.message.trim().length < 10 ? 'Cuéntanos un poco más (mínimo 10 caracteres).' : '',
    privacyAccepted: v.privacyAccepted ? '' : 'Debes aceptar la política de privacidad.',
  };
}

export function Contact() {
  const form = useForm(initialForm, validate);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [nlEmail, setNlEmail] = useState('');
  const [nlState, setNlState] = useState<'idle' | 'sending' | 'done'>('idle');
  const hp = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setServerErrors({});
    if (!form.isValid) {
      form.touchAll();
      return;
    }
    const v = form.values;
    setSending(true);
    try {
      const res = await api.sendContact({ ...v, email: v.email || null });
      setSent(true);
      form.reset();
      ui.toast('success', '¡Mensaje enviado!', res.message);
    } catch (err) {
      const { message, fields } = describeError(err);
      form.setServerErrors(fields);
      ui.toast('error', 'No se pudo enviar', message);
    } finally {
      setSending(false);
    }
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = nlEmail.trim();
    if (!EMAIL.test(email)) {
      ui.toast('error', 'Correo inválido', 'Revisa que tu correo esté bien escrito.');
      return;
    }
    setNlState('sending');
    try {
      const res = await api.subscribe(email, hp.current?.value ?? '');
      setNlState('done');
      ui.toast('success', '¡Suscripción lista!', res.message);
    } catch (err) {
      setNlState('idle');
      ui.toast('error', 'No se pudo suscribir', describeError(err).message);
    }
  };

  const field = (name: keyof ContactForm) => ({
    value: form.values[name] as string,
    placeholder: ' ',
    'aria-invalid': !!form.error(name),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => form.set(name, e.target.value),
    onBlur: () => form.touch(name),
  });
  const fieldClass = (name: keyof ContactForm) => `field${form.error(name) ? ' invalid' : ''}`;

  return (
    <div className="c-contact" style={{ display: 'contents' }}>
      <section className="section" id="contacto" aria-labelledby="contact-title">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow" data-reveal="blur">Contacto</span>
            <h2 className="section-title" id="contact-title" data-reveal="up">
              Conversemos sobre <span className="text-gradient">tu proyecto</span>
            </h2>
            <p data-reveal="up" style={delay(80)}>Cotizaciones sin compromiso. Respondemos el mismo día.</p>
          </div>

          <div className="grid">
            <div className="info">
              <a className="tile" href={`tel:${business.phone}`} data-reveal="left">
                <span className="ic"><Icon name="phone" /></span>
                <span><small>Llámanos</small><strong>{business.phoneDisplay}</strong><em>{business.phone2Display}</em></span>
              </a>
              <a className="tile wa" href={wa} target="_blank" rel="noopener" data-reveal="left" style={delay(80)}>
                <span className="ic"><Icon name="whatsapp" /></span>
                <span><small>WhatsApp</small><strong>Escríbenos ahora</strong></span>
              </a>
              <a className="tile" href={`mailto:${business.email}`} data-reveal="left" style={delay(160)}>
                <span className="ic"><Icon name="mail" /></span>
                <span><small>Correo</small><strong>{business.email}</strong></span>
              </a>
              <a className="tile" href={business.mapLink} target="_blank" rel="noopener" data-reveal="left" style={delay(240)}>
                <span className="ic"><Icon name="pin" /></span>
                <span><small>Visítanos</small><strong>{business.address}</strong></span>
              </a>

              <div className="map" data-reveal="zoom" style={delay(300)}>
                {showMap ? (
                  <iframe src={business.mapEmbedSrc} title="Ubicación de AIRCONSOLUTION SERVICES SAC en Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                ) : (
                  <button type="button" className="map-btn" onClick={() => setShowMap(true)}>
                    <span className="pin"><Icon name="pin" size={30} /></span>
                    Ver mapa
                  </button>
                )}
              </div>
            </div>

            <form className="card form" onSubmit={submit} noValidate data-reveal="right">
              {sent ? (
                <div className="sent" role="status">
                  <div className="plane" aria-hidden="true"><Icon name="arrowRight" size={34} /></div>
                  <h3>¡Gracias por escribirnos!</h3>
                  <p>Recibimos tu mensaje y te contactaremos muy pronto.</p>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setSent(false)}>Enviar otro mensaje</button>
                </div>
              ) : (
                <>
                  <h3>Envíanos un mensaje</h3>
                  <div className={fieldClass('name')}>
                    <input id="c-name" autoComplete="name" {...field('name')} />
                    <label htmlFor="c-name">Nombre *</label>
                    {form.error('name') && <span className="error">{form.error('name')}</span>}
                  </div>
                  <div className="row">
                    <div className={fieldClass('phone')}>
                      <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" {...field('phone')} />
                      <label htmlFor="c-phone">Teléfono *</label>
                      {form.error('phone') && <span className="error">{form.error('phone')}</span>}
                    </div>
                    <div className={fieldClass('email')}>
                      <input id="c-email" type="email" autoComplete="email" {...field('email')} />
                      <label htmlFor="c-email">Correo</label>
                      {form.error('email') && <span className="error">{form.error('email')}</span>}
                    </div>
                  </div>
                  <div className={fieldClass('message')}>
                    <textarea id="c-msg" maxLength={2000} {...field('message')}></textarea>
                    <label htmlFor="c-msg">¿En qué te podemos ayudar? *</label>
                    {form.error('message') && <span className="error">{form.error('message')}</span>}
                  </div>
                  <input className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.values.website} onChange={(e) => form.set('website', e.target.value)} />
                  <label className={`consent${form.error('privacyAccepted') ? ' invalid' : ''}`}>
                    <input type="checkbox" checked={form.values.privacyAccepted} onChange={(e) => form.set('privacyAccepted', e.target.checked)} />
                    <span>Acepto la <Link to="/privacidad" target="_blank">política de privacidad</Link>. *</span>
                  </label>
                  <button type="submit" className="btn btn-primary btn-block" disabled={sending} data-ripple>
                    {sending ? <><span className="spinner"></span> Enviando...</> : <>Enviar mensaje <Icon name="arrowRight" size={18} /></>}
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="newsletter" data-reveal="up">
            <div className="nl-glow" aria-hidden="true"></div>
            <div className="nl-text">
              <h3>Consejos para cuidar tus equipos</h3>
              <p>Recibe recordatorios de mantenimiento y promociones exclusivas. Sin spam.</p>
            </div>
            {nlState === 'done' ? (
              <p className="nl-done" role="status"><Icon name="checkCircle" size={24} /> ¡Listo! Ya estás suscrito.</p>
            ) : (
              <form className="nl-form" onSubmit={subscribe}>
                <label htmlFor="nl-email" className="sr-only">Tu correo</label>
                <input id="nl-email" type="email" placeholder="tu@correo.com" autoComplete="email" required value={nlEmail} onChange={(e) => setNlEmail(e.target.value)} />
                <input ref={hp} className="honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <button type="submit" className="btn btn-accent" disabled={nlState === 'sending'} data-ripple>
                  {nlState === 'sending' ? <span className="spinner"></span> : 'Suscribirme'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

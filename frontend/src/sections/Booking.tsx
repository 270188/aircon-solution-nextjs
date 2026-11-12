import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';

import { api, describeError, ApiError, type BookingCreated, type SlotAvailability } from '../core/api';
import { bookableServices, services, whatsappLink, type ServiceId } from '../core/site.data';
import { ui, useUi } from '../core/ui';
import { launchConfetti } from '../shared/confetti';
import { MONTHS, WEEKDAYS_SHORT, buildIcs, longDate, prettyTime, toIsoDate } from '../shared/dates';
import { delay } from '../shared/effects';
import { EMAIL, PHONE, useForm } from '../shared/form';
import { Icon } from '../shared/Icon';

interface DayCell {
  day: number;
  iso: string;
  disabled: boolean;
  today: boolean;
}

/** Debe coincidir con app.booking del backend; se usa solo si la API no responde. */
const FALLBACK_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const MAX_DAYS_AHEAD = 60;
const STEPS = ['Servicio', 'Fecha y hora', 'Tus datos'];
const serviceOptions = bookableServices.map((s) => ({ ...s, icon: services.find((x) => x.id === s.id)?.icon ?? 'bolt' }));

const initialForm = { name: '', phone: '', email: '', address: '', district: '', description: '', privacyAccepted: false, website: '' };
type BookingForm = typeof initialForm;

function validate(v: BookingForm): Partial<Record<keyof BookingForm, string>> {
  return {
    name: !v.name.trim() ? 'Este campo es obligatorio.' : v.name.trim().length < 3 ? 'Es demasiado corto.' : v.name.length > 120 ? 'Es demasiado largo.' : '',
    phone: !v.phone.trim() ? 'Este campo es obligatorio.' : !PHONE.test(v.phone) ? 'Ingresa un teléfono válido, por ejemplo 985 899 731.' : '',
    email: v.email && !EMAIL.test(v.email) ? 'Ingresa un correo válido.' : '',
    address: !v.address.trim() ? 'Este campo es obligatorio.' : v.address.length > 200 ? 'Es demasiado largo.' : '',
    description: v.description.length > 1000 ? 'Es demasiado largo.' : '',
    privacyAccepted: v.privacyAccepted ? '' : 'Debes aceptar la política de privacidad.',
  };
}

export function Booking() {
  const today = useMemo(() => new Date(), []);
  const [step, setStep] = useState(0);
  const [service, setService] = useState<ServiceId | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthAnim, setMonthAnim] = useState<'next' | 'prev'>('next');
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [result, setResult] = useState<BookingCreated | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const form = useForm(initialForm, validate);
  const preselected = useUi((s) => s.preselectedService);

  // Si el visitante pulsó "Reservar este servicio" en otra sección, lo preseleccionamos.
  useEffect(() => {
    if (!preselected) return;
    setService(preselected);
    setStep((s) => (s === 0 ? 1 : s));
    ui.setPreselectedService(null);
  }, [preselected]);

  const monthLabel = `${MONTHS[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;
  const canGoPrev = viewMonth.getFullYear() > today.getFullYear() || viewMonth.getMonth() > today.getMonth();
  const limit = new Date(today);
  limit.setDate(limit.getDate() + MAX_DAYS_AHEAD);
  const canGoNext = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1) <= limit;

  const cells = useMemo<(DayCell | null)[]>(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const lead = (viewMonth.getDay() + 6) % 7; // lunes primero
    const days = new Date(year, month + 1, 0).getDate();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + MAX_DAYS_AHEAD);
    const list: (DayCell | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++) {
      const dt = new Date(year, month, d);
      list.push({ day: d, iso: toIsoDate(dt), disabled: dt < start || dt > end || dt.getDay() === 0, today: dt.getTime() === start.getTime() });
    }
    return list;
  }, [viewMonth, today]);

  const serviceLabel = serviceOptions.find((s) => s.id === service)?.label ?? '';

  const goTo = (s: number) => {
    if (s >= 1 && !service) return;
    if (s >= 2 && (!date || !time)) return;
    setStep(s);
    const el = card.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const chooseService = (id: ServiceId) => {
    setService(id);
    setTimeout(() => setStep(1), 250);
  };

  const changeMonth = (d: number) => {
    setMonthAnim(d > 0 ? 'next' : 'prev');
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + d, 1));
  };

  const pickDate = (iso: string) => {
    setDate(iso);
    setTime(null);
    setSlotsLoading(true);
    setDayClosed(false);
    api.availability(iso).then(
      (a) => {
        setOffline(false);
        setDayClosed(!a.open);
        setSlots(a.slots);
        setSlotsLoading(false);
      },
      () => {
        // Sin conexión con el servidor: mostramos horarios referenciales y se confirma por WhatsApp.
        setOffline(true);
        setSlots(FALLBACK_SLOTS.map((t) => ({ time: t, available: true })));
        setSlotsLoading(false);
      },
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    form.setServerErrors({});
    if (!form.isValid) {
      form.touchAll();
      ui.toast('error', 'Revisa el formulario', 'Hay campos por completar o corregir.');
      return;
    }
    const v = form.values;
    setSubmitting(true);
    setSubmitFailed(false);
    try {
      const res = await api.createBooking({
        ...v,
        email: v.email || null,
        district: v.district || null,
        description: v.description || null,
        service: service!,
        date: date!,
        time: time!,
      });
      setResult(res);
      setStep(3);
      setTimeout(() => card.current && launchConfetti(card.current), 150);
    } catch (err) {
      const { message, fields } = describeError(err);
      form.setServerErrors(fields);
      setSubmitFailed(true);
      ui.toast('error', 'No pudimos registrar tu reserva', message);
      if (err instanceof ApiError && err.status === 409 && date) {
        // El horario se ocupó: recargamos la disponibilidad y volvemos al paso de fecha.
        goTo(1);
        pickDate(date);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappSummary = () => {
    const v = form.values;
    const lines = [
      result ? `Hola AIRCONSOLUTION SERVICES SAC, acabo de reservar una visita (código ${result.code}).` : 'Hola AIRCONSOLUTION SERVICES SAC, quiero reservar una visita:',
      `Servicio: ${serviceLabel}`,
      `Fecha: ${date ? longDate(date) : ''} - ${time ? prettyTime(time) : ''}`,
      `Nombre: ${v.name}`,
      `Teléfono: ${v.phone}`,
      `Dirección: ${v.address}${v.district ? ', ' + v.district : ''}`,
    ];
    if (v.description) lines.push(`Detalle: ${v.description}`);
    return whatsappLink(lines.join('\n'));
  };

  const downloadIcs = () => {
    if (!result) return;
    const ics = buildIcs({ code: result.code, date: result.date, time: result.time, title: result.service, address: form.values.address });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reserva-${result.code}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const copyCode = () => {
    if (!result) return;
    navigator.clipboard?.writeText(result.code).then(() => ui.toast('success', 'Código copiado', result.code), () => undefined);
  };

  const reset = () => {
    form.reset();
    setService(null);
    setDate(null);
    setTime(null);
    setResult(null);
    setStep(0);
  };

  const field = (name: keyof BookingForm) => ({
    value: form.values[name] as string,
    placeholder: ' ',
    'aria-invalid': !!form.error(name),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => form.set(name, e.target.value),
    onBlur: () => form.touch(name),
  });
  const fieldClass = (name: keyof BookingForm, extra = '') => `field${extra}${form.error(name) ? ' invalid' : ''}`;

  return (
    <div className="c-booking" style={{ display: 'contents' }}>
      <section className="section booking" id="reservar" aria-labelledby="booking-title">
        <div className="bg-grid" aria-hidden="true"></div>
        <div className="container">
          <div className="section-head">
            <span className="eyebrow" data-reveal="blur">Reserva en línea</span>
            <h2 className="section-title" id="booking-title" data-reveal="up">
              Agenda tu visita técnica <span className="text-fire">en 1 minuto</span>
            </h2>
            <p data-reveal="up" style={delay(100)}>
              Elige el servicio, la fecha y la hora. Te confirmamos por WhatsApp y recibes un código para seguir tu cita.
            </p>
          </div>

          <div className="wizard" ref={card} data-reveal="zoom" style={delay(150)}>
            {step < 3 && (
              <ol className="stepper" aria-label="Pasos de la reserva">
                {STEPS.map((s, i) => (
                  <li key={s} className={[step > i ? 'done' : '', step === i ? 'current' : ''].filter(Boolean).join(' ')}>
                    <button type="button" onClick={() => goTo(i)} disabled={i > step} aria-current={step === i ? 'step' : undefined}>
                      <span className="dot">{step > i ? <Icon name="check" size={16} stroke={3} /> : i + 1}</span>
                      <span className="lbl">{s}</span>
                    </button>
                  </li>
                ))}
                <span className="track" aria-hidden="true"><span style={{ transform: `scaleX(${step / 2})` }}></span></span>
              </ol>
            )}

            <div className="panes">
              {step === 0 && (
                <div className="pane" aria-live="polite">
                  <h3>¿Qué servicio necesitas?</h3>
                  <div className="services">
                    {serviceOptions.map((s, i) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`svc${service === s.id ? ' selected' : ''}`}
                        style={{ ['--i' as string]: i }}
                        onClick={() => chooseService(s.id)}
                        aria-pressed={service === s.id}
                        data-ripple
                      >
                        <span className={`ic${s.id === 'EMERGENCIA' ? ' urgent' : ''}`}><Icon name={s.icon} size={24} /></span>
                        <span>{s.label}</span>
                        <span className="chk"><Icon name="check" size={14} stroke={3} /></span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="pane two-col">
                  <div className="calendar">
                    <div className="cal-head">
                      <button type="button" onClick={() => changeMonth(-1)} disabled={!canGoPrev} aria-label="Mes anterior"><Icon name="chevronLeft" /></button>
                      <strong aria-live="polite">{monthLabel}</strong>
                      <button type="button" onClick={() => changeMonth(1)} disabled={!canGoNext} aria-label="Mes siguiente"><Icon name="chevronRight" /></button>
                    </div>
                    <div className="dow">{WEEKDAYS_SHORT.map((d) => <span key={d}>{d}</span>)}</div>
                    <div key={monthLabel} className={`days ${monthAnim}`} role="grid">
                      {cells.map((c, i) =>
                        c ? (
                          <button
                            key={i}
                            type="button"
                            className={['day', c.today ? 'today' : '', date === c.iso ? 'selected' : ''].filter(Boolean).join(' ')}
                            disabled={c.disabled}
                            onClick={() => pickDate(c.iso)}
                            aria-label={longDate(c.iso)}
                            aria-pressed={date === c.iso}
                          >
                            {c.day}
                          </button>
                        ) : (
                          <span key={i}></span>
                        ),
                      )}
                    </div>
                    <p className="note"><Icon name="clock" size={16} /> Lunes a sábado. Domingos y feriados solo emergencias por WhatsApp.</p>
                  </div>

                  <div className="slots">
                    <h3>{date ? `Horarios del ${longDate(date)}` : 'Elige un día del calendario'}</h3>
                    {!date ? (
                      <div className="placeholder">
                        <Icon name="calendar" size={46} stroke={1.4} />
                        <p>Selecciona una fecha para ver los horarios disponibles.</p>
                      </div>
                    ) : slotsLoading ? (
                      <div className="slot-grid">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((s) => <span key={s} className="skeleton sk"></span>)}</div>
                    ) : dayClosed ? (
                      <p className="placeholder">Ese día no atendemos reservas. Elige otra fecha.</p>
                    ) : (
                      <>
                        {offline && (
                          <p className="warn">
                            No pudimos consultar la disponibilidad en este momento. Los horarios son referenciales y te confirmaremos por WhatsApp.
                          </p>
                        )}
                        <div className="slot-grid">
                          {slots.map((s, i) => (
                            <button
                              key={s.time}
                              type="button"
                              className={`slot${time === s.time ? ' selected' : ''}`}
                              style={{ ['--i' as string]: i }}
                              disabled={!s.available}
                              onClick={() => setTime(s.time)}
                              aria-pressed={time === s.time}
                            >
                              {prettyTime(s.time)}
                              {!s.available && <small>Ocupado</small>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="nav-row">
                      <button type="button" className="btn btn-outline" onClick={() => goTo(0)}><Icon name="arrowLeft" size={18} /> Atrás</button>
                      <button type="button" className="btn btn-primary" disabled={!time} onClick={() => goTo(2)} data-ripple>
                        Continuar <Icon name="arrowRight" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="pane two-col">
                  <form className="data" onSubmit={submit} noValidate>
                    <h3>Tus datos de contacto</h3>
                    <div className="row">
                      <div className={fieldClass('name')}>
                        <input id="bk-name" autoComplete="name" {...field('name')} aria-describedby="bk-name-e" />
                        <label htmlFor="bk-name">Nombre completo *</label>
                        {form.error('name') && <span className="error" id="bk-name-e">{form.error('name')}</span>}
                      </div>
                      <div className={fieldClass('phone')}>
                        <input id="bk-phone" type="tel" autoComplete="tel" inputMode="tel" {...field('phone')} aria-describedby="bk-phone-e" />
                        <label htmlFor="bk-phone">Teléfono / WhatsApp *</label>
                        {form.error('phone') && <span className="error" id="bk-phone-e">{form.error('phone')}</span>}
                      </div>
                    </div>
                    <div className={fieldClass('email')}>
                      <input id="bk-email" type="email" autoComplete="email" {...field('email')} />
                      <label htmlFor="bk-email">Correo (opcional)</label>
                      {form.error('email') && <span className="error">{form.error('email')}</span>}
                    </div>
                    <div className="row">
                      <div className={fieldClass('address', ' grow')}>
                        <input id="bk-address" autoComplete="street-address" {...field('address')} />
                        <label htmlFor="bk-address">Dirección del servicio *</label>
                        {form.error('address') && <span className="error">{form.error('address')}</span>}
                      </div>
                      <div className="field">
                        <input id="bk-district" autoComplete="address-level2" {...field('district')} />
                        <label htmlFor="bk-district">Distrito</label>
                      </div>
                    </div>
                    <div className={fieldClass('description')}>
                      <textarea id="bk-desc" maxLength={1000} {...field('description')}></textarea>
                      <label htmlFor="bk-desc">Cuéntanos el problema o lo que necesitas</label>
                      <small className="count">{form.values.description.length}/1000</small>
                    </div>
                    <input
                      className="honeypot"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={form.values.website}
                      onChange={(e) => form.set('website', e.target.value)}
                    />
                    <label className={`consent${form.error('privacyAccepted') ? ' invalid' : ''}`}>
                      <input type="checkbox" checked={form.values.privacyAccepted} onChange={(e) => form.set('privacyAccepted', e.target.checked)} />
                      <span>
                        Acepto la <Link to="/privacidad" target="_blank">política de privacidad</Link> y que me contacten para coordinar la visita. *
                      </span>
                    </label>
                    {form.error('privacyAccepted') && <p className="error-inline">{form.error('privacyAccepted')}</p>}

                    <div className="nav-row">
                      <button type="button" className="btn btn-outline" onClick={() => goTo(1)}><Icon name="arrowLeft" size={18} /> Atrás</button>
                      <button type="submit" className="btn btn-accent" disabled={submitting} data-ripple>
                        {submitting ? <><span className="spinner"></span> Reservando...</> : <>Confirmar reserva <Icon name="check" size={18} stroke={2.6} /></>}
                      </button>
                    </div>
                    {submitFailed && (
                      <div className="fallback">
                        <p>¿Problemas para reservar? Envíanos tus datos por WhatsApp y te agendamos al instante.</p>
                        <a className="btn btn-whatsapp btn-sm" href={whatsappSummary()} target="_blank" rel="noopener">
                          <Icon name="whatsapp" size={18} /> Enviar por WhatsApp
                        </a>
                      </div>
                    )}
                  </form>

                  <aside className="summary" aria-label="Resumen de la reserva">
                    <h4>Resumen</h4>
                    <dl>
                      <div><dt><Icon name="wrench" size={18} /> Servicio</dt><dd>{serviceLabel}</dd></div>
                      <div><dt><Icon name="calendar" size={18} /> Fecha</dt><dd>{date ? longDate(date) : ''}</dd></div>
                      <div><dt><Icon name="clock" size={18} /> Hora</dt><dd>{time ? prettyTime(time) : ''}</dd></div>
                    </dl>
                    <p>Un asesor te escribirá para confirmar la visita y el costo antes de ir.</p>
                  </aside>
                </div>
              )}

              {step === 3 && result && (
                <div className="pane success" role="status">
                  <div className="check-anim" aria-hidden="true">
                    <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" /><path d="m24 41 11 11 22-24" /></svg>
                  </div>
                  <h3>¡Reserva registrada!</h3>
                  <p>
                    Te contactaremos para confirmar tu visita del <strong>{longDate(result.date)}</strong> a las <strong>{prettyTime(result.time)}</strong>
                  </p>
                  <button type="button" className="code" onClick={copyCode} title="Copiar código">
                    <small>Tu código de reserva</small>
                    <strong>{result.code}</strong>
                    <span>Toca para copiar</span>
                  </button>
                  <div className="actions">
                    <a className="btn btn-whatsapp" href={whatsappSummary()} target="_blank" rel="noopener"><Icon name="whatsapp" size={20} /> Confirmar por WhatsApp</a>
                    <button type="button" className="btn btn-outline" onClick={downloadIcs}><Icon name="download" size={18} /> Agregar a mi calendario</button>
                    <Link className="btn btn-outline" to={`/seguimiento?codigo=${result.code}`}><Icon name="ticket" size={18} /> Seguir mi reserva</Link>
                  </div>
                  <button type="button" className="again" onClick={reset}>Hacer otra reserva</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

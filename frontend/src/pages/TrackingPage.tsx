import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { api, describeError, type BookingStatus, type BookingTracking } from '../core/api';
import { whatsappLink } from '../core/site.data';
import { longDate, prettyTime } from '../shared/dates';
import { Icon } from '../shared/Icon';

const FLOW: { status: BookingStatus; label: string; text: string }[] = [
  { status: 'PENDIENTE', label: 'Recibida', text: 'Registramos tu solicitud.' },
  { status: 'CONFIRMADA', label: 'Confirmada', text: 'Un asesor confirmó tu visita.' },
  { status: 'EN_PROCESO', label: 'En proceso', text: 'El técnico está trabajando.' },
  { status: 'COMPLETADA', label: 'Completada', text: '¡Servicio terminado!' },
];

const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EN_PROCESO: 'En proceso',
  COMPLETADA: 'Completada',
  CANCELADA: 'Cancelada',
};

export function TrackingPage() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState((params.get('codigo') ?? '').toUpperCase());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BookingTracking | null>(null);
  const stepIndex = FLOW.findIndex((f) => f.status === result?.status);

  const search = async (value = code) => {
    const c = value.trim();
    if (!c) return;
    setLoading(true);
    setError('');
    setParams({ codigo: c }, { replace: true });
    try {
      setResult(await api.trackBooking(c));
    } catch (err) {
      setResult(null);
      setError(describeError(err).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = params.get('codigo');
    if (initial) search(initial.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="c-tracking-page">
      <div className="container narrow">
        <div className="page-head">
          <span className="eyebrow">Seguimiento</span>
          <h1 className="section-title">Sigue tu <span className="text-gradient">reserva</span></h1>
          <p>Ingresa el código que recibiste al reservar (por ejemplo, ACS-7KQ2MX).</p>
        </div>

        <form className="search card" onSubmit={(e) => { e.preventDefault(); search(); }}>
          <label htmlFor="code" className="sr-only">Código de reserva</label>
          <Icon name="ticket" size={22} />
          <input id="code" name="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ACS-XXXXXX" autoComplete="off" maxLength={12} required />
          <button className="btn btn-primary" type="submit" disabled={loading || code.trim().length < 5} data-ripple>
            {loading ? <span className="spinner"></span> : 'Buscar'}
          </button>
        </form>

        {error && <p className="error-box" role="alert"><Icon name="close" size={18} /> {error}</p>}

        {result && (
          <div className="result card" role="status">
            <div className="top">
              <div>
                <small>Reserva</small>
                <h2>{result.code}</h2>
              </div>
              <span className={`pill ${result.status.toLowerCase()}`}>{STATUS_LABEL[result.status]}</span>
            </div>
            <dl>
              <div><dt>Servicio</dt><dd>{result.service}</dd></div>
              <div><dt>Fecha</dt><dd className="cap">{longDate(result.date)}</dd></div>
              <div><dt>Hora</dt><dd>{prettyTime(result.time)}</dd></div>
            </dl>

            {result.status === 'CANCELADA' ? (
              <p className="cancel">Esta reserva fue cancelada. Si fue un error, escríbenos y la reprogramamos.</p>
            ) : (
              <ol className="flow">
                {FLOW.map((f, i) => (
                  <li key={f.status} className={[i <= stepIndex ? 'done' : '', i === stepIndex ? 'now' : ''].filter(Boolean).join(' ')} style={{ ['--i' as string]: i }}>
                    <span className="dot">{i <= stepIndex && <Icon name="check" size={14} stroke={3} />}</span>
                    <div><strong>{f.label}</strong><small>{f.text}</small></div>
                  </li>
                ))}
              </ol>
            )}
            <a className="btn btn-whatsapp btn-sm" href={whatsappLink(`Hola AIRCONSOLUTION SERVICES SAC, quisiera consultar por mi reserva ${result.code}.`)} target="_blank" rel="noopener">
              <Icon name="whatsapp" size={18} /> Consultar por WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';

import {
  ApiError,
  api,
  describeError,
  type AdminBooking,
  type AdminStats,
  type BookingStatus,
  type ContactMessage,
  type Page,
  type Quote,
  type Subscriber,
} from '../core/api';
import { ui } from '../core/ui';
import { CountUp } from '../shared/CountUp';
import { longDate, prettyTime } from '../shared/dates';
import { dmy, dmyHm, download } from '../shared/format';
import { Icon } from '../shared/Icon';
import { Invoicing } from './admin/Invoicing';
import { Quotes } from './admin/Quotes';

const SESSION_KEY = 'acs-admin';
const STATUSES: BookingStatus[] = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
type Tab = 'reservas' | 'mensajes' | 'suscriptores' | 'cotizaciones' | 'facturacion';

function whatsapp(phone: string, code: string): string {
  const digits = phone.replace(/\D/g, '');
  const full = digits.length === 9 ? `51${digits}` : digits;
  const text = code ? `Hola, le escribimos de AIRCONSOLUTION SERVICES SAC por su reserva ${code}.` : 'Hola, le escribimos de AIRCONSOLUTION SERVICES SAC por su consulta.';
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

/** Panel interno: reservas, mensajes, suscriptores, cotizaciones y facturación. Protegido por usuario y contraseña en el backend. */
export function AdminPage() {
  const [auth, setAuth] = useState<string | null>(() => sessionStorage.getItem(SESSION_KEY));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [tab, setTab] = useState<Tab>('reservas');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [filter, setFilter] = useState<BookingStatus | ''>('');
  const [bookings, setBookings] = useState<Page<AdminBooking> | null>(null);
  const [messages, setMessages] = useState<Page<ContactMessage> | null>(null);
  const [subscribers, setSubscribers] = useState<Page<Subscriber> | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [billing, setBilling] = useState<AdminBooking | null>(null);
  const [quoting, setQuoting] = useState<AdminBooking | null>(null);
  const [billingQuote, setBillingQuote] = useState<Quote | null>(null);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuth(null);
  }, []);

  const handle = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        ui.toast('error', 'Sesión expirada', 'Vuelve a ingresar.');
      } else {
        ui.toast('error', 'Error', describeError(err).message);
      }
    },
    [logout],
  );

  const loadStats = useCallback((a: string) => api.adminStats(a).then(setStats, handle), [handle]);
  const loadBookings = useCallback(
    (a: string, status: BookingStatus | '', page: number) =>
      api.adminBookings(a, status, page).then((p) => {
        setNotes((n) => ({ ...n, ...Object.fromEntries(p.items.map((b) => [b.id, b.adminNotes ?? ''])) }));
        setBookings(p);
      }, handle),
    [handle],
  );
  const loadMessages = useCallback((a: string, page: number) => api.adminContacts(a, page).then(setMessages, handle), [handle]);

  const loadAll = useCallback(
    (a: string) => {
      loadStats(a);
      loadBookings(a, filter, 0);
      loadMessages(a, 0);
      api.adminSubscribers(a).then(setSubscribers, handle);
    },
    [filter, handle, loadBookings, loadMessages, loadStats],
  );

  useEffect(() => {
    if (auth) loadAll(auth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = btoa(unescape(encodeURIComponent(`${username}:${password}`)));
    setLoggingIn(true);
    try {
      await api.adminMe(token);
      setPassword('');
      sessionStorage.setItem(SESSION_KEY, token);
      setAuth(token);
    } catch (err) {
      const unauthorized = err instanceof ApiError && err.status === 401;
      ui.toast('error', unauthorized ? 'Usuario o contraseña incorrectos' : 'No se pudo ingresar', unauthorized ? undefined : describeError(err).message);
    } finally {
      setLoggingIn(false);
    }
  };

  const changeFilter = (f: BookingStatus | '') => {
    setFilter(f);
    if (auth) loadBookings(auth, f, 0);
  };

  const updateStatus = (b: AdminBooking, status: BookingStatus) => {
    if (!auth) return;
    api.adminUpdateStatus(auth, b.id, status, notes[b.id] ?? null).then((updated) => {
      setBookings((p) => p && { ...p, items: p.items.map((x) => (x.id === updated.id ? updated : x)) });
      ui.toast('success', `Reserva ${updated.code}`, `Estado: ${updated.status.replace('_', ' ').toLowerCase()}`);
      loadStats(auth);
    }, handle);
  };

  const markRead = (m: ContactMessage) => {
    if (!auth) return;
    api.adminMarkRead(auth, m.id).then((updated) => {
      setMessages((p) => p && { ...p, items: p.items.map((x) => (x.id === updated.id ? updated : x)) });
      loadStats(auth);
    }, handle);
  };

  /** Descarga las reservas visibles en CSV para abrirlas en Excel. */
  const exportCsv = () => {
    const rows = bookings?.items ?? [];
    const header = ['Código', 'Fecha', 'Hora', 'Servicio', 'Estado', 'Nombre', 'Teléfono', 'Correo', 'Dirección', 'Distrito', 'Descripción', 'Notas'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows.map((b) => [b.code, b.date, b.time, b.service, b.status, b.name, b.phone, b.email, b.address, b.district, b.description, b.adminNotes])]
      .map((r) => r.map(esc).join(';'))
      .join('\r\n');
    download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `reservas-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const openTab = (t: Tab) => {
    if (t === 'cotizaciones') setQuoting(null);
    if (t === 'facturacion') {
      setBilling(null);
      setBillingQuote(null);
    }
    setTab(t);
  };

  if (!auth) {
    return (
      <div className="c-admin-page">
        <div className="container">
          <form className="card login" onSubmit={login}>
            <h1>Panel AIRCONSOLUTION SERVICES SAC</h1>
            <p>Ingresa con tu usuario de administrador.</p>
            <div className="field">
              <input id="adm-user" name="user" value={username} onChange={(e) => setUsername(e.target.value)} placeholder=" " autoComplete="username" required />
              <label htmlFor="adm-user">Usuario</label>
            </div>
            <div className="field">
              <input id="adm-pass" name="pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder=" " autoComplete="current-password" required />
              <label htmlFor="adm-pass">Contraseña</label>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loggingIn || !username || !password}>
              {loggingIn ? <span className="spinner"></span> : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs: [Tab, string][] = [
    ['reservas', 'Reservas'],
    ['mensajes', 'Mensajes'],
    ['suscriptores', 'Suscriptores'],
    ['cotizaciones', 'Cotizaciones'],
    ['facturacion', 'Facturación'],
  ];

  return (
    <div className="c-admin-page">
      <div className="container">
        <div className="bar">
          <h1>Panel de <span className="text-gradient">reservas</span></h1>
          <div className="actions">
            <button className="btn btn-outline btn-sm" type="button" onClick={() => loadAll(auth)}><Icon name="refresh" size={16} /> Actualizar</button>
            <button className="btn btn-outline btn-sm" type="button" onClick={logout}><Icon name="logout" size={16} /> Salir</button>
          </div>
        </div>

        {stats && (
          <div className="kpis">
            <div className="kpi hl"><strong><CountUp value={stats.upcomingBookings} duration={900} /></strong><span>Próximas visitas</span></div>
            <div className="kpi"><strong><CountUp value={stats.bookingsByStatus.PENDIENTE} duration={900} /></strong><span>Por confirmar</span></div>
            <div className="kpi"><strong><CountUp value={stats.totalBookings} duration={900} /></strong><span>Reservas totales</span></div>
            <div className="kpi"><strong><CountUp value={stats.unreadMessages} duration={900} /></strong><span>Mensajes sin leer</span></div>
            <div className="kpi"><strong><CountUp value={stats.subscribers} duration={900} /></strong><span>Suscriptores</span></div>
          </div>
        )}

        <div className="tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" className={tab === id ? 'active' : ''} aria-selected={tab === id} onClick={() => openTab(id)}>
              {label}
              {id === 'mensajes' && !!stats?.unreadMessages && <span className="badge">{stats.unreadMessages}</span>}
            </button>
          ))}
        </div>

        {tab === 'reservas' && (
          <>
            <div className="bar">
              <div className="filters">
                <button type="button" className={filter === '' ? 'active' : ''} onClick={() => changeFilter('')}>Todas</button>
                {STATUSES.map((s) => (
                  <button key={s} type="button" className={filter === s ? 'active' : ''} onClick={() => changeFilter(s)}>{s.replace('_', ' ')}</button>
                ))}
              </div>
              <button className="btn btn-outline btn-sm" type="button" onClick={exportCsv}><Icon name="download" size={16} /> Exportar CSV</button>
            </div>
            {bookings && (
              <>
                <div className="list">
                  {bookings.items.map((b) => (
                    <div key={b.id} className="row">
                      <div>
                        <span className="code">{b.code}</span> <span className={`pill ${b.status}`}>{b.status.replace('_', ' ')}</span>
                        <h3>{b.service}</h3>
                        <p className="when">{longDate(b.date)} · {prettyTime(b.time)}</p>
                        <p className="muted">Recibida {dmyHm(b.createdAt)}</p>
                      </div>
                      <div>
                        <strong>{b.name}</strong>
                        <p><a href={whatsapp(b.phone, b.code)} target="_blank" rel="noopener">{b.phone}</a></p>
                        {b.email && <p><a href={`mailto:${b.email}`}>{b.email}</a></p>}
                        <p className="muted">{b.address}{b.district && `, ${b.district}`}</p>
                        {b.description && <p className="muted">“{b.description}”</p>}
                      </div>
                      <div className="ctrl">
                        <label className="sr-only" htmlFor={`st${b.id}`}>Estado</label>
                        <select id={`st${b.id}`} value={b.status} onChange={(e) => updateStatus(b, e.target.value as BookingStatus)}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                        <label className="sr-only" htmlFor={`nt${b.id}`}>Notas internas</label>
                        <textarea
                          id={`nt${b.id}`}
                          value={notes[b.id] ?? ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [b.id]: e.target.value }))}
                          placeholder="Notas internas (técnico asignado, costo...)"
                        ></textarea>
                        <button className="btn btn-outline btn-sm" type="button" onClick={() => updateStatus(b, b.status)}>Guardar notas</button>
                        <div className="row-actions">
                          <button className="btn btn-outline btn-sm" type="button" onClick={() => { setQuoting({ ...b }); setTab('cotizaciones'); }}>Cotizar</button>
                          <button className="btn btn-primary btn-sm" type="button" onClick={() => { setBillingQuote(null); setBilling({ ...b }); setTab('facturacion'); }}>
                            <Icon name="ticket" size={16} /> Facturar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {bookings.items.length === 0 && <p className="empty">No hay reservas con este filtro.</p>}
                </div>
                {bookings.totalPages > 1 && (
                  <div className="pager">
                    <button className="btn btn-outline btn-sm" type="button" disabled={bookings.page === 0} onClick={() => loadBookings(auth, filter, bookings.page - 1)}>Anterior</button>
                    <span>{bookings.page + 1} / {bookings.totalPages}</span>
                    <button className="btn btn-outline btn-sm" type="button" disabled={bookings.page + 1 >= bookings.totalPages} onClick={() => loadBookings(auth, filter, bookings.page + 1)}>Siguiente</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'mensajes' && messages && (
          <>
            <div className="list">
              {messages.items.map((m) => (
                <div key={m.id} className={`row msg${m.read ? '' : ' unread'}`}>
                  <div>
                    <strong>{m.name}</strong>
                    <p><a href={whatsapp(m.phone, '')} target="_blank" rel="noopener">{m.phone}</a></p>
                    {m.email && <p><a href={`mailto:${m.email}`}>{m.email}</a></p>}
                    <p className="muted">{dmyHm(m.createdAt)}</p>
                  </div>
                  <p>{m.message}</p>
                  <div className="ctrl">
                    {!m.read ? (
                      <button className="btn btn-outline btn-sm" type="button" onClick={() => markRead(m)}><Icon name="check" size={16} /> Marcar como leído</button>
                    ) : (
                      <span className="muted">Leído</span>
                    )}
                  </div>
                </div>
              ))}
              {messages.items.length === 0 && <p className="empty">Aún no hay mensajes.</p>}
            </div>
            {messages.totalPages > 1 && (
              <div className="pager">
                <button className="btn btn-outline btn-sm" type="button" disabled={messages.page === 0} onClick={() => loadMessages(auth, messages.page - 1)}>Anterior</button>
                <span>{messages.page + 1} / {messages.totalPages}</span>
                <button className="btn btn-outline btn-sm" type="button" disabled={messages.page + 1 >= messages.totalPages} onClick={() => loadMessages(auth, messages.page + 1)}>Siguiente</button>
              </div>
            )}
          </>
        )}

        {tab === 'cotizaciones' && (
          <Quotes
            auth={auth}
            fromBooking={quoting}
            onUnauthorized={logout}
            onBill={(q) => { setBilling(null); setBillingQuote({ ...q }); setTab('facturacion'); }}
          />
        )}

        {tab === 'facturacion' && <Invoicing auth={auth} fromBooking={billing} fromQuote={billingQuote} onUnauthorized={logout} />}

        {tab === 'suscriptores' && subscribers && (
          <ul className="subs">
            {subscribers.items.map((s) => (
              <li key={s.id}><a href={`mailto:${s.email}`}>{s.email}</a><span className="muted">{dmy(s.createdAt)}</span></li>
            ))}
            {subscribers.items.length === 0 && <p className="empty">Aún no hay suscriptores.</p>}
          </ul>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ApiError,
  api,
  describeError,
  type AgendaBooking,
  type AgendaInput,
  type BookingStatus,
  type Client,
  type ClientInput,
} from '../../core/api';
import { bookableServices, type ServiceId } from '../../core/site.data';
import { ui } from '../../core/ui';
import { Icon } from '../../shared/Icon';

/*
 * Agenda del equipo: la ruta del día (citas de la web y las que agenda el equipo), los mensajes y
 * reservas que esperan respuesta, los mantenimientos que toca recordar y la ficha de cada cliente.
 */

type View = 'hoy' | 'proximas' | 'mantenimientos' | 'clientes';
const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDIENTE: 'Por confirmar', CONFIRMADA: 'Confirmada', EN_PROCESO: 'En camino', COMPLETADA: 'Hecha', CANCELADA: 'Cancelada',
};
const OPEN: BookingStatus[] = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO'];
const FIRMA = 'AIRCONSOLUTION SERVICES SAC · 985 899 731';
const TIMES = Array.from({ length: 27 }, (_, i) => `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

// ---------- fechas (hora de Lima en el celular del equipo) ----------
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const addMonths = (s: string, n: number) => {
  const d = parse(s); const day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return ymd(d);
};
const diffDays = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'];
const shortDate = (s: string) => { const d = parse(s); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };
const dayName = (s: string) => { const d = parse(s); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
const soles = (n: number | null) => (n ? `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '');
const ago = (iso: string) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `hace ${h} h` : `hace ${Math.round(h / 24)} días`;
};

// ---------- enlaces ----------
const waNumber = (t: string | null) => { let d = (t ?? '').replace(/\D/g, ''); if (d.length === 9 && d.startsWith('9')) d = '51' + d; return d.length >= 9 ? d : ''; };
const waLink = (t: string | null, msg: string) => { const n = waNumber(t); return n ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : ''; };
const mapsLink = (address: string | null, district: string | null) => {
  const q = [address, district, 'Lima'].filter(Boolean).join(', ');
  return address || district ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
};
/** Abre Google Calendar con la cita lista: el celular avisa con alarma, hora y dirección. */
function calendarLink(b: AgendaBooking): string {
  const [hh, mm] = b.time.split(':').map(Number);
  const start = parse(b.date); start.setHours(hh, mm, 0, 0);
  const end = new Date(start.getTime() + 2 * 3_600_000);
  const f = (d: Date) => `${ymd(d).replace(/-/g, '')}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const details = [`Cliente: ${b.name}`, `Teléfono: ${b.phone}`, b.technician && `Técnico: ${b.technician}`, b.amount && `Monto: ${soles(b.amount)}`,
    b.description && `Detalle: ${b.description}`, mapsLink(b.address, b.district) && `Cómo llegar: ${mapsLink(b.address, b.district)}`].filter(Boolean).join('\n');
  const p = new URLSearchParams({ action: 'TEMPLATE', text: `${b.service} – ${b.name}`, dates: `${f(start)}/${f(end)}`, ctz: 'America/Lima', details });
  if (b.address || b.district) p.set('location', [b.address, b.district, 'Lima'].filter(Boolean).join(', '));
  return `https://calendar.google.com/calendar/render?${p}`;
}

const nextMaintenance = (c: Client) => {
  const base = c.lastMaintenance || c.installedOn;
  return base ? addMonths(base, c.frequencyMonths || 6) : null;
};

const emptyAppointment = (date = today()): AgendaInput => ({
  name: '', phone: '', address: '', district: '', service: 'MANTENIMIENTO', description: '', date, time: '09:00',
  status: 'CONFIRMADA', adminNotes: '', clientId: null, technician: '', amount: null,
});
const emptyClient = (): ClientInput => ({
  name: '', phone: '', district: '', address: '', equipment: '', installedOn: null, lastMaintenance: null, frequencyMonths: 6, lastReminder: null, notes: '',
});

export function Agenda({ auth, onUnauthorized, onChanged }: { auth: string; onUnauthorized: () => void; onChanged: () => void }) {
  const [view, setView] = useState<View>('hoy');
  const [items, setItems] = useState<AgendaBooking[] | null>(null);
  const [clients, setClients] = useState<Client[] | null>(null);
  const [editing, setEditing] = useState<{ id: number | null; data: AgendaInput; saveClient: boolean } | null>(null);
  const [editingClient, setEditingClient] = useState<{ id: number | null; data: ClientInput } | null>(null);
  const [justSaved, setJustSaved] = useState<AgendaBooking | null>(null);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fail = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) onUnauthorized();
    else ui.toast('error', 'No se guardó', describeError(err).message);
  }, [onUnauthorized]);

  const load = useCallback(() => {
    api.agenda(auth).then(setItems, fail);
    api.clients(auth).then(setClients, fail);
  }, [auth, fail]);
  useEffect(load, [load]);

  const hoy = today();
  const byClient = useMemo(() => new Map((clients ?? []).map((c) => [c.id, c])), [clients]);
  const sorted = useMemo(() => (items ?? []).slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)), [items]);
  const pendingWeb = sorted.filter((b) => b.status === 'PENDIENTE' && b.source === 'WEB');
  const late = pendingWeb.filter((b) => (Date.now() - new Date(b.createdAt).getTime()) / 3_600_000 >= 2);
  const reminders = useMemo(() => (clients ?? []).map((c) => {
    const next = nextMaintenance(c);
    if (!next) return null;
    const days = diffDays(hoy, next);
    const booked = sorted.find((b) => b.clientId === c.id && OPEN.includes(b.status) && b.date >= hoy && b.serviceId === 'MANTENIMIENTO');
    return { c, next, days, booked, level: days < 0 ? 'late' : days <= 30 ? 'soon' : 'ok' };
  }).filter((r): r is NonNullable<typeof r> => r !== null).sort((a, b) => a.days - b.days), [clients, sorted, hoy]);
  const toRemind = reminders.filter((r) => r.level !== 'ok' && !r.booked);

  // ---------- acciones ----------
  const save = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const data = { ...editing.data, amount: editing.data.amount ? Number(editing.data.amount) : null };
      if (!data.clientId && editing.saveClient) {
        const c = await api.createClient(auth, { ...emptyClient(), name: data.name, phone: data.phone || null, district: data.district || null, address: data.address || null });
        data.clientId = c.id;
      }
      const saved = editing.id ? await api.updateAppointment(auth, editing.id, data) : await api.createAppointment(auth, data);
      setEditing(null);
      setConfirmDelete(false);
      if (!editing.id) setJustSaved(saved);
      else ui.toast('success', 'Cita guardada');
      load();
      onChanged();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!editing?.id) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await api.deleteAppointment(auth, editing.id);
      setEditing(null);
      setConfirmDelete(false);
      ui.toast('success', 'Cita eliminada');
      load();
      onChanged();
    } catch (err) { fail(err); }
  };
  const setStatus = async (b: AgendaBooking, status: BookingStatus) => {
    try {
      await api.updateAppointment(auth, b.id, toInput(b, { status }));
      const c = b.clientId ? byClient.get(b.clientId) : undefined;
      if (status === 'COMPLETADA' && c && (b.serviceId === 'MANTENIMIENTO' || b.serviceId === 'AIRE_ACONDICIONADO')) {
        ui.toast('success', 'Trabajo hecho', `Próximo mantenimiento de ${c.name}: ${shortDate(addMonths(b.date, c.frequencyMonths || 6))}`);
      } else ui.toast('success', STATUS_LABEL[status]);
      load();
      onChanged();
    } catch (err) { fail(err); }
  };
  const saveClient = async () => {
    if (!editingClient) return;
    setBusy(true);
    try {
      const d = editingClient.data;
      const data = { ...d, installedOn: d.installedOn || null, lastMaintenance: d.lastMaintenance || null, frequencyMonths: Number(d.frequencyMonths) || 6 };
      if (editingClient.id) await api.updateClient(auth, editingClient.id, data); else await api.createClient(auth, data);
      setEditingClient(null);
      setConfirmDelete(false);
      ui.toast('success', 'Cliente guardado');
      load();
    } catch (err) { fail(err); } finally { setBusy(false); }
  };
  const removeClient = async () => {
    if (!editingClient?.id) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    try {
      await api.deleteClient(auth, editingClient.id);
      setEditingClient(null);
      setConfirmDelete(false);
      ui.toast('success', 'Cliente eliminado');
      load();
    } catch (err) { fail(err); }
  };
  /** Guarda como cliente a quien reservó por la web, para recordarle su mantenimiento. */
  const linkClient = async (b: AgendaBooking) => {
    try {
      const digits = b.phone.replace(/\D/g, '').slice(-9);
      let c = (clients ?? []).find((x) => (x.phone ?? '').replace(/\D/g, '').slice(-9) === digits && digits.length === 9);
      c ??= await api.createClient(auth, { ...emptyClient(), name: b.name, phone: b.phone, district: b.district, address: b.address });
      await api.updateAppointment(auth, b.id, toInput(b, { clientId: c.id }));
      ui.toast('success', 'Guardado como cliente', c.name);
      load();
    } catch (err) { fail(err); }
  };
  const openNew = (preset: Partial<AgendaInput> = {}) => {
    setConfirmDelete(false);
    setEditing({ id: null, data: { ...emptyAppointment(), ...preset }, saveClient: !preset.clientId });
  };

  // ---------- tarjetas ----------
  const card = (b: AgendaBooking, withDate = false) => {
    const done = b.status === 'COMPLETADA' || b.status === 'CANCELADA';
    const map = mapsLink(b.address, b.district);
    const confirm = `Hola ${b.name} 👋, le saluda AIRCONSOLUTION SERVICES SAC. Le confirmamos su cita de ${b.service.toLowerCase()} el ${dayName(b.date)} a las ${b.time}. ¿Nos confirma por favor? ¡Gracias! ❄️`;
    const thanks = `¡Muchas gracias por su confianza, ${b.name}! 🙏 Fue un gusto atenderle. Si quedó contento(a), nos ayudaría mucho con una reseña en Google ⭐. Le escribiremos cuando le toque su próximo mantenimiento. ❄️ ${FIRMA}`;
    const clash = sorted.some((o) => o.id !== b.id && o.date === b.date && o.time === b.time && o.status !== 'CANCELADA' && (o.technician ?? '') === (b.technician ?? ''));
    return (
      <article key={b.id} className={`ag-card st-${b.status}${done ? ' done' : ''}`}>
        <div className="ag-head">
          <div className="ag-time">{b.time}</div>
          <div className="ag-main">
            <strong className="ag-who">{b.name}</strong>
            <div className="ag-meta">
              <span>{b.service}</span>
              {withDate && <span>{dayName(b.date)}</span>}
              {b.district && <span><Icon name="pin" size={13} /> {b.district}</span>}
              <span><Icon name="phone" size={13} /> {b.phone}</span>
              {b.technician && <span><Icon name="user" size={13} /> {b.technician}</span>}
              {!!b.amount && <span>{soles(b.amount)}</span>}
              {b.source === 'WEB' && <span className="ag-web">Reservó en la web {ago(b.createdAt)}</span>}
            </div>
          </div>
          <div className="ag-pills">
            {clash && <span className="ag-pill late">Choca con otra cita</span>}
            <span className={`ag-pill s-${b.status}`}>{STATUS_LABEL[b.status]}</span>
          </div>
        </div>
        {b.address && <p className="ag-note muted">{b.address}</p>}
        {b.description && <p className="ag-note">“{b.description}”</p>}
        {b.adminNotes && <p className="ag-note muted">Notas: {b.adminNotes}</p>}
        <div className="ag-actions">
          {!done && waLink(b.phone, confirm) && <a className="btn btn-sm ag-wa" href={waLink(b.phone, confirm)} target="_blank" rel="noopener"><Icon name="whatsapp" size={15} /> Confirmar</a>}
          {!done && map && <a className="btn btn-outline btn-sm" href={map} target="_blank" rel="noopener"><Icon name="pin" size={15} /> Cómo llegar</a>}
          {!done && <a className="btn btn-outline btn-sm" href={calendarLink(b)} target="_blank" rel="noopener"><Icon name="clock" size={15} /> Alarma en el celular</a>}
          {b.status === 'PENDIENTE' && <button className="btn btn-outline btn-sm" type="button" onClick={() => setStatus(b, 'CONFIRMADA')}>Confirmó</button>}
          {!done && <button className="btn btn-primary btn-sm" type="button" onClick={() => setStatus(b, 'COMPLETADA')}><Icon name="check" size={15} /> Trabajo hecho</button>}
          {b.status === 'COMPLETADA' && waLink(b.phone, thanks) && <a className="btn btn-sm ag-wa" href={waLink(b.phone, thanks)} target="_blank" rel="noopener"><Icon name="whatsapp" size={15} /> Agradecer y pedir reseña</a>}
          {!b.clientId && <button className="btn btn-outline btn-sm" type="button" onClick={() => linkClient(b)}><Icon name="user" size={15} /> Guardar como cliente</button>}
          <button className="btn btn-outline btn-sm" type="button" onClick={() => { setConfirmDelete(false); setEditing({ id: b.id, data: toInput(b), saveClient: false }); }}>Editar</button>
        </div>
      </article>
    );
  };

  if (!items || !clients) return <p className="empty">Cargando la agenda…</p>;

  const todays = sorted.filter((b) => b.date === hoy);
  const overdue = sorted.filter((b) => b.date < hoy && OPEN.includes(b.status));
  const tomorrow = sorted.filter((b) => b.date === addDays(hoy, 1) && b.status !== 'CANCELADA');
  const upcoming = sorted.filter((b) => b.date >= hoy && b.status !== 'CANCELADA');
  const q = query.trim().toLowerCase();
  const clientList = clients.filter((c) => !q || [c.name, c.phone, c.district, c.address, c.equipment].join(' ').toLowerCase().includes(q));

  const views: [View, string, number][] = [
    ['hoy', 'Hoy', todays.filter((b) => OPEN.includes(b.status)).length],
    ['proximas', 'Próximas citas', 0],
    ['mantenimientos', 'Mantenimientos', toRemind.length],
    ['clientes', 'Clientes', 0],
  ];

  return (
    <div className="c-agenda">
      <div className="bar">
        <div className="filters">
          {views.map(([id, label, n]) => (
            <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => setView(id)}>
              {label}{n > 0 && <span className="badge">{n}</span>}
            </button>
          ))}
        </div>
        {view === 'clientes'
          ? <button className="btn btn-primary btn-sm" type="button" onClick={() => { setConfirmDelete(false); setEditingClient({ id: null, data: emptyClient() }); }}>+ Nuevo cliente</button>
          : <button className="btn btn-primary btn-sm" type="button" onClick={() => openNew()}>+ Nueva cita</button>}
      </div>

      {view === 'hoy' && (
        <div className="ag-stack">
          <h2 className="ag-title">Hoy, {dayName(hoy)}</h2>
          {late.length > 0 && (
            <div className="ag-alert" role="status">
              <strong>⚠️ {late.length} {late.length === 1 ? 'cliente reservó' : 'clientes reservaron'} por la web hace más de 2 horas y espera{late.length === 1 ? '' : 'n'} tu confirmación.</strong>
              <span> Escríbeles por WhatsApp con el botón «Confirmar».</span>
            </div>
          )}
          {toRemind.length > 0 && (
            <button type="button" className="ag-alert soft" onClick={() => setView('mantenimientos')}>
              🔁 {toRemind.length} {toRemind.length === 1 ? 'cliente necesita' : 'clientes necesitan'} que le recuerdes su mantenimiento. Ver lista →
            </button>
          )}
          {overdue.length > 0 && (<><h3 className="ag-day">Quedaron pendientes de días anteriores</h3>{overdue.map((b) => card(b, true))}</>)}
          <h3 className="ag-day">Ruta de hoy <small>ordenada por hora</small></h3>
          {todays.length ? todays.map((b) => card(b)) : (
            <div className="ag-empty"><strong>No hay citas para hoy.</strong><span>Las reservas de la web y las que agendes aquí aparecen en orden de hora, con el botón para llegar en Google Maps.</span>
              <button className="btn btn-primary btn-sm" type="button" onClick={() => openNew({ date: hoy })}>+ Agendar cita para hoy</button></div>
          )}
          <h3 className="ag-day">Mañana <small>{dayName(addDays(hoy, 1))}</small></h3>
          {tomorrow.length ? tomorrow.map((b) => card(b)) : <p className="muted">Sin citas para mañana todavía.</p>}
          {pendingWeb.filter((b) => b.date > addDays(hoy, 1)).length > 0 && (
            <><h3 className="ag-day">Reservas de la web por confirmar</h3>{pendingWeb.filter((b) => b.date > addDays(hoy, 1)).map((b) => card(b, true))}</>
          )}
        </div>
      )}

      {view === 'proximas' && (
        <div className="ag-stack">
          {upcoming.length === 0 && <div className="ag-empty"><strong>No hay citas próximas.</strong><span>Cada cita nueva aparece aquí agrupada por día.</span></div>}
          {upcoming.map((b, i) => (
            <div key={b.id} className="ag-stack">
              {(i === 0 || upcoming[i - 1].date !== b.date) && (
                <h3 className="ag-day">{dayName(b.date)} <small>{b.date === hoy ? 'hoy' : diffDays(hoy, b.date) === 1 ? 'mañana' : `en ${diffDays(hoy, b.date)} días`}</small></h3>
              )}
              {card(b)}
            </div>
          ))}
        </div>
      )}

      {view === 'mantenimientos' && (
        <div className="ag-stack">
          <p className="muted">Se calcula solo con la fecha del último mantenimiento (o de la instalación) y cada cuántos meses le toca. Rojo: ya le tocaba. Naranja: le toca en los próximos 30 días.</p>
          {reminders.length === 0 && <div className="ag-empty"><strong>Aún no hay clientes con fecha de instalación o mantenimiento.</strong><span>Al terminar un trabajo con «Trabajo hecho», la fecha se guarda sola en la ficha del cliente.</span></div>}
          {reminders.map(({ c, next, days, booked, level }) => {
            const msg = `Hola ${c.name} 👋, le saluda AIRCONSOLUTION SERVICES SAC. Le recordamos que ${days < 0 ? 'ya le toca' : 'pronto le toca'} el mantenimiento de su aire acondicionado${c.equipment ? ` (${c.equipment})` : ''}. Así enfría mejor, gasta menos luz y evita averías. ¿Le agendamos una visita? 📅❄️`;
            const wa = waLink(c.phone, msg);
            return (
              <article key={c.id} className={`ag-card lv-${booked ? 'ok' : level}`}>
                <div className="ag-head">
                  <div className="ag-main">
                    <strong className="ag-who">{c.name}</strong>
                    <div className="ag-meta">
                      {c.equipment && <span>{c.equipment}</span>}
                      {c.district && <span><Icon name="pin" size={13} /> {c.district}</span>}
                      <span>Último: {shortDate((c.lastMaintenance || c.installedOn)!)}</span>
                      <span>Próximo: {shortDate(next)}</span>
                      {c.lastReminder && <span>Avisado el {shortDate(c.lastReminder)}</span>}
                    </div>
                  </div>
                  <span className={`ag-pill ${booked ? 'ok' : level}`}>{booked ? 'Ya tiene cita' : days < 0 ? `Atrasado ${-days} días` : days === 0 ? 'Le toca hoy' : `En ${days} días`}</span>
                </div>
                {booked && <p className="ag-note muted">Cita el {dayName(booked.date)} a las {booked.time}</p>}
                <div className="ag-actions">
                  {!booked && wa && <a className="btn btn-sm ag-wa" href={wa} target="_blank" rel="noopener" onClick={() => { api.clientReminded(auth, c.id).then(load, fail); }}><Icon name="whatsapp" size={15} /> Recordarle por WhatsApp</a>}
                  {!booked && !c.phone && <span className="muted">Agrega su teléfono para escribirle.</span>}
                  {!booked && <button className="btn btn-primary btn-sm" type="button" onClick={() => openNew({ clientId: c.id, name: c.name, phone: c.phone ?? '', district: c.district, address: c.address ?? '', service: 'MANTENIMIENTO', date: days > 0 ? next : hoy })}>Agendar mantenimiento</button>}
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => { setConfirmDelete(false); setEditingClient({ id: c.id, data: c }); }}>Ver cliente</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {view === 'clientes' && (
        <div className="ag-stack">
          <label className="sr-only" htmlFor="ag-buscar">Buscar cliente</label>
          <input id="ag-buscar" className="ag-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, teléfono o distrito" />
          {clientList.length === 0 && <div className="ag-empty"><strong>{q ? 'No encontré ese cliente.' : 'Aún no hay clientes.'}</strong><span>Registra a cada persona o empresa que atiendes para recordarle su mantenimiento.</span></div>}
          {clientList.map((c) => {
            const next = nextMaintenance(c);
            const visits = sorted.filter((b) => b.clientId === c.id).length;
            const lvl = next ? (diffDays(hoy, next) < 0 ? 'late' : diffDays(hoy, next) <= 30 ? 'soon' : 'ok') : '';
            return (
              <article key={c.id} className="ag-card">
                <div className="ag-head">
                  <div className="ag-main">
                    <strong className="ag-who">{c.name}</strong>
                    <div className="ag-meta">
                      {c.phone && <span><Icon name="phone" size={13} /> {c.phone}</span>}
                      {c.district && <span><Icon name="pin" size={13} /> {c.district}</span>}
                      {c.equipment && <span>{c.equipment}</span>}
                      <span>{visits} {visits === 1 ? 'cita' : 'citas'}</span>
                    </div>
                  </div>
                  {next && <span className={`ag-pill ${lvl}`}>Mant.: {shortDate(next)}</span>}
                </div>
                {c.notes && <p className="ag-note muted">{c.notes}</p>}
                <div className="ag-actions">
                  {waLink(c.phone, `Hola ${c.name} 👋, le saluda AIRCONSOLUTION SERVICES SAC.`) && <a className="btn btn-sm ag-wa" href={waLink(c.phone, `Hola ${c.name} 👋, le saluda AIRCONSOLUTION SERVICES SAC.`)} target="_blank" rel="noopener"><Icon name="whatsapp" size={15} /> WhatsApp</a>}
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => openNew({ clientId: c.id, name: c.name, phone: c.phone ?? '', district: c.district, address: c.address ?? '' })}>Agendar cita</button>
                  <button className="btn btn-outline btn-sm" type="button" onClick={() => { setConfirmDelete(false); setEditingClient({ id: c.id, data: c }); }}>Editar</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {editing && (
        <Sheet title={editing.id ? 'Editar cita' : 'Nueva cita'} onClose={() => setEditing(null)}>
          <form className="ag-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
            <Field label="Cliente">
              <input id="ag-c-name" list="ag-clientes" required minLength={3} value={editing.data.name} autoComplete="off"
                onChange={(e) => {
                  const name = e.target.value;
                  const c = clients.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
                  setEditing({ ...editing, data: c
                    ? { ...editing.data, name: c.name, clientId: c.id, phone: editing.data.phone || c.phone || '', district: editing.data.district || c.district, address: editing.data.address || c.address || '' }
                    : { ...editing.data, name, clientId: null } });
                }} />
              <datalist id="ag-clientes">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
            </Field>
            {!editing.data.clientId && editing.data.name.trim().length > 2 && (
              <label className="ag-check"><input id="ag-c-save" type="checkbox" checked={editing.saveClient} onChange={(e) => setEditing({ ...editing, saveClient: e.target.checked })} /> Guardar también como cliente (para recordarle su mantenimiento)</label>
            )}
            <div className="ag-grid">
              <Field label="Fecha"><input id="ag-c-date" type="date" required value={editing.data.date} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, date: e.target.value } })} /></Field>
              <Field label="Hora">
                <select id="ag-c-time" value={editing.data.time} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, time: e.target.value } })}>
                  {(TIMES.includes(editing.data.time) ? TIMES : [editing.data.time, ...TIMES]).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Servicio">
              <select id="ag-c-service" value={editing.data.service} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, service: e.target.value as ServiceId } })}>
                {bookableServices.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </Field>
            <div className="ag-grid">
              <Field label="Teléfono / WhatsApp"><input id="ag-c-phone" inputMode="tel" required value={editing.data.phone} placeholder="9XX XXX XXX" onChange={(e) => setEditing({ ...editing, data: { ...editing.data, phone: e.target.value } })} /></Field>
              <Field label="Técnico"><input id="ag-c-tech" list="ag-tecnicos" value={editing.data.technician ?? ''} placeholder="Quién va" onChange={(e) => setEditing({ ...editing, data: { ...editing.data, technician: e.target.value } })} />
                <datalist id="ag-tecnicos">{[...new Set(['Clever', ...sorted.map((b) => b.technician).filter(Boolean) as string[]])].map((t) => <option key={t} value={t} />)}</datalist></Field>
            </div>
            <div className="ag-grid">
              <Field label="Distrito"><input id="ag-c-district" value={editing.data.district ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, district: e.target.value } })} /></Field>
              <Field label="Monto (S/)"><input id="ag-c-amount" type="number" min="0" step="0.01" value={editing.data.amount ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, amount: e.target.value === '' ? null : Number(e.target.value) } })} /></Field>
            </div>
            <Field label="Dirección"><input id="ag-c-address" value={editing.data.address} placeholder="Calle, número, referencia" onChange={(e) => setEditing({ ...editing, data: { ...editing.data, address: e.target.value } })} /></Field>
            {editing.id && (
              <Field label="Estado">
                <select id="ag-c-status" value={editing.data.status} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, status: e.target.value as BookingStatus } })}>
                  {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </Field>
            )}
            <Field label="Qué necesita (equipos, falla…)"><textarea id="ag-c-desc" rows={2} value={editing.data.description ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, description: e.target.value } })} /></Field>
            <Field label="Notas internas"><textarea id="ag-c-notes" rows={2} value={editing.data.adminNotes ?? ''} onChange={(e) => setEditing({ ...editing, data: { ...editing.data, adminNotes: e.target.value } })} /></Field>
            <div className="ag-form-actions">
              {editing.id ? <button className="btn btn-outline btn-sm ag-danger" type="button" onClick={remove}>{confirmDelete ? 'Sí, eliminar la cita' : 'Eliminar'}</button> : <span />}
              <div className="ag-row">
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>{busy ? <span className="spinner"></span> : editing.id ? 'Guardar' : 'Agendar'}</button>
              </div>
            </div>
          </form>
        </Sheet>
      )}

      {editingClient && (
        <Sheet title={editingClient.id ? 'Cliente' : 'Nuevo cliente'} onClose={() => setEditingClient(null)}>
          <form className="ag-form" onSubmit={(e) => { e.preventDefault(); void saveClient(); }}>
            <Field label="Nombre o empresa"><input id="ag-k-name" required minLength={2} value={editingClient.data.name} onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, name: e.target.value } })} /></Field>
            <div className="ag-grid">
              <Field label="Teléfono / WhatsApp"><input id="ag-k-phone" inputMode="tel" value={editingClient.data.phone ?? ''} placeholder="9XX XXX XXX" onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, phone: e.target.value } })} /></Field>
              <Field label="Distrito"><input id="ag-k-district" value={editingClient.data.district ?? ''} onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, district: e.target.value } })} /></Field>
            </div>
            <Field label="Dirección"><input id="ag-k-address" value={editingClient.data.address ?? ''} onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, address: e.target.value } })} /></Field>
            <Field label="Equipos"><input id="ag-k-eq" value={editingClient.data.equipment ?? ''} placeholder="Ej.: 2 × LG Inverter 24 000 BTU" onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, equipment: e.target.value } })} /></Field>
            <div className="ag-grid">
              <Field label="Fecha de instalación"><input id="ag-k-inst" type="date" value={editingClient.data.installedOn ?? ''} onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, installedOn: e.target.value || null } })} /></Field>
              <Field label="Último mantenimiento"><input id="ag-k-last" type="date" value={editingClient.data.lastMaintenance ?? ''} onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, lastMaintenance: e.target.value || null } })} /></Field>
            </div>
            <Field label="¿Cada cuánto le toca mantenimiento?">
              <select id="ag-k-freq" value={editingClient.data.frequencyMonths} onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, frequencyMonths: Number(e.target.value) } })}>
                <option value={3}>Cada 3 meses (negocios con uso intenso)</option>
                <option value={4}>Cada 4 meses</option>
                <option value={6}>Cada 6 meses (lo normal)</option>
                <option value={12}>Cada 12 meses</option>
              </select>
            </Field>
            <p className="muted">{(() => { const n = nextMaintenance({ ...editingClient.data, id: 0, createdAt: '' } as Client); return n ? `Próximo mantenimiento: ${shortDate(n)}` : 'Pon la fecha de instalación o del último mantenimiento para calcular el próximo.'; })()}</p>
            <Field label="Notas"><textarea id="ag-k-notes" rows={2} value={editingClient.data.notes ?? ''} onChange={(e) => setEditingClient({ ...editingClient, data: { ...editingClient.data, notes: e.target.value } })} /></Field>
            {editingClient.id && (
              <div className="ag-history">
                <strong>Historial de citas</strong>
                {sorted.filter((b) => b.clientId === editingClient.id).reverse().map((b) => <span key={b.id} className="muted">{shortDate(b.date)} · {b.service} · {STATUS_LABEL[b.status]}{b.amount ? ` · ${soles(b.amount)}` : ''}</span>)}
                {!sorted.some((b) => b.clientId === editingClient.id) && <span className="muted">Sin citas todavía.</span>}
              </div>
            )}
            <div className="ag-form-actions">
              {editingClient.id ? <button className="btn btn-outline btn-sm ag-danger" type="button" onClick={removeClient}>{confirmDelete ? 'Sí, eliminar el cliente' : 'Eliminar'}</button> : <span />}
              <div className="ag-row">
                <button className="btn btn-outline btn-sm" type="button" onClick={() => setEditingClient(null)}>Cancelar</button>
                <button className="btn btn-primary btn-sm" type="submit" disabled={busy}>{busy ? <span className="spinner"></span> : 'Guardar'}</button>
              </div>
            </div>
          </form>
        </Sheet>
      )}

      {justSaved && (
        <Sheet title="✅ Cita agendada" onClose={() => setJustSaved(null)}>
          <div className="ag-form">
            <p><strong>{justSaved.name}</strong> · {dayName(justSaved.date)} a las {justSaved.time}{justSaved.district ? ` · ${justSaved.district}` : ''}</p>
            <p className="muted">Toca el botón para guardar la cita en Google Calendar. El celular te avisará con una alarma antes de la cita, con la dirección para llegar.</p>
            <a className="btn btn-primary" href={calendarLink(justSaved)} target="_blank" rel="noopener" onClick={() => setTimeout(() => setJustSaved(null), 300)}><Icon name="clock" size={18} /> Poner alarma en el celular</a>
            <button className="btn btn-outline" type="button" onClick={() => setJustSaved(null)}>Ahora no</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function toInput(b: AgendaBooking, patch: Partial<AgendaInput> = {}): AgendaInput {
  return {
    name: b.name, phone: b.phone, email: b.email, address: b.address, district: b.district, service: b.serviceId, description: b.description,
    date: b.date, time: b.time, status: b.status, adminNotes: b.adminNotes, clientId: b.clientId, technician: b.technician, amount: b.amount, ...patch,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="ag-field"><span>{label}</span>{children}</label>;
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div className="ag-veil" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ag-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="ag-sheet-head"><h2>{title}</h2><button className="ag-x" type="button" aria-label="Cerrar" onClick={onClose}><Icon name="close" size={20} /></button></div>
        {children}
      </div>
    </div>
  );
}

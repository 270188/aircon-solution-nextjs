/**
 * API de AIRCONSOLUTION SERVICES SAC en Netlify Functions (gratis y siempre encendida).
 *
 * Usa la misma base de datos PostgreSQL (Neon) que el servidor Spring Boot y responde con los
 * mismos formatos, así la página y el panel funcionan igual. Las cotizaciones y la facturación
 * electrónica siguen en el servidor de Render (ver netlify.toml).
 *
 * Variables de entorno (en Netlify): DATABASE_URL, ADMIN_USERS ("usuario:clave,usuario2:clave2") y, para entrar con
 * Google, GOOGLE_CLIENT_ID, ADMIN_GOOGLE_EMAILS (correos autorizados, separados por comas) y SESSION_SECRET.
 */
import { neon } from '@neondatabase/serverless';

// Sin DATABASE_URL la función responde 503 (ver abajo); la dirección de reemplazo solo evita que falle al cargar.
const sql = neon(process.env.DATABASE_URL || 'postgresql://sin-configurar:x@localhost/sin-configurar');
const ZONE = 'America/Lima';
const SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const CAPACITY = Number(process.env.BOOKING_SLOT_CAPACITY ?? 2);
const MAX_DAYS_AHEAD = 60;
const SERVICES: Record<string, string> = {
  AIRE_ACONDICIONADO: 'Instalación de Aire Acondicionado',
  MANTENIMIENTO: 'Mantenimiento Preventivo',
  REPARACION: 'Mantenimiento de Línea Blanca',
  ELECTRICIDAD: 'Instalaciones Eléctricas',
  ESTRUCTURAS: 'Estructuras Metálicas',
  BOMBAS: 'Servicio de Gasfitería',
  EMERGENCIA: 'Emergencia 24/7',
};
const STATUSES = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
const ACTIVE = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA'];
const PHONE = /^\+?[0-9 ()-]{7,20}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// ---------- respuestas ----------
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
class HttpError extends Error {
  constructor(readonly status: number, message: string, readonly errors?: Record<string, string>) {
    super(message);
  }
}
const bad = (errors: Record<string, string>) => new HttpError(400, 'Revisa los datos del formulario.', errors);

// ---------- fechas en hora de Lima ----------
function limaNow(): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}` };
}
const addDays = (d: string, n: number) => {
  const t = new Date(d + 'T12:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const isSunday = (d: string) => new Date(d + 'T12:00:00Z').getUTCDay() === 0;
function bookable(d: string): boolean {
  const today = limaNow().date;
  return DATE.test(d) && d >= today && d <= addDays(today, MAX_DAYS_AHEAD) && !isSunday(d);
}

// ---------- utilidades ----------
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const opt = (v: unknown) => str(v) || null;
const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));
function code(): string {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return 'ACS-' + Array.from(bytes, (b) => A[b % A.length]).join('');
}
async function uniqueCode(): Promise<string> {
  for (;;) {
    const c = code();
    const r = await sql`select 1 from bookings where code = ${c}`;
    if (!r.length) return c;
  }
}
function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
function basicOk(header: string): boolean {
  const users = (process.env.ADMIN_USERS ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter((u) => u.includes(':'));
  if (!users.length || !header.startsWith('Basic ')) return false;
  let given = '';
  try {
    given = new TextDecoder().decode(Uint8Array.from(atob(header.slice(6)), (c) => c.charCodeAt(0)));
  } catch {
    return false;
  }
  return users.some((u) => timingSafeEqual(u, given));
}

// ---------- ingreso con Google ----------
// La página manda el token de Google; aquí se comprueba con Google, se revisa que el correo esté autorizado
// (ADMIN_GOOGLE_EMAILS) y se entrega una sesión firmada con SESSION_SECRET que dura 12 horas.
const SESSION_HOURS = 12;
const googleEmails = () => (process.env.ADMIN_GOOGLE_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const b64url = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(process.env.SESSION_SECRET ?? ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}
async function issueSession(email: string): Promise<string> {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ email, exp: Date.now() + SESSION_HOURS * 3_600_000 })));
  return `${payload}.${await hmac(payload)}`;
}
async function sessionOk(header: string): Promise<boolean> {
  if (!header.startsWith('Bearer ') || (process.env.SESSION_SECRET ?? '').length < 32) return false;
  const [payload, sig] = header.slice(7).split('.');
  if (!payload || !sig || !timingSafeEqual(sig, await hmac(payload))) return false;
  try {
    const { email, exp } = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))));
    return typeof exp === 'number' && exp > Date.now() && googleEmails().includes(String(email).toLowerCase());
  } catch {
    return false;
  }
}
async function authorized(req: Request): Promise<boolean> {
  const header = req.headers.get('authorization') ?? '';
  return basicOk(header) || (await sessionOk(header));
}

// Columnas de una reserva en el formato que usa la página (fechas como texto, sin zonas horarias).
const BOOKING_COLS = `id, code, name, phone, email, address, district, service_type, description,
  to_char(appointment_date, 'YYYY-MM-DD') as date, to_char(appointment_time, 'HH24:MI') as time, status, admin_notes,
  created_at, updated_at, client_id, technician, amount, source`;
function adminBooking(r: Record<string, unknown>) {
  return {
    id: Number(r.id), code: r.code, name: r.name, phone: r.phone, email: r.email, address: r.address, district: r.district,
    service: SERVICES[r.service_type as string] ?? r.service_type, serviceId: r.service_type, description: r.description,
    date: r.date, time: r.time, status: r.status, adminNotes: r.admin_notes, createdAt: r.created_at, updatedAt: r.updated_at,
    clientId: r.client_id === null ? null : Number(r.client_id), technician: r.technician, amount: r.amount === null ? null : Number(r.amount),
    source: r.source,
  };
}
const CLIENT_COLS = `id, name, phone, district, address, equipment, to_char(installed_on, 'YYYY-MM-DD') as installed_on,
  to_char(last_maintenance, 'YYYY-MM-DD') as last_maintenance, frequency_months, to_char(last_reminder, 'YYYY-MM-DD') as last_reminder,
  notes, created_at`;
function client(r: Record<string, unknown>) {
  return {
    id: Number(r.id), name: r.name, phone: r.phone, district: r.district, address: r.address, equipment: r.equipment,
    installedOn: r.installed_on, lastMaintenance: r.last_maintenance, frequencyMonths: Number(r.frequency_months),
    lastReminder: r.last_reminder, notes: r.notes, createdAt: r.created_at,
  };
}
async function page(table: string, cols: string, order: string, url: URL, where = '', params: unknown[] = []) {
  const p = Math.max(0, Number(url.searchParams.get('page') ?? 0) || 0);
  const size = Math.min(200, Math.max(1, Number(url.searchParams.get('size') ?? 20) || 20));
  const [{ n }] = (await sql(`select count(*)::int as n from ${table} ${where}`, params)) as { n: number }[];
  const rows = await sql(`select ${cols} from ${table} ${where} order by ${order} limit ${size} offset ${p * size}`, params);
  return { rows, page: p, size, total: n, totalPages: Math.ceil(n / size) };
}

/** Al terminar una instalación o un mantenimiento, la ficha del cliente guarda la fecha para el próximo recordatorio. */
async function afterCompleted(r: Record<string, unknown>) {
  if (r.status !== 'COMPLETADA' || r.client_id === null) return;
  if (r.service_type === 'MANTENIMIENTO') {
    await sql`update clients set last_maintenance = greatest(coalesce(last_maintenance, ${r.date}::date), ${r.date}::date), updated_at = now() where id = ${r.client_id}`;
  } else if (r.service_type === 'AIRE_ACONDICIONADO') {
    await sql`update clients set installed_on = coalesce(installed_on, ${r.date}::date),
      last_maintenance = greatest(coalesce(last_maintenance, ${r.date}::date), ${r.date}::date), updated_at = now() where id = ${r.client_id}`;
  }
}

// ---------- validación ----------
function validateBooking(b: Record<string, unknown>, admin: boolean) {
  const e: Record<string, string> = {};
  const name = str(b.name), phone = str(b.phone), address = str(b.address);
  if (name.length < 3 || name.length > 120) e.name = name ? 'El nombre debe tener entre 3 y 120 caracteres.' : 'Ingresa tu nombre completo.';
  if (!PHONE.test(phone)) e.phone = phone ? 'Ingresa un teléfono válido.' : 'Ingresa tu teléfono.';
  if (str(b.email) && (!EMAIL.test(str(b.email)) || str(b.email).length > 160)) e.email = 'Ingresa un correo válido.';
  if (!admin && !address) e.address = 'Ingresa la dirección del servicio.';
  if (address.length > 200) e.address = 'La dirección es demasiado larga.';
  if (str(b.district).length > 80) e.district = 'El distrito es demasiado largo.';
  if (!SERVICES[str(b.service)]) e.service = 'Selecciona un servicio.';
  if (str(b.description).length > 1000) e.description = 'La descripción no puede superar 1000 caracteres.';
  if (!DATE.test(str(b.date))) e.date = 'Selecciona una fecha.';
  if (!TIME.test(str(b.time))) e.time = 'Selecciona un horario.';
  if (!admin && b.privacyAccepted !== true) e.privacyAccepted = 'Debes aceptar la política de privacidad.';
  if (admin && b.status !== undefined && !STATUSES.includes(str(b.status))) e.status = 'Estado no válido.';
  if (admin && b.amount !== undefined && b.amount !== null && b.amount !== '' && !(Number(b.amount) >= 0)) e.amount = 'Monto no válido.';
  if (Object.keys(e).length) throw bad(e);
}
function validateClient(c: Record<string, unknown>) {
  const e: Record<string, string> = {};
  if (str(c.name).length < 2 || str(c.name).length > 160) e.name = 'Escribe el nombre del cliente.';
  if (str(c.phone) && !PHONE.test(str(c.phone))) e.phone = 'Ingresa un teléfono válido.';
  for (const k of ['installedOn', 'lastMaintenance', 'lastReminder']) if (str(c[k]) && !DATE.test(str(c[k]))) e[k] = 'Fecha no válida.';
  const f = Number(c.frequencyMonths ?? 6);
  if (!(f >= 1 && f <= 24)) e.frequencyMonths = 'Entre 1 y 24 meses.';
  if (str(c.address).length > 200) e.address = 'La dirección es demasiado larga.';
  if (str(c.equipment).length > 300) e.equipment = 'Demasiado largo.';
  if (str(c.notes).length > 1000) e.notes = 'Las notas no pueden superar 1000 caracteres.';
  if (Object.keys(e).length) throw bad(e);
}

// ---------- rutas ----------
async function route(req: Request, path: string, url: URL): Promise<Response> {
  const m = req.method;
  const body = async () => {
    try {
      const v = await req.json();
      if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    } catch {
      /* cuerpo inválido */
    }
    throw new HttpError(400, 'La solicitud tiene un formato inválido.');
  };

  if (path === 'health') return json({ status: 'UP' });

  // --- Público ---
  if (path === 'v1/bookings/services' && m === 'GET') return json(Object.entries(SERVICES).map(([id, label]) => ({ id, label })));

  if (path === 'v1/bookings/availability' && m === 'GET') {
    const date = url.searchParams.get('date') ?? '';
    if (!bookable(date)) return json({ date, open: false, slots: [] });
    const taken = (await sql`select to_char(appointment_time, 'HH24:MI') as t from bookings where appointment_date = ${date} and status = any(${ACTIVE})`) as { t: string }[];
    const now = limaNow();
    const limit = `${String(Math.min(23, Number(now.time.slice(0, 2)) + 1)).padStart(2, '0')}${now.time.slice(2)}`;
    return json({
      date, open: true,
      slots: SLOTS.map((s) => ({ time: s, available: !(date === now.date && s <= limit) && taken.filter((x) => x.t === s).length < CAPACITY })),
    });
  }

  if (path === 'v1/bookings' && m === 'POST') {
    const b = await body();
    if (str(b.website)) throw new HttpError(400, 'Solicitud rechazada.');
    validateBooking(b, false);
    if (!bookable(str(b.date))) throw new HttpError(409, 'La fecha seleccionada no está disponible para reservas.');
    if (!SLOTS.includes(str(b.time))) throw new HttpError(409, 'El horario seleccionado no es válido.');
    const now = limaNow();
    const limit = `${String(Math.min(23, Number(now.time.slice(0, 2)) + 1)).padStart(2, '0')}${now.time.slice(2)}`;
    if (str(b.date) === now.date && str(b.time) <= limit) throw new HttpError(409, 'Ese horario acaba de ocuparse. Por favor elige otro.');
    const c = await uniqueCode();
    // El cupo se comprueba dentro del mismo INSERT para que dos reservas simultáneas no ocupen el último lugar.
    const rows = await sql`
      insert into bookings (code, name, phone, email, address, district, service_type, description, appointment_date, appointment_time, status, created_at, updated_at, source)
      select ${c}, ${str(b.name)}, ${str(b.phone)}, ${opt(b.email)}, ${str(b.address)}, ${opt(b.district)}, ${str(b.service)}, ${opt(b.description)},
             ${str(b.date)}::date, ${str(b.time)}::time, 'PENDIENTE', now(), now(), 'WEB'
      where (select count(*) from bookings where appointment_date = ${str(b.date)}::date and appointment_time = ${str(b.time)}::time and status = any(${ACTIVE})) < ${CAPACITY}
      returning code, to_char(appointment_date, 'YYYY-MM-DD') as date, to_char(appointment_time, 'HH24:MI') as time, service_type, status`;
    if (!rows.length) throw new HttpError(409, 'Ese horario acaba de ocuparse. Por favor elige otro.');
    const r = rows[0];
    return json({ code: r.code, date: r.date, time: r.time, service: SERVICES[r.service_type as string], status: r.status }, 201);
  }

  const track = path.match(/^v1\/bookings\/([A-Za-z0-9-]{4,20})$/);
  if (track && m === 'GET') {
    const rows = await sql`select code, service_type, to_char(appointment_date, 'YYYY-MM-DD') as date, to_char(appointment_time, 'HH24:MI') as time, status, updated_at
      from bookings where upper(code) = upper(${track[1]})`;
    if (!rows.length) throw new HttpError(404, 'No encontramos una reserva con ese código.');
    const r = rows[0];
    return json({ code: r.code, service: SERVICES[r.service_type as string], date: r.date, time: r.time, status: r.status, updatedAt: r.updated_at });
  }

  if (path === 'v1/contact' && m === 'POST') {
    const b = await body();
    const e: Record<string, string> = {};
    if (str(b.name).length < 3 || str(b.name).length > 120) e.name = str(b.name) ? 'El nombre debe tener entre 3 y 120 caracteres.' : 'Ingresa tu nombre.';
    if (!PHONE.test(str(b.phone))) e.phone = str(b.phone) ? 'Ingresa un teléfono válido.' : 'Ingresa tu teléfono.';
    if (str(b.email) && !EMAIL.test(str(b.email))) e.email = 'Ingresa un correo válido.';
    if (str(b.message).length < 10 || str(b.message).length > 2000) e.message = str(b.message) ? 'El mensaje debe tener entre 10 y 2000 caracteres.' : 'Escribe tu mensaje.';
    if (b.privacyAccepted !== true) e.privacyAccepted = 'Debes aceptar la política de privacidad.';
    if (Object.keys(e).length) throw bad(e);
    if (!str(b.website)) {
      await sql`insert into contact_messages (name, phone, email, message, is_read, created_at) values (${str(b.name)}, ${str(b.phone)}, ${opt(b.email)}, ${str(b.message)}, false, now())`;
    }
    return json({ ok: true, message: '¡Gracias! Te contactaremos muy pronto.' }, 201);
  }

  if (path === 'v1/newsletter' && m === 'POST') {
    const b = await body();
    const email = str(b.email).toLowerCase();
    if (!email) throw bad({ email: 'Ingresa tu correo.' });
    if (!EMAIL.test(email) || email.length > 160) throw bad({ email: 'Ingresa un correo válido.' });
    if (!str(b.website)) await sql`insert into newsletter_subscribers (email, created_at) values (${email}, now()) on conflict (email) do nothing`;
    return json({ ok: true, message: '¡Listo! Recibirás nuestros consejos y promociones.' });
  }

  // --- Ingreso con Google ---
  if (path === 'v1/auth/config' && m === 'GET') {
    const id = process.env.GOOGLE_CLIENT_ID ?? '';
    return json({ googleClientId: id && googleEmails().length && (process.env.SESSION_SECRET ?? '').length >= 32 ? id : null });
  }
  if (path === 'v1/auth/google' && m === 'POST') {
    const b = await body();
    const clientId = process.env.GOOGLE_CLIENT_ID ?? '';
    if (!clientId || (process.env.SESSION_SECRET ?? '').length < 32) throw new HttpError(503, 'El ingreso con Google no está configurado.');
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(str(b.credential)));
    const t = (r.ok ? await r.json() : {}) as Record<string, string>;
    const email = String(t.email ?? '').toLowerCase();
    const valid = r.ok && t.aud === clientId && ['accounts.google.com', 'https://accounts.google.com'].includes(t.iss) && t.email_verified === 'true' && Number(t.exp) * 1000 > Date.now();
    if (!valid) throw new HttpError(401, 'No pudimos comprobar tu cuenta de Google. Inténtalo otra vez.');
    if (!googleEmails().includes(email)) throw new HttpError(403, `La cuenta ${email} no tiene permiso para entrar al panel.`);
    return json({ token: await issueSession(email), email, expiresInHours: SESSION_HOURS });
  }

  // --- Panel (usuario y contraseña, o sesión de Google) ---
  if (!path.startsWith('v1/admin/')) throw new HttpError(404, 'No encontrado.');
  if (!(await authorized(req))) {
    return new Response(JSON.stringify({ detail: 'Usuario o contraseña incorrectos.' }), {
      status: 401, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
  const a = path.slice('v1/admin/'.length);

  if (a === 'me' && m === 'GET') return json({ ok: true });

  if (a === 'stats' && m === 'GET') {
    const today = limaNow().date;
    const [s] = await sql`select
        count(*) filter (where status = 'PENDIENTE')::int as pendiente, count(*) filter (where status = 'CONFIRMADA')::int as confirmada,
        count(*) filter (where status = 'EN_PROCESO')::int as en_proceso, count(*) filter (where status = 'COMPLETADA')::int as completada,
        count(*) filter (where status = 'CANCELADA')::int as cancelada, count(*)::int as total,
        count(*) filter (where appointment_date >= ${today}::date and status in ('PENDIENTE', 'CONFIRMADA'))::int as upcoming,
        (select count(*)::int from contact_messages where not is_read) as unread,
        (select count(*)::int from newsletter_subscribers) as subs
      from bookings`;
    return json({
      bookingsByStatus: { PENDIENTE: s.pendiente, CONFIRMADA: s.confirmada, EN_PROCESO: s.en_proceso, COMPLETADA: s.completada, CANCELADA: s.cancelada },
      totalBookings: s.total, upcomingBookings: s.upcoming, unreadMessages: s.unread, subscribers: s.subs,
    });
  }

  if (a === 'bookings' && m === 'GET') {
    const st = url.searchParams.get('status') ?? '';
    const where = STATUSES.includes(st) ? 'where status = $1' : '';
    const p = await page('bookings', BOOKING_COLS, 'appointment_date desc, appointment_time desc', url, where, where ? [st] : []);
    return json({ items: p.rows.map(adminBooking), page: p.page, size: p.size, total: p.total, totalPages: p.totalPages });
  }

  const st = a.match(/^bookings\/(\d+)\/status$/);
  if (st && m === 'PATCH') {
    const b = await body();
    if (!STATUSES.includes(str(b.status))) throw bad({ status: 'Indica el nuevo estado.' });
    if (str(b.adminNotes).length > 1000) throw bad({ adminNotes: 'Las notas no pueden superar 1000 caracteres.' });
    const notes = b.adminNotes === undefined || b.adminNotes === null ? undefined : opt(b.adminNotes);
    const rows = notes === undefined
      ? await sql(`update bookings set status = $1, updated_at = now() where id = $2 returning ${BOOKING_COLS}`, [str(b.status), Number(st[1])])
      : await sql(`update bookings set status = $1, admin_notes = $2, updated_at = now() where id = $3 returning ${BOOKING_COLS}`, [str(b.status), notes, Number(st[1])]);
    if (!rows.length) throw new HttpError(404, 'Reserva no encontrada.');
    await afterCompleted(rows[0]);
    return json(adminBooking(rows[0]));
  }

  if (a === 'contacts' && m === 'GET') {
    const p = await page('contact_messages', 'id, name, phone, email, message, is_read, created_at', 'created_at desc', url);
    return json({ items: p.rows.map((r) => ({ id: Number(r.id), name: r.name, phone: r.phone, email: r.email, message: r.message, read: r.is_read, createdAt: r.created_at })), page: p.page, size: p.size, total: p.total, totalPages: p.totalPages });
  }
  const rd = a.match(/^contacts\/(\d+)\/read$/);
  if (rd && m === 'PATCH') {
    const rows = await sql`update contact_messages set is_read = true where id = ${Number(rd[1])} returning id, name, phone, email, message, is_read, created_at`;
    if (!rows.length) throw new HttpError(404, 'Mensaje no encontrado.');
    const r = rows[0];
    return json({ id: Number(r.id), name: r.name, phone: r.phone, email: r.email, message: r.message, read: r.is_read, createdAt: r.created_at });
  }

  if (a === 'subscribers' && m === 'GET') {
    const p = await page('newsletter_subscribers', 'id, email, created_at', 'created_at desc', url);
    return json({ items: p.rows.map((r) => ({ id: Number(r.id), email: r.email, createdAt: r.created_at })), page: p.page, size: p.size, total: p.total, totalPages: p.totalPages });
  }

  // --- Agenda: citas por rango de fechas, y citas que agenda el equipo ---
  if (a === 'agenda' && m === 'GET') {
    const from = url.searchParams.get('from') ?? addDays(limaNow().date, -30);
    const to = url.searchParams.get('to') ?? addDays(limaNow().date, 60);
    if (!DATE.test(from) || !DATE.test(to)) throw bad({ from: 'Fecha no válida.' });
    const rows = await sql(`select ${BOOKING_COLS} from bookings where appointment_date between $1 and $2
      or (status in ('PENDIENTE', 'CONFIRMADA', 'EN_PROCESO') and appointment_date < $1) order by appointment_date, appointment_time`, [from, to]);
    return json(rows.map(adminBooking));
  }
  if (a === 'agenda' && m === 'POST') {
    const b = await body();
    validateBooking(b, true);
    const c = await uniqueCode();
    const rows = await sql(
      `insert into bookings (code, name, phone, email, address, district, service_type, description, appointment_date, appointment_time, status,
         admin_notes, client_id, technician, amount, source, created_at, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::date, $10::time, $11, $12, $13, $14, $15, 'PANEL', now(), now()) returning ${BOOKING_COLS}`,
      [c, str(b.name), str(b.phone), opt(b.email), str(b.address), opt(b.district), str(b.service), opt(b.description), str(b.date), str(b.time),
        STATUSES.includes(str(b.status)) ? str(b.status) : 'CONFIRMADA', opt(b.adminNotes), num(b.clientId), opt(b.technician), num(b.amount)],
    );
    return json(adminBooking(rows[0]), 201);
  }
  const ag = a.match(/^agenda\/(\d+)$/);
  if (ag && m === 'PUT') {
    const b = await body();
    validateBooking(b, true);
    const rows = await sql(
      `update bookings set name = $1, phone = $2, email = $3, address = $4, district = $5, service_type = $6, description = $7,
         appointment_date = $8::date, appointment_time = $9::time, status = $10, admin_notes = $11, client_id = $12, technician = $13, amount = $14,
         updated_at = now() where id = $15 returning ${BOOKING_COLS}`,
      [str(b.name), str(b.phone), opt(b.email), str(b.address), opt(b.district), str(b.service), opt(b.description), str(b.date), str(b.time),
        STATUSES.includes(str(b.status)) ? str(b.status) : 'PENDIENTE', opt(b.adminNotes), num(b.clientId), opt(b.technician), num(b.amount), Number(ag[1])],
    );
    if (!rows.length) throw new HttpError(404, 'Cita no encontrada.');
    await afterCompleted(rows[0]);
    return json(adminBooking(rows[0]));
  }
  if (ag && m === 'DELETE') {
    await sql`delete from bookings where id = ${Number(ag[1])}`;
    return json({ ok: true });
  }

  // --- Clientes ---
  if (a === 'clients' && m === 'GET') {
    const rows = await sql(`select ${CLIENT_COLS} from clients order by lower(name)`);
    return json(rows.map(client));
  }
  if (a === 'clients' && m === 'POST') {
    const c = await body();
    validateClient(c);
    const rows = await sql(
      `insert into clients (name, phone, district, address, equipment, installed_on, last_maintenance, frequency_months, notes)
       values ($1, $2, $3, $4, $5, $6::date, $7::date, $8, $9) returning ${CLIENT_COLS}`,
      [str(c.name), opt(c.phone), opt(c.district), opt(c.address), opt(c.equipment), opt(c.installedOn), opt(c.lastMaintenance), Number(c.frequencyMonths ?? 6), opt(c.notes)],
    );
    return json(client(rows[0]), 201);
  }
  const cl = a.match(/^clients\/(\d+)$/);
  if (cl && m === 'PUT') {
    const c = await body();
    validateClient(c);
    const rows = await sql(
      `update clients set name = $1, phone = $2, district = $3, address = $4, equipment = $5, installed_on = $6::date, last_maintenance = $7::date,
         frequency_months = $8, notes = $9, last_reminder = $10::date, updated_at = now() where id = $11 returning ${CLIENT_COLS}`,
      [str(c.name), opt(c.phone), opt(c.district), opt(c.address), opt(c.equipment), opt(c.installedOn), opt(c.lastMaintenance), Number(c.frequencyMonths ?? 6),
        opt(c.notes), opt(c.lastReminder), Number(cl[1])],
    );
    if (!rows.length) throw new HttpError(404, 'Cliente no encontrado.');
    return json(client(rows[0]));
  }
  if (cl && m === 'DELETE') {
    await sql`delete from clients where id = ${Number(cl[1])}`;
    return json({ ok: true });
  }
  const rem = a.match(/^clients\/(\d+)\/reminded$/);
  if (rem && m === 'POST') {
    const rows = await sql(`update clients set last_reminder = $1::date, updated_at = now() where id = $2 returning ${CLIENT_COLS}`, [limaNow().date, Number(rem[1])]);
    if (!rows.length) throw new HttpError(404, 'Cliente no encontrado.');
    return json(client(rows[0]));
  }

  throw new HttpError(404, 'No encontrado.');
}

export default async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  // Llega como /api/v1/..., /.netlify/functions/api/v1/... o /actuator/health.
  let path = url.pathname.replace(/^\/\.netlify\/functions\/api\/?/, '').replace(/^\/api\//, '').replace(/^\/+|\/+$/g, '');
  if (path === 'actuator/health') path = 'health';
  try {
    if (!process.env.DATABASE_URL && path !== 'health') throw new HttpError(503, 'El servidor no está configurado todavía.');
    return await route(req, path, url);
  } catch (err) {
    if (err instanceof HttpError) {
      return json(err.errors ? { title: 'Bad Request', status: err.status, detail: err.message, errors: err.errors } : { status: err.status, detail: err.message }, err.status);
    }
    console.error(err);
    return json({ status: 500, detail: 'Ocurrió un error inesperado. Intenta nuevamente.' }, 500);
  }
};

import type { ServiceId } from './site.data';

export type BookingStatus = 'PENDIENTE' | 'CONFIRMADA' | 'EN_PROCESO' | 'COMPLETADA' | 'CANCELADA';

export interface SlotAvailability {
  time: string;
  available: boolean;
}

export interface Availability {
  date: string;
  open: boolean;
  slots: SlotAvailability[];
}

export interface BookingRequest {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  district?: string | null;
  service: ServiceId;
  description?: string | null;
  date: string;
  time: string;
  privacyAccepted: boolean;
  website?: string | null;
}

export interface BookingCreated {
  code: string;
  date: string;
  time: string;
  service: string;
  status: BookingStatus;
}

export interface BookingTracking extends BookingCreated {
  updatedAt: string;
}

export interface ContactRequest {
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  privacyAccepted: boolean;
  website?: string | null;
}

export interface AdminBooking {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  district: string | null;
  service: string;
  description: string | null;
  date: string;
  time: string;
  status: BookingStatus;
  adminNotes: string | null;
  createdAt: string;
}

/** Cita en la agenda del panel (una reserva de la web o una cita que agendó el equipo). */
export interface AgendaBooking extends AdminBooking {
  serviceId: ServiceId;
  updatedAt: string;
  clientId: number | null;
  technician: string | null;
  amount: number | null;
  source: 'WEB' | 'PANEL';
}

export interface AgendaInput {
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  district: string | null;
  service: ServiceId;
  description: string | null;
  date: string;
  time: string;
  status: BookingStatus;
  adminNotes: string | null;
  clientId: number | null;
  technician: string | null;
  amount: number | null;
}

/** Ficha de un cliente para recordarle su mantenimiento. */
export interface Client {
  id: number;
  name: string;
  phone: string | null;
  district: string | null;
  address: string | null;
  equipment: string | null;
  installedOn: string | null;
  lastMaintenance: string | null;
  frequencyMonths: number;
  lastReminder: string | null;
  notes: string | null;
  createdAt: string;
}

export type ClientInput = Omit<Client, 'id' | 'createdAt'>;

export interface ContactMessage {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface AdminStats {
  bookingsByStatus: Record<BookingStatus, number>;
  totalBookings: number;
  upcomingBookings: number;
  unreadMessages: number;
  subscribers: number;
}

export type InvoiceType = 'FACTURA' | 'BOLETA';
export type InvoiceStatus = 'BORRADOR' | 'ACEPTADA' | 'RECHAZADA' | 'ERROR_ENVIO' | 'BAJA_PENDIENTE' | 'ANULADA';

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceRequest {
  type: InvoiceType;
  customerDocType: '6' | '1' | '4' | '-';
  customerDocNumber: string | null;
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  bookingId: number | null;
  observations: string | null;
  pricesIncludeIgv: boolean;
  items: InvoiceItemInput[];
}

export interface InvoiceItem {
  lineNo: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unitValue: number;
  subtotal: number;
  igv: number;
  total: number;
}

export interface Invoice {
  id: number;
  type: InvoiceType;
  title: string;
  series: string;
  number: number;
  fullNumber: string;
  issueDate: string;
  currency: string;
  customerDocType: string;
  customerDocNumber: string | null;
  customerName: string;
  customerAddress: string | null;
  customerEmail: string | null;
  bookingId: number | null;
  subtotal: number;
  igv: number;
  total: number;
  totalInWords: string;
  status: InvoiceStatus;
  observations: string | null;
  sunatDescription: string | null;
  pdfUrl: string | null;
  hash: string | null;
  /** Hay XML firmado / constancia (CDR) de SUNAT para descargar. */
  hasXml: boolean;
  hasCdr: boolean;
  createdAt: string;
  issuer: { ruc: string; businessName: string; address: string };
  items: InvoiceItem[];
}

export interface InvoiceSummary {
  id: number;
  type: InvoiceType;
  fullNumber: string;
  issueDate: string;
  customerDocNumber: string | null;
  customerName: string;
  total: number;
  status: InvoiceStatus;
  pdfUrl: string | null;
}

export interface InvoicingSettings {
  issuer: { ruc: string; businessName: string; address: string };
  seriesFactura: string;
  seriesBoleta: string;
  electronicEnabled: boolean;
  /** Canal de envío, p. ej. "SUNAT", "SUNAT (pruebas beta)" o "Nubefact". */
  channel: string;
}

export type QuoteStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';

export interface QuoteRequest {
  customerDoc: string | null;
  customerName: string;
  customerContact: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  bookingId: number | null;
  validDays: number;
  pricesIncludeIgv: boolean;
  notes: string | null;
  items: InvoiceItemInput[];
}

export interface Quote {
  id: number;
  code: string;
  issueDate: string;
  validUntil: string;
  customerDoc: string | null;
  customerName: string;
  customerContact: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  bookingId: number | null;
  pricesIncludeIgv: boolean;
  subtotal: number;
  igv: number;
  total: number;
  totalInWords: string;
  status: QuoteStatus;
  notes: string | null;
  createdAt: string;
  items: { lineNo: number; description: string; quantity: number; unitPrice: number; subtotal: number; igv: number; total: number }[];
}

export interface QuoteSummary {
  id: number;
  code: string;
  issueDate: string;
  validUntil: string;
  customerName: string;
  total: number;
  status: QuoteStatus;
}

/** Las llamadas van a /api/...: en desarrollo Vite las reenvía a Spring Boot y en producción Netlify las reenvía al servidor. */
const API = '/api/v1';

/** Error de la API con el código HTTP y el cuerpo de la respuesta (RFC 9457). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: { detail?: string; errors?: Record<string, string> } | null,
  ) {
    super(body?.detail ?? `HTTP ${status}`);
  }
}

type Query = Record<string, string | number | undefined | null>;

/*
 * Antes el servidor gratuito se apagaba cuando nadie lo usaba (hoy la API corre en Netlify y responde al instante).
 * Antes de cada llamada se confirma que está encendido (si no se habló con él hace poco), así
 * los formularios no fallan ni se envían dos veces mientras arranca.
 */
const AWAKE_FOR_MS = 10 * 60_000;
let lastContact = 0;
let waking: Promise<void> | null = null;

/** Enciende el servidor si está apagado. Se llama al empezar a llenar un formulario o al abrir el panel. */
export function wakeApi(): Promise<void> {
  if (Date.now() - lastContact < AWAKE_FOR_MS) return Promise.resolve();
  waking ??= (async () => {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      try {
        const res = await fetch('/actuator/health', { cache: 'no-store' });
        if (res.ok) {
          lastContact = Date.now();
          return;
        }
        // 502/503/504: el servidor todavía está arrancando; se vuelve a intentar.
      } catch {
        // Sin conexión a internet: no tiene sentido esperar; la llamada real mostrará el error.
        return;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
  })().finally(() => {
    waking = null;
  });
  return waking;
}

async function request<T>(method: string, path: string, opts: { body?: unknown; auth?: string; query?: Query; blob?: boolean } = {}): Promise<T> {
  await wakeApi();
  const url = new URL(API + path, location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  // `auth` es usuario:clave en Base64 (Basic) o, si entró con Google, «Bearer <sesión>».
  if (opts.auth) headers['Authorization'] = opts.auth.startsWith('Bearer ') ? opts.auth : `Basic ${opts.auth}`;
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  } catch {
    throw new ApiError(0, null);
  }
  lastContact = Date.now();
  if (!res.ok) {
    let body = null;
    try {
      body = await res.json();
    } catch {
      /* sin cuerpo JSON */
    }
    throw new ApiError(res.status, body);
  }
  if (opts.blob) return (await res.blob()) as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  availability: (date: string) => request<Availability>('GET', '/bookings/availability', { query: { date } }),
  createBooking: (body: BookingRequest) => request<BookingCreated>('POST', '/bookings', { body }),
  trackBooking: (code: string) => request<BookingTracking>('GET', `/bookings/${encodeURIComponent(code.trim())}`),
  sendContact: (body: ContactRequest) => request<{ ok: boolean; message: string }>('POST', '/contact', { body }),
  subscribe: (email: string, website = '') => request<{ ok: boolean; message: string }>('POST', '/newsletter', { body: { email, website } }),

  // ---- Ingreso con Google ----
  authConfig: () => request<{ googleClientId: string | null }>('GET', '/auth/config'),
  googleLogin: (credential: string) => request<{ token: string; email: string }>('POST', '/auth/google', { body: { credential } }),

  // ---- Panel de administración (usuario y contraseña, o sesión de Google) ----
  adminMe: (auth: string) => request<unknown>('GET', '/admin/me', { auth }),
  adminStats: (auth: string) => request<AdminStats>('GET', '/admin/stats', { auth }),
  adminBookings: (auth: string, status: BookingStatus | '', page: number) =>
    request<Page<AdminBooking>>('GET', '/admin/bookings', { auth, query: { page, size: 15, status } }),
  adminUpdateStatus: (auth: string, id: number, status: BookingStatus, adminNotes: string | null) =>
    request<AdminBooking>('PATCH', `/admin/bookings/${id}/status`, { auth, body: { status, adminNotes } }),
  adminContacts: (auth: string, page: number) => request<Page<ContactMessage>>('GET', '/admin/contacts', { auth, query: { page, size: 15 } }),
  adminMarkRead: (auth: string, id: number) => request<ContactMessage>('PATCH', `/admin/contacts/${id}/read`, { auth, body: {} }),
  adminSubscribers: (auth: string) => request<Page<Subscriber>>('GET', '/admin/subscribers', { auth, query: { size: 200 } }),

  // ---- Agenda y clientes ----
  agenda: (auth: string) => request<AgendaBooking[]>('GET', '/admin/agenda', { auth }),
  createAppointment: (auth: string, body: AgendaInput) => request<AgendaBooking>('POST', '/admin/agenda', { auth, body }),
  updateAppointment: (auth: string, id: number, body: AgendaInput) => request<AgendaBooking>('PUT', `/admin/agenda/${id}`, { auth, body }),
  deleteAppointment: (auth: string, id: number) => request<{ ok: boolean }>('DELETE', `/admin/agenda/${id}`, { auth }),
  clients: (auth: string) => request<Client[]>('GET', '/admin/clients', { auth }),
  createClient: (auth: string, body: ClientInput) => request<Client>('POST', '/admin/clients', { auth, body }),
  updateClient: (auth: string, id: number, body: ClientInput) => request<Client>('PUT', `/admin/clients/${id}`, { auth, body }),
  deleteClient: (auth: string, id: number) => request<{ ok: boolean }>('DELETE', `/admin/clients/${id}`, { auth }),
  clientReminded: (auth: string, id: number) => request<Client>('POST', `/admin/clients/${id}/reminded`, { auth, body: {} }),

  // ---- Facturación ----
  invoicingSettings: (auth: string) => request<InvoicingSettings>('GET', '/admin/invoices/settings', { auth }),
  invoices: (auth: string, page: number) => request<Page<InvoiceSummary>>('GET', '/admin/invoices', { auth, query: { page, size: 15 } }),
  invoice: (auth: string, id: number) => request<Invoice>('GET', `/admin/invoices/${id}`, { auth }),
  createInvoice: (auth: string, body: InvoiceRequest) => request<Invoice>('POST', '/admin/invoices', { auth, body }),
  sendInvoice: (auth: string, id: number) => request<Invoice>('POST', `/admin/invoices/${id}/send`, { auth, body: {} }),
  voidInvoice: (auth: string, id: number, reason: string) => request<Invoice>('POST', `/admin/invoices/${id}/void`, { auth, body: { reason } }),
  checkVoid: (auth: string, id: number) => request<Invoice>('POST', `/admin/invoices/${id}/void/status`, { auth, body: {} }),
  invoiceXml: (auth: string, id: number) => request<Blob>('GET', `/admin/invoices/${id}/xml`, { auth, blob: true }),
  invoiceCdr: (auth: string, id: number) => request<Blob>('GET', `/admin/invoices/${id}/cdr`, { auth, blob: true }),

  // ---- Cotizaciones ----
  quotes: (auth: string, page: number) => request<Page<QuoteSummary>>('GET', '/admin/quotes', { auth, query: { page, size: 15 } }),
  quote: (auth: string, id: number) => request<Quote>('GET', `/admin/quotes/${id}`, { auth }),
  createQuote: (auth: string, body: QuoteRequest) => request<Quote>('POST', '/admin/quotes', { auth, body }),
  quoteStatus: (auth: string, id: number, status: QuoteStatus) => request<Quote>('PATCH', `/admin/quotes/${id}/status`, { auth, body: { status } }),
  quoteExcel: (auth: string, id: number) => request<Blob>('GET', `/admin/quotes/${id}/excel`, { auth, blob: true }),
};

/** Convierte un error de la API en un mensaje legible y en errores por campo. */
export function describeError(err: unknown): { message: string; fields: Record<string, string> } {
  if (err instanceof ApiError) {
    if (err.status === 0) {
      return { message: 'No pudimos conectar con el servidor. Revisa tu conexión o escríbenos por WhatsApp.', fields: {} };
    }
    return { message: err.body?.detail ?? 'Ocurrió un error inesperado. Intenta nuevamente.', fields: err.body?.errors ?? {} };
  }
  return { message: 'Ocurrió un error inesperado. Intenta nuevamente.', fields: {} };
}

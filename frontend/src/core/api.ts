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
export type InvoiceStatus = 'BORRADOR' | 'ACEPTADA' | 'RECHAZADA' | 'ERROR_ENVIO' | 'ANULADA';

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

/** Las llamadas van a /api/...: en desarrollo Vite las reenvía a Spring Boot y en producción las sirve el mismo servidor. */
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

async function request<T>(method: string, path: string, opts: { body?: unknown; auth?: string; query?: Query; blob?: boolean } = {}): Promise<T> {
  const url = new URL(API + path, location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth) headers['Authorization'] = `Basic ${opts.auth}`;
  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  } catch {
    throw new ApiError(0, null);
  }
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

  // ---- Panel de administración (HTTP Basic) ----
  adminMe: (auth: string) => request<unknown>('GET', '/admin/me', { auth }),
  adminStats: (auth: string) => request<AdminStats>('GET', '/admin/stats', { auth }),
  adminBookings: (auth: string, status: BookingStatus | '', page: number) =>
    request<Page<AdminBooking>>('GET', '/admin/bookings', { auth, query: { page, size: 15, status } }),
  adminUpdateStatus: (auth: string, id: number, status: BookingStatus, adminNotes: string | null) =>
    request<AdminBooking>('PATCH', `/admin/bookings/${id}/status`, { auth, body: { status, adminNotes } }),
  adminContacts: (auth: string, page: number) => request<Page<ContactMessage>>('GET', '/admin/contacts', { auth, query: { page, size: 15 } }),
  adminMarkRead: (auth: string, id: number) => request<ContactMessage>('PATCH', `/admin/contacts/${id}/read`, { auth, body: {} }),
  adminSubscribers: (auth: string) => request<Page<Subscriber>>('GET', '/admin/subscribers', { auth, query: { size: 200 } }),

  // ---- Facturación ----
  invoicingSettings: (auth: string) => request<InvoicingSettings>('GET', '/admin/invoices/settings', { auth }),
  invoices: (auth: string, page: number) => request<Page<InvoiceSummary>>('GET', '/admin/invoices', { auth, query: { page, size: 15 } }),
  invoice: (auth: string, id: number) => request<Invoice>('GET', `/admin/invoices/${id}`, { auth }),
  createInvoice: (auth: string, body: InvoiceRequest) => request<Invoice>('POST', '/admin/invoices', { auth, body }),
  sendInvoice: (auth: string, id: number) => request<Invoice>('POST', `/admin/invoices/${id}/send`, { auth, body: {} }),
  voidInvoice: (auth: string, id: number, reason: string) => request<Invoice>('POST', `/admin/invoices/${id}/void`, { auth, body: { reason } }),

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

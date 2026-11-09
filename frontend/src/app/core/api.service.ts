import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ServiceId } from './site.data';

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

/** Las llamadas van a /api/... ; en desarrollo un proxy y en Vercel un rewrite las envían a Spring Boot. */
const API = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  availability(date: string): Observable<Availability> {
    return this.http.get<Availability>(`${API}/bookings/availability`, { params: { date } });
  }

  createBooking(body: BookingRequest): Observable<BookingCreated> {
    return this.http.post<BookingCreated>(`${API}/bookings`, body);
  }

  trackBooking(code: string): Observable<BookingTracking> {
    return this.http.get<BookingTracking>(`${API}/bookings/${encodeURIComponent(code.trim())}`);
  }

  sendContact(body: ContactRequest): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${API}/contact`, body);
  }

  subscribe(email: string, website = ''): Observable<{ ok: boolean; message: string }> {
    return this.http.post<{ ok: boolean; message: string }>(`${API}/newsletter`, { email, website });
  }

  // ---- Panel de administración (HTTP Basic) ----

  adminMe(auth: string): Observable<unknown> {
    return this.http.get(`${API}/admin/me`, { headers: this.authHeaders(auth) });
  }

  adminStats(auth: string): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${API}/admin/stats`, { headers: this.authHeaders(auth) });
  }

  adminBookings(auth: string, status: BookingStatus | '', page: number): Observable<Page<AdminBooking>> {
    const params: Record<string, string> = { page: String(page), size: '15' };
    if (status) params['status'] = status;
    return this.http.get<Page<AdminBooking>>(`${API}/admin/bookings`, { headers: this.authHeaders(auth), params });
  }

  adminUpdateStatus(auth: string, id: number, status: BookingStatus, adminNotes: string | null): Observable<AdminBooking> {
    return this.http.patch<AdminBooking>(
      `${API}/admin/bookings/${id}/status`,
      { status, adminNotes },
      { headers: this.authHeaders(auth) },
    );
  }

  adminContacts(auth: string, page: number): Observable<Page<ContactMessage>> {
    return this.http.get<Page<ContactMessage>>(`${API}/admin/contacts`, {
      headers: this.authHeaders(auth),
      params: { page: String(page), size: '15' },
    });
  }

  adminMarkRead(auth: string, id: number): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${API}/admin/contacts/${id}/read`, {}, { headers: this.authHeaders(auth) });
  }

  adminSubscribers(auth: string): Observable<Page<Subscriber>> {
    return this.http.get<Page<Subscriber>>(`${API}/admin/subscribers`, {
      headers: this.authHeaders(auth),
      params: { size: '200' },
    });
  }

  // ---- Facturación ----

  invoicingSettings(auth: string): Observable<InvoicingSettings> {
    return this.http.get<InvoicingSettings>(`${API}/admin/invoices/settings`, { headers: this.authHeaders(auth) });
  }

  invoices(auth: string, page: number): Observable<Page<InvoiceSummary>> {
    return this.http.get<Page<InvoiceSummary>>(`${API}/admin/invoices`, {
      headers: this.authHeaders(auth),
      params: { page: String(page), size: '15' },
    });
  }

  invoice(auth: string, id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${API}/admin/invoices/${id}`, { headers: this.authHeaders(auth) });
  }

  createInvoice(auth: string, body: InvoiceRequest): Observable<Invoice> {
    return this.http.post<Invoice>(`${API}/admin/invoices`, body, { headers: this.authHeaders(auth) });
  }

  sendInvoice(auth: string, id: number): Observable<Invoice> {
    return this.http.post<Invoice>(`${API}/admin/invoices/${id}/send`, {}, { headers: this.authHeaders(auth) });
  }

  voidInvoice(auth: string, id: number, reason: string): Observable<Invoice> {
    return this.http.post<Invoice>(`${API}/admin/invoices/${id}/void`, { reason }, { headers: this.authHeaders(auth) });
  }

  private authHeaders(auth: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Basic ${auth}` });
  }
}

/** Convierte un error HTTP del backend en un mensaje legible y en errores por campo. */
export function describeError(err: unknown): { message: string; fields: Record<string, string> } {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { detail?: string; errors?: Record<string, string> } | null;
    if (err.status === 0) {
      return { message: 'No pudimos conectar con el servidor. Revisa tu conexión o escríbenos por WhatsApp.', fields: {} };
    }
    return {
      message: body?.detail ?? 'Ocurrió un error inesperado. Intenta nuevamente.',
      fields: body?.errors ?? {},
    };
  }
  return { message: 'Ocurrió un error inesperado. Intenta nuevamente.', fields: {} };
}

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AdminBooking,
  AdminStats,
  ApiService,
  BookingStatus,
  ContactMessage,
  Page,
  Subscriber,
  describeError,
} from '../core/api.service';
import { UiService } from '../core/ui.service';
import { longDate, prettyTime } from '../shared/dates';
import { IconComponent } from '../shared/icon.component';
import { CountUpDirective } from '../shared/count-up.directive';
import { InvoicingComponent } from './admin/invoicing.component';

const SESSION_KEY = 'acs-admin';

/** Panel interno: reservas, mensajes y suscriptores. Protegido por usuario y contraseña en el backend. */
@Component({
  selector: 'app-admin-page',
  imports: [FormsModule, DatePipe, IconComponent, CountUpDirective, InvoicingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page-shell.scss',
  templateUrl: './admin.page.html',
  styles: `
    .login { max-width: 420px; margin: 0 auto; padding: 34px; animation: fadeUp .6s var(--ease-out) both; }
    .login h1 { font-size: 1.6rem; margin-bottom: 6px; } .login p { color: var(--text-muted); margin-bottom: 22px; }
    .bar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 24px; }
    .bar h1 { font-size: 1.8rem; }
    .bar .actions { display: flex; gap: 10px; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 26px; }
    .kpi { padding: 20px; border-radius: var(--radius); background: var(--bg-elevated); border: 1px solid var(--border); animation: fadeUp .5s var(--ease-out) both; }
    .kpi strong { display: block; font-family: var(--font-display); font-size: 2rem; } .kpi span { color: var(--text-muted); font-size: .88rem; }
    .kpi.hl { background: var(--grad-ice); color: #fff; border: 0; } .kpi.hl span { color: rgba(255,255,255,.85); }
    .tabs { display: flex; gap: 6px; border-bottom: 1px solid var(--border); margin-bottom: 18px; overflow-x: auto; }
    .tabs button { padding: 12px 16px; font-weight: 600; color: var(--text-muted); border-bottom: 2px solid transparent; white-space: nowrap; }
    .tabs button.active { color: var(--blue-500); border-color: var(--blue-500); }
    .badge { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px; margin-left: 6px; border-radius: 10px; background: var(--orange-500); color: #fff; font-size: .72rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .filters button { padding: 7px 14px; border-radius: 999px; border: 1px solid var(--border); font-size: .85rem; font-weight: 600; }
    .filters button.active { background: var(--navy-800); color: #fff; border-color: transparent; }
    :host-context([data-theme='dark']) .filters button.active { background: var(--blue-500); }
    .list { display: grid; gap: 12px; }
    .row { padding: 18px; border-radius: var(--radius); background: var(--bg-elevated); border: 1px solid var(--border); display: grid; gap: 12px;
      animation: fadeUp .4s var(--ease-out) both; }
    @media (min-width: 900px) { .row { grid-template-columns: 1.3fr 1fr 1.2fr; align-items: start; } }
    .row h3 { font-size: 1.05rem; } .muted { color: var(--text-muted); font-size: .88rem; }
    .row a { color: var(--blue-500); }
    .code { font-family: var(--font-display); font-weight: 700; letter-spacing: .05em; font-size: .85rem; color: var(--text-muted); }
    .when { font-weight: 700; } .when::first-letter { text-transform: uppercase; }
    .ctrl { display: grid; gap: 8px; }
    .ctrl select, .ctrl textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-soft); }
    .ctrl textarea { min-height: 60px; resize: vertical; }
    .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: .75rem; font-weight: 700; }
    .pill.PENDIENTE { background: rgba(245,130,31,.15); color: var(--orange-600); }
    .pill.CONFIRMADA, .pill.EN_PROCESO { background: rgba(30,136,229,.15); color: var(--blue-500); }
    .pill.COMPLETADA { background: rgba(34,197,94,.15); color: #16a34a; }
    .pill.CANCELADA { background: rgba(239,68,68,.12); color: var(--red-500); }
    .msg.unread { border-left: 4px solid var(--orange-500); }
    .msg p { white-space: pre-wrap; }
    .pager { display: flex; justify-content: center; align-items: center; gap: 14px; margin-top: 18px; }
    .empty { text-align: center; color: var(--text-muted); padding: 40px; }
    .subs { display: grid; gap: 8px; }
    .subs li { display: flex; justify-content: space-between; padding: 12px 16px; border-radius: 12px; background: var(--bg-elevated); border: 1px solid var(--border); }
  `,
})
export class AdminPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);

  protected readonly statuses: BookingStatus[] = ['PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
  protected readonly longDate = longDate;
  protected readonly prettyTime = prettyTime;

  protected username = '';
  protected password = '';
  protected readonly auth = signal<string | null>(null);
  protected readonly loggingIn = signal(false);

  protected readonly tab = signal<'reservas' | 'mensajes' | 'suscriptores' | 'facturacion'>('reservas');
  /** Reserva a facturar: abre la pestaña de facturación con el formulario prellenado. */
  protected readonly billing = signal<AdminBooking | null>(null);
  protected readonly stats = signal<AdminStats | null>(null);
  protected readonly filter = signal<BookingStatus | ''>('');
  protected readonly bookings = signal<Page<AdminBooking> | null>(null);
  protected readonly messages = signal<Page<ContactMessage> | null>(null);
  protected readonly subscribers = signal<Page<Subscriber> | null>(null);
  protected readonly notes: Record<number, string> = {};

  ngOnInit(): void {
    // Las credenciales se guardan solo durante la sesión del navegador (se borran al cerrarlo).
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      this.auth.set(saved);
      this.loadAll();
    }
  }

  protected login(): void {
    const token = btoa(unescape(encodeURIComponent(`${this.username}:${this.password}`)));
    this.loggingIn.set(true);
    this.api.adminMe(token).subscribe({
      next: () => {
        this.loggingIn.set(false);
        this.password = '';
        this.auth.set(token);
        sessionStorage.setItem(SESSION_KEY, token);
        this.loadAll();
      },
      error: (err: HttpErrorResponse) => {
        this.loggingIn.set(false);
        this.ui.toast('error', err.status === 401 ? 'Usuario o contraseña incorrectos' : 'No se pudo ingresar', err.status === 401 ? undefined : describeError(err).message);
      },
    });
  }

  protected logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.auth.set(null);
  }

  protected loadAll(): void {
    this.loadStats();
    this.loadBookings(0);
    this.loadMessages(0);
    this.loadSubscribers();
  }

  private handle(err: HttpErrorResponse): void {
    if (err.status === 401) {
      this.logout();
      this.ui.toast('error', 'Sesión expirada', 'Vuelve a ingresar.');
    } else {
      this.ui.toast('error', 'Error', describeError(err).message);
    }
  }

  protected loadStats(): void {
    this.api.adminStats(this.auth()!).subscribe({ next: (s) => this.stats.set(s), error: (e) => this.handle(e) });
  }

  protected loadBookings(page: number): void {
    this.api.adminBookings(this.auth()!, this.filter(), page).subscribe({
      next: (p) => {
        p.items.forEach((b) => (this.notes[b.id] = b.adminNotes ?? ''));
        this.bookings.set(p);
      },
      error: (e) => this.handle(e),
    });
  }

  protected setFilter(f: BookingStatus | ''): void {
    this.filter.set(f);
    this.loadBookings(0);
  }

  protected updateStatus(b: AdminBooking, status: BookingStatus): void {
    this.api.adminUpdateStatus(this.auth()!, b.id, status, this.notes[b.id] ?? null).subscribe({
      next: (updated) => {
        this.bookings.update((p) => p && { ...p, items: p.items.map((x) => (x.id === updated.id ? updated : x)) });
        this.ui.toast('success', `Reserva ${updated.code}`, `Estado: ${updated.status.replace('_', ' ').toLowerCase()}`);
        this.loadStats();
      },
      error: (e) => this.handle(e),
    });
  }

  protected bill(b: AdminBooking): void {
    this.billing.set({ ...b });
    this.tab.set('facturacion');
  }

  protected loadMessages(page: number): void {
    this.api.adminContacts(this.auth()!, page).subscribe({ next: (p) => this.messages.set(p), error: (e) => this.handle(e) });
  }

  protected markRead(m: ContactMessage): void {
    this.api.adminMarkRead(this.auth()!, m.id).subscribe({
      next: (updated) => {
        this.messages.update((p) => p && { ...p, items: p.items.map((x) => (x.id === updated.id ? updated : x)) });
        this.loadStats();
      },
      error: (e) => this.handle(e),
    });
  }

  protected loadSubscribers(): void {
    this.api.adminSubscribers(this.auth()!).subscribe({ next: (p) => this.subscribers.set(p), error: (e) => this.handle(e) });
  }

  protected whatsapp(phone: string, code: string): string {
    const digits = phone.replace(/\D/g, '');
    const full = digits.length === 9 ? `51${digits}` : digits;
    const text = code ? `Hola, le escribimos de AIRCONSOLUTION SERVICES SAC por su reserva ${code}.` : 'Hola, le escribimos de AIRCONSOLUTION SERVICES SAC por su consulta.';
    return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
  }

  /** Descarga las reservas visibles en CSV para abrirlas en Excel. */
  protected exportCsv(): void {
    const rows = this.bookings()?.items ?? [];
    const header = ['Código', 'Fecha', 'Hora', 'Servicio', 'Estado', 'Nombre', 'Teléfono', 'Correo', 'Dirección', 'Distrito', 'Descripción', 'Notas'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows.map((b) => [b.code, b.date, b.time, b.service, b.status, b.name, b.phone, b.email, b.address, b.district, b.description, b.adminNotes])]
      .map((r) => r.map(esc).join(';'))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

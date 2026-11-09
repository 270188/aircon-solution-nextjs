import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AdminBooking, ApiService, Page, Quote, QuoteRequest, QuoteStatus, QuoteSummary, describeError } from '../../core/api.service';
import { UiService } from '../../core/ui.service';
import { IconComponent } from '../../shared/icon.component';
import { lineTotals, lineTotalsPlusIgv, splitTotal } from '../../shared/peru';

interface ItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
}

const STATUS_LABEL: Record<QuoteStatus, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
};

/** Pestaña "Cotizaciones" del panel: crear, ver, descargar en Excel y pasar a factura. */
@Component({
  selector: 'app-quotes',
  imports: [FormsModule, DatePipe, DecimalPipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quotes.component.html',
  styleUrl: './invoicing.component.scss',
})
export class QuotesComponent implements OnInit {
  readonly auth = input.required<string>();
  readonly fromBooking = input<AdminBooking | null>(null);
  readonly unauthorized = output<void>();
  /** El usuario pidió facturar una cotización aceptada. */
  readonly bill = output<Quote>();

  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly statuses: QuoteStatus[] = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'VENCIDA'];
  protected readonly list = signal<Page<QuoteSummary> | null>(null);
  protected readonly view = signal<Quote | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly downloading = signal<number | null>(null);
  protected readonly formError = signal('');

  protected customerName = '';
  protected customerDoc = '';
  protected customerContact = '';
  protected customerPhone = '';
  protected customerEmail = '';
  protected customerAddress = '';
  protected validDays = 15;
  protected notes = '';
  protected bookingId: number | null = null;
  /** Por defecto los precios se escriben sin IGV y el sistema suma el 18 %. */
  protected readonly includesIgv = signal(false);
  protected readonly items = signal<ItemRow[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  protected readonly totals = computed(() => {
    const list = this.items();
    if (this.includesIgv()) {
      const total = list.reduce((acc, it) => acc + lineTotals(Number(it.quantity) || 0, Number(it.unitPrice) || 0).total, 0);
      return splitTotal(total);
    }
    return list.reduce(
      (acc, it) => {
        const t = lineTotalsPlusIgv(Number(it.quantity) || 0, Number(it.unitPrice) || 0);
        return { subtotal: acc.subtotal + t.subtotal, igv: acc.igv + t.igv, total: acc.total + t.total };
      },
      { subtotal: 0, igv: 0, total: 0 },
    );
  });

  constructor() {
    effect(() => {
      const b = this.fromBooking();
      if (!b) return;
      this.reset();
      this.bookingId = b.id;
      this.customerName = b.name;
      this.customerPhone = b.phone;
      this.customerEmail = b.email ?? '';
      this.customerAddress = [b.address, b.district].filter(Boolean).join(', ');
      this.items.set([{ description: b.service, quantity: 1, unitPrice: 0 }]);
      this.formOpen.set(true);
    });
  }

  ngOnInit(): void {
    this.load(0);
  }

  protected load(page: number): void {
    this.api.quotes(this.auth(), page).subscribe({ next: (p) => this.list.set(p), error: (e) => this.fail(e) });
  }

  protected openForm(): void {
    this.reset();
    this.formOpen.set(true);
  }

  private reset(): void {
    this.customerName = this.customerDoc = this.customerContact = this.customerPhone = '';
    this.customerEmail = this.customerAddress = this.notes = '';
    this.validDays = 15;
    this.bookingId = null;
    this.includesIgv.set(false);
    this.items.set([{ description: '', quantity: 1, unitPrice: 0 }]);
    this.formError.set('');
  }

  protected addItem(): void {
    this.items.update((l) => [...l, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  protected removeItem(i: number): void {
    this.items.update((l) => (l.length > 1 ? l.filter((_, idx) => idx !== i) : l));
  }

  protected updateItem(i: number, field: keyof ItemRow, value: string): void {
    this.items.update((l) => l.map((it, idx) => (idx === i ? { ...it, [field]: field === 'description' ? value : Number(value) } : it)));
  }

  protected lineAmount(it: ItemRow): number {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return this.includesIgv() ? lineTotals(q, p).total : lineTotalsPlusIgv(q, p).subtotal;
  }

  protected submit(): void {
    if (!this.customerName.trim()) return this.formError.set('Ingresa el nombre del cliente.');
    if (this.items().some((it) => !it.description.trim() || !(Number(it.quantity) > 0) || !(Number(it.unitPrice) > 0))) {
      return this.formError.set('Cada ítem necesita descripción, cantidad y precio mayor a 0.');
    }
    this.formError.set('');
    const t = (s: string) => s.trim() || null;
    const body: QuoteRequest = {
      customerDoc: t(this.customerDoc),
      customerName: this.customerName.trim(),
      customerContact: t(this.customerContact),
      customerPhone: t(this.customerPhone),
      customerEmail: t(this.customerEmail),
      customerAddress: t(this.customerAddress),
      bookingId: this.bookingId,
      validDays: Number(this.validDays) || 15,
      pricesIncludeIgv: this.includesIgv(),
      notes: t(this.notes),
      items: this.items().map((it) => ({ description: it.description.trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
    };
    this.saving.set(true);
    this.api.createQuote(this.auth(), body).subscribe({
      next: (q) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.view.set(q);
        this.load(0);
        this.ui.toast('success', `Cotización ${q.code} creada`, 'Ya puedes descargarla en Excel.');
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(describeError(e).message);
        this.fail(e, false);
      },
    });
  }

  protected open(id: number): void {
    this.api.quote(this.auth(), id).subscribe({ next: (q) => this.view.set(q), error: (e) => this.fail(e) });
  }

  protected setStatus(q: Quote, status: QuoteStatus): void {
    this.api.quoteStatus(this.auth(), q.id, status).subscribe({
      next: (updated) => {
        this.view.set(updated);
        this.load(this.list()?.page ?? 0);
      },
      error: (e) => this.fail(e),
    });
  }

  protected download(id: number, code: string): void {
    this.downloading.set(id);
    this.api.quoteExcel(this.auth(), id).subscribe({
      next: (blob) => {
        this.downloading.set(null);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Cotizacion-${code}.xlsx`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (e) => {
        this.downloading.set(null);
        this.fail(e);
      },
    });
  }

  private fail(e: HttpErrorResponse, toast = true): void {
    if (e.status === 401) {
      this.unauthorized.emit();
      return;
    }
    if (toast) this.ui.toast('error', 'Error', describeError(e).message);
  }
}

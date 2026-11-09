import { DatePipe, DecimalPipe, LowerCasePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  AdminBooking,
  ApiService,
  Invoice,
  InvoiceRequest,
  InvoiceStatus,
  InvoiceSummary,
  InvoiceType,
  InvoicingSettings,
  Page,
  Quote,
  describeError,
} from '../../core/api.service';
import { business } from '../../core/site.data';
import { UiService } from '../../core/ui.service';
import { IconComponent } from '../../shared/icon.component';
import { isValidDni, isValidRuc, lineTotals, lineTotalsPlusIgv } from '../../shared/peru';

interface ItemRow {
  description: string;
  quantity: number;
  unitPrice: number;
}

type DocType = '6' | '1' | '4' | '-';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  BORRADOR: 'Borrador',
  ACEPTADA: 'Aceptada por SUNAT',
  RECHAZADA: 'Rechazada',
  ERROR_ENVIO: 'Error de envío',
  ANULADA: 'Anulada',
};

/** Pestaña "Facturación" del panel: emitir, ver, imprimir, enviar a SUNAT y anular comprobantes. */
@Component({
  selector: 'app-invoicing',
  imports: [FormsModule, DatePipe, DecimalPipe, LowerCasePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoicing.component.html',
  styleUrl: './invoicing.component.scss',
})
export class InvoicingComponent implements OnInit {
  readonly auth = input.required<string>();
  /** Reserva desde la que se pidió "Facturar" (prellena el formulario). */
  readonly fromBooking = input<AdminBooking | null>(null);
  /** Cotización aceptada que se quiere facturar. */
  readonly fromQuote = input<Quote | null>(null);
  readonly unauthorized = output<void>();

  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);

  protected readonly statusLabel = STATUS_LABEL;
  protected readonly settings = signal<InvoicingSettings | null>(null);
  protected readonly list = signal<Page<InvoiceSummary> | null>(null);
  protected readonly view = signal<Invoice | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly busyId = signal<number | null>(null);
  protected readonly logo = 'images/logo.jpg';
  protected readonly phone = business.phoneDisplay;
  protected readonly email = business.email;

  // ---- formulario ----
  protected readonly type = signal<InvoiceType>('BOLETA');
  protected readonly docType = signal<DocType>('1');
  protected docNumber = '';
  protected customerName = '';
  protected customerAddress = '';
  protected customerEmail = '';
  protected observations = '';
  protected bookingId: number | null = null;
  protected readonly items = signal<ItemRow[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  /** Por defecto los precios se escriben sin IGV y el sistema suma el 18 %. */
  protected readonly includesIgv = signal(false);
  protected readonly formError = signal('');

  protected readonly totals = computed(() =>
    this.items().reduce(
      (acc, it) => {
        const t = this.line(it);
        return { subtotal: acc.subtotal + t.subtotal, igv: acc.igv + t.igv, total: acc.total + t.total };
      },
      { subtotal: 0, igv: 0, total: 0 },
    ),
  );

  constructor() {
    effect(() => {
      const b = this.fromBooking();
      if (b) this.newFromBooking(b);
    });
    effect(() => {
      const q = this.fromQuote();
      if (q) this.newFromQuote(q);
    });
  }

  ngOnInit(): void {
    this.api.invoicingSettings(this.auth()).subscribe({ next: (s) => this.settings.set(s), error: (e) => this.fail(e) });
    this.load(0);
  }

  protected load(page: number): void {
    this.api.invoices(this.auth(), page).subscribe({ next: (p) => this.list.set(p), error: (e) => this.fail(e) });
  }

  protected openForm(): void {
    this.resetForm();
    this.formOpen.set(true);
  }

  private newFromBooking(b: AdminBooking): void {
    this.resetForm();
    this.bookingId = b.id;
    this.customerName = b.name;
    this.customerAddress = [b.address, b.district].filter(Boolean).join(', ');
    this.customerEmail = b.email ?? '';
    this.items.set([{ description: `${b.service} - Reserva ${b.code}`, quantity: 1, unitPrice: 0 }]);
    this.formOpen.set(true);
  }

  private newFromQuote(q: Quote): void {
    this.resetForm();
    const doc = (q.customerDoc ?? '').trim();
    if (isValidRuc(doc)) {
      this.setType('FACTURA');
      this.docNumber = doc;
    } else if (isValidDni(doc)) {
      this.docNumber = doc;
    }
    this.bookingId = q.bookingId;
    this.customerName = q.customerName;
    this.customerAddress = q.customerAddress ?? '';
    this.customerEmail = q.customerEmail ?? '';
    this.observations = `Según cotización ${q.code}`;
    // Se respeta cómo se cotizó: con o sin IGV.
    this.includesIgv.set(q.pricesIncludeIgv);
    this.items.set(q.items.map((it) => ({ description: it.description, quantity: it.quantity, unitPrice: it.unitPrice })));
    this.formOpen.set(true);
  }

  private resetForm(): void {
    this.type.set('BOLETA');
    this.docType.set('1');
    this.docNumber = '';
    this.customerName = '';
    this.customerAddress = '';
    this.customerEmail = '';
    this.observations = '';
    this.bookingId = null;
    this.includesIgv.set(false);
    this.items.set([{ description: '', quantity: 1, unitPrice: 0 }]);
    this.formError.set('');
  }

  protected setType(t: InvoiceType): void {
    this.type.set(t);
    if (t === 'FACTURA') this.docType.set('6');
    else if (this.docType() === '6') this.docType.set('1');
  }

  protected docHint(): string {
    const n = this.docNumber.trim();
    if (!n) return '';
    if (this.docType() === '6') return isValidRuc(n) ? '✓ RUC válido' : 'RUC no válido';
    if (this.docType() === '1') return isValidDni(n) ? '✓ DNI válido' : 'El DNI tiene 8 dígitos';
    return '';
  }

  protected addItem(): void {
    this.items.update((list) => [...list, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  protected removeItem(i: number): void {
    this.items.update((list) => (list.length > 1 ? list.filter((_, idx) => idx !== i) : list));
  }

  protected updateItem(i: number, field: keyof ItemRow, value: string): void {
    this.items.update((list) =>
      list.map((it, idx) => (idx === i ? { ...it, [field]: field === 'description' ? value : Number(value) } : it)),
    );
  }

  private line(it: ItemRow): { subtotal: number; igv: number; total: number } {
    const q = Number(it.quantity) || 0;
    const p = Number(it.unitPrice) || 0;
    return this.includesIgv() ? lineTotals(q, p) : lineTotalsPlusIgv(q, p);
  }

  /** Importe de la línea tal como se muestra: con IGV si los precios lo incluyen, sin IGV si no. */
  protected lineTotal(it: ItemRow): number {
    const t = this.line(it);
    return this.includesIgv() ? t.total : t.subtotal;
  }

  protected submit(): void {
    const error = this.validate();
    this.formError.set(error);
    if (error) return;
    const body: InvoiceRequest = {
      type: this.type(),
      customerDocType: this.docType(),
      customerDocNumber: this.docType() === '-' ? null : this.docNumber.trim(),
      customerName: this.customerName.trim(),
      customerAddress: this.customerAddress.trim() || null,
      customerEmail: this.customerEmail.trim() || null,
      bookingId: this.bookingId,
      observations: this.observations.trim() || null,
      pricesIncludeIgv: this.includesIgv(),
      items: this.items().map((it) => ({ description: it.description.trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
    };
    this.saving.set(true);
    this.api.createInvoice(this.auth(), body).subscribe({
      next: (inv) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.view.set(inv);
        this.load(0);
        this.notifyResult(inv);
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(describeError(e).message);
        this.fail(e, false);
      },
    });
  }

  private validate(): string {
    const doc = this.docNumber.trim();
    if (this.type() === 'FACTURA') {
      if (!isValidRuc(doc)) return 'Para emitir factura ingresa un RUC válido de 11 dígitos.';
      if (!this.customerAddress.trim()) return 'Para emitir factura ingresa la dirección fiscal del cliente.';
    } else {
      if (this.docType() === '1' && !isValidDni(doc)) return 'El DNI debe tener 8 dígitos.';
      if (this.docType() === '6' && !isValidRuc(doc)) return 'El RUC no es válido.';
      if (this.docType() === '-' && this.totals().total >= 700) return 'Para boletas desde S/ 700 debes indicar el DNI del cliente.';
    }
    if (!this.customerName.trim()) return 'Ingresa el nombre o razón social del cliente.';
    if (this.items().some((it) => !it.description.trim() || !(Number(it.quantity) > 0) || !(Number(it.unitPrice) > 0))) {
      return 'Cada ítem necesita descripción, cantidad y precio mayor a 0.';
    }
    return '';
  }

  protected open(s: InvoiceSummary): void {
    this.api.invoice(this.auth(), s.id).subscribe({ next: (inv) => this.view.set(inv), error: (e) => this.fail(e) });
  }

  protected send(id: number): void {
    this.busyId.set(id);
    this.api.sendInvoice(this.auth(), id).subscribe({
      next: (inv) => {
        this.busyId.set(null);
        if (this.view()?.id === id) this.view.set(inv);
        this.load(this.list()?.page ?? 0);
        this.notifyResult(inv);
      },
      error: (e) => {
        this.busyId.set(null);
        this.fail(e);
      },
    });
  }

  protected voidInvoice(id: number): void {
    const reason = prompt('Motivo de la anulación (por ejemplo: error en el RUC del cliente):');
    if (!reason?.trim()) return;
    this.busyId.set(id);
    this.api.voidInvoice(this.auth(), id, reason.trim()).subscribe({
      next: (inv) => {
        this.busyId.set(null);
        if (this.view()?.id === id) this.view.set(inv);
        this.load(this.list()?.page ?? 0);
        this.ui.toast('success', `${inv.fullNumber} anulado`);
      },
      error: (e) => {
        this.busyId.set(null);
        this.fail(e);
      },
    });
  }

  protected print(): void {
    document.body.classList.add('printing-invoice');
    setTimeout(() => {
      print();
      document.body.classList.remove('printing-invoice');
    }, 50);
  }

  protected docLabel(code: string): string {
    return { '6': 'RUC', '1': 'DNI', '4': 'C.E.', '-': 'Sin documento' }[code] ?? code;
  }

  protected canSend(s: { status: InvoiceStatus }): boolean {
    return !!this.settings()?.electronicEnabled && ['BORRADOR', 'ERROR_ENVIO', 'RECHAZADA'].includes(s.status);
  }

  private notifyResult(inv: Invoice): void {
    if (inv.status === 'ACEPTADA') this.ui.toast('success', `${inv.fullNumber} aceptado`, inv.sunatDescription ?? undefined);
    else if (inv.status === 'BORRADOR') this.ui.toast('info', `${inv.fullNumber} guardado como borrador`, 'No fue enviado a SUNAT.');
    else this.ui.toast('error', `${inv.fullNumber}: ${STATUS_LABEL[inv.status]}`, inv.sunatDescription ?? undefined);
  }

  private fail(e: HttpErrorResponse, toast = true): void {
    if (e.status === 401) {
      this.unauthorized.emit();
      return;
    }
    if (toast) this.ui.toast('error', 'Error', describeError(e).message);
  }
}

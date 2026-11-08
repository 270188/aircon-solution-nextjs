import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, BookingCreated, SlotAvailability, describeError } from '../core/api.service';
import { ServiceId, bookableServices, business, services, whatsappLink } from '../core/site.data';
import { UiService } from '../core/ui.service';
import { launchConfetti } from '../shared/confetti';
import { MONTHS, WEEKDAYS_SHORT, buildIcs, longDate, prettyTime, toIsoDate } from '../shared/dates';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { RippleDirective } from '../shared/ripple.directive';

interface DayCell {
  day: number;
  iso: string;
  disabled: boolean;
  today: boolean;
}

/** Debe coincidir con app.booking del backend; se usa solo si la API no responde. */
const FALLBACK_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const MAX_DAYS_AHEAD = 60;
type Field = 'name' | 'phone' | 'email' | 'address' | 'district' | 'description' | 'privacyAccepted';
const PHONE = /^\+?[0-9 ()-]{7,20}$/;

@Component({
  selector: 'app-booking',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, RevealDirective, RippleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
})
export class BookingComponent {
  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  protected readonly weekdays = WEEKDAYS_SHORT;
  protected readonly steps = ['Servicio', 'Fecha y hora', 'Tus datos'];
  protected readonly serviceOptions = bookableServices.map((s) => ({
    ...s,
    icon: services.find((x) => x.id === s.id)?.icon ?? 'bolt',
  }));
  protected readonly prettyTime = prettyTime;
  protected readonly longDate = longDate;

  protected readonly step = signal(0);
  protected readonly service = signal<ServiceId | null>(null);
  protected readonly date = signal<string | null>(null);
  protected readonly time = signal<string | null>(null);

  private readonly today = new Date();
  protected readonly viewMonth = signal(new Date(this.today.getFullYear(), this.today.getMonth(), 1));
  protected readonly monthAnim = signal<'next' | 'prev'>('next');

  protected readonly slots = signal<SlotAvailability[]>([]);
  protected readonly slotsLoading = signal(false);
  protected readonly dayClosed = signal(false);
  protected readonly offline = signal(false);

  protected readonly submitting = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly result = signal<BookingCreated | null>(null);
  protected readonly submitFailed = signal(false);

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(PHONE)]],
    email: ['', [Validators.email, Validators.maxLength(160)]],
    address: ['', [Validators.required, Validators.maxLength(200)]],
    district: ['', [Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(1000)]],
    privacyAccepted: [false, [Validators.requiredTrue]],
    website: [''],
  });

  protected readonly monthLabel = computed(() => {
    const m = this.viewMonth();
    return `${MONTHS[m.getMonth()]} ${m.getFullYear()}`;
  });

  protected readonly canGoPrev = computed(() => {
    const m = this.viewMonth();
    return m.getFullYear() > this.today.getFullYear() || m.getMonth() > this.today.getMonth();
  });

  protected readonly canGoNext = computed(() => {
    const limit = new Date(this.today);
    limit.setDate(limit.getDate() + MAX_DAYS_AHEAD);
    const m = this.viewMonth();
    return new Date(m.getFullYear(), m.getMonth() + 1, 1) <= limit;
  });

  protected readonly cells = computed<(DayCell | null)[]>(() => {
    const first = this.viewMonth();
    const year = first.getFullYear();
    const month = first.getMonth();
    const lead = (first.getDay() + 6) % 7; // lunes primero
    const days = new Date(year, month + 1, 0).getDate();
    const start = new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate());
    const limit = new Date(start);
    limit.setDate(limit.getDate() + MAX_DAYS_AHEAD);
    const cells: (DayCell | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month, d);
      cells.push({
        day: d,
        iso: toIsoDate(date),
        disabled: date < start || date > limit || date.getDay() === 0,
        today: date.getTime() === start.getTime(),
      });
    }
    return cells;
  });

  protected readonly serviceLabel = computed(
    () => this.serviceOptions.find((s) => s.id === this.service())?.label ?? '',
  );

  constructor() {
    // Si el visitante pulsó "Reservar este servicio" en otra sección, lo preseleccionamos.
    effect(() => {
      const pre = this.ui.preselectedService();
      if (pre) {
        this.service.set(pre);
        if (this.step() === 0) this.step.set(1);
        this.ui.preselectedService.set(null);
      }
    });
  }

  protected chooseService(id: ServiceId): void {
    this.service.set(id);
    setTimeout(() => this.goTo(1), 250);
  }

  protected changeMonth(delta: number): void {
    this.monthAnim.set(delta > 0 ? 'next' : 'prev');
    const m = this.viewMonth();
    this.viewMonth.set(new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  protected pickDate(cell: DayCell): void {
    if (cell.disabled) return;
    this.date.set(cell.iso);
    this.time.set(null);
    this.slotsLoading.set(true);
    this.dayClosed.set(false);
    this.api.availability(cell.iso).subscribe({
      next: (a) => {
        this.offline.set(false);
        this.dayClosed.set(!a.open);
        this.slots.set(a.slots);
        this.slotsLoading.set(false);
      },
      error: () => {
        // Sin conexión con el servidor: mostramos horarios referenciales y se confirma por WhatsApp.
        this.offline.set(true);
        this.slots.set(FALLBACK_SLOTS.map((time) => ({ time, available: true })));
        this.slotsLoading.set(false);
      },
    });
  }

  protected goTo(step: number): void {
    if (step >= 1 && !this.service()) return;
    if (step >= 2 && (!this.date() || !this.time())) return;
    this.step.set(step);
    const el = this.card().nativeElement;
    if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected invalid(name: Field): boolean {
    const c = this.form.controls[name];
    return (c.invalid && (c.touched || c.dirty)) || !!this.serverErrors()[name];
  }

  protected errorFor(name: Field): string {
    const server = this.serverErrors()[name];
    if (server) return server;
    const c = this.form.controls[name];
    if (c.hasError('required')) {
      return name === 'privacyAccepted' ? 'Debes aceptar la política de privacidad.' : 'Este campo es obligatorio.';
    }
    if (c.hasError('requiredTrue')) return 'Debes aceptar la política de privacidad.';
    if (c.hasError('minlength')) return 'Es demasiado corto.';
    if (c.hasError('maxlength')) return 'Es demasiado largo.';
    if (c.hasError('pattern')) return 'Ingresa un teléfono válido, por ejemplo 985 899 731.';
    if (c.hasError('email')) return 'Ingresa un correo válido.';
    return '';
  }

  protected submit(): void {
    this.serverErrors.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.ui.toast('error', 'Revisa el formulario', 'Hay campos por completar o corregir.');
      return;
    }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.submitFailed.set(false);
    this.api
      .createBooking({
        ...v,
        email: v.email || null,
        district: v.district || null,
        description: v.description || null,
        service: this.service()!,
        date: this.date()!,
        time: this.time()!,
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.result.set(res);
          this.step.set(3);
          setTimeout(() => launchConfetti(this.card().nativeElement), 150);
        },
        error: (err) => {
          this.submitting.set(false);
          const { message, fields } = describeError(err);
          this.serverErrors.set(fields);
          this.submitFailed.set(true);
          this.ui.toast('error', 'No pudimos registrar tu reserva', message);
          if ((err as { status?: number }).status === 409 && this.date()) {
            // El horario se ocupó: recargamos la disponibilidad y volvemos al paso de fecha.
            const iso = this.date()!;
            this.goTo(1);
            this.pickDate({ day: 0, iso, disabled: false, today: false });
          }
        },
      });
  }

  protected whatsappSummary(): string {
    const v = this.form.getRawValue();
    const r = this.result();
    const lines = [
      r ? `Hola AIRCONSOLUTION SERVICES SAC, acabo de reservar una visita (código ${r.code}).` : 'Hola AIRCONSOLUTION SERVICES SAC, quiero reservar una visita:',
      `Servicio: ${this.serviceLabel()}`,
      `Fecha: ${this.date() ? longDate(this.date()!) : ''} - ${this.time() ? prettyTime(this.time()!) : ''}`,
      `Nombre: ${v.name}`,
      `Teléfono: ${v.phone}`,
      `Dirección: ${v.address}${v.district ? ', ' + v.district : ''}`,
    ];
    if (v.description) lines.push(`Detalle: ${v.description}`);
    return whatsappLink(lines.join('\n'));
  }

  protected downloadIcs(): void {
    const r = this.result();
    if (!r) return;
    const ics = buildIcs({ code: r.code, date: r.date, time: r.time, title: r.service, address: this.form.getRawValue().address });
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `reserva-${r.code}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  protected copyCode(): void {
    const code = this.result()?.code;
    if (!code) return;
    navigator.clipboard?.writeText(code).then(
      () => this.ui.toast('success', 'Código copiado', code),
      () => undefined,
    );
  }

  protected reset(): void {
    this.form.reset();
    this.service.set(null);
    this.date.set(null);
    this.time.set(null);
    this.result.set(null);
    this.step.set(0);
  }

  protected readonly business = business;
}

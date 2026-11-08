import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ApiService, BookingStatus, BookingTracking, describeError } from '../core/api.service';
import { whatsappLink } from '../core/site.data';
import { longDate, prettyTime } from '../shared/dates';
import { IconComponent } from '../shared/icon.component';
import { RippleDirective } from '../shared/ripple.directive';

const FLOW: { status: BookingStatus; label: string; text: string }[] = [
  { status: 'PENDIENTE', label: 'Recibida', text: 'Registramos tu solicitud.' },
  { status: 'CONFIRMADA', label: 'Confirmada', text: 'Un asesor confirmó tu visita.' },
  { status: 'EN_PROCESO', label: 'En proceso', text: 'El técnico está trabajando.' },
  { status: 'COMPLETADA', label: 'Completada', text: '¡Servicio terminado!' },
];

@Component({
  selector: 'app-tracking-page',
  imports: [FormsModule, IconComponent, RippleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page-shell.scss',
  template: `
    <div class="container narrow">
      <div class="page-head">
        <span class="eyebrow">Seguimiento</span>
        <h1 class="section-title">Sigue tu <span class="text-gradient">reserva</span></h1>
        <p>Ingresa el código que recibiste al reservar (por ejemplo, ACS-7KQ2MX).</p>
      </div>

      <form class="search card" (ngSubmit)="search()">
        <label for="code" class="sr-only">Código de reserva</label>
        <app-icon name="ticket" [size]="22" />
        <input id="code" name="code" [(ngModel)]="code" placeholder="ACS-XXXXXX" autocomplete="off" maxlength="12"
          (input)="code = code.toUpperCase()" required />
        <button class="btn btn-primary" type="submit" [disabled]="loading() || code.trim().length < 5" appRipple>
          @if (loading()) { <span class="spinner"></span> } @else { Buscar }
        </button>
      </form>

      @if (error()) {
        <p class="error-box" role="alert"><app-icon name="close" [size]="18" /> {{ error() }}</p>
      }

      @if (result(); as r) {
        <div class="result card" role="status">
          <div class="top">
            <div>
              <small>Reserva</small>
              <h2>{{ r.code }}</h2>
            </div>
            <span class="pill" [class]="'pill ' + r.status.toLowerCase()">{{ statusLabel(r.status) }}</span>
          </div>
          <dl>
            <div><dt>Servicio</dt><dd>{{ r.service }}</dd></div>
            <div><dt>Fecha</dt><dd class="cap">{{ longDate(r.date) }}</dd></div>
            <div><dt>Hora</dt><dd>{{ prettyTime(r.time) }}</dd></div>
          </dl>

          @if (r.status === 'CANCELADA') {
            <p class="cancel">Esta reserva fue cancelada. Si fue un error, escríbenos y la reprogramamos.</p>
          } @else {
            <ol class="flow">
              @for (f of flow; track f.status; let i = $index) {
                <li [class.done]="i <= stepIndex()" [class.now]="i === stepIndex()" [style.--i]="i">
                  <span class="dot">@if (i <= stepIndex()) { <app-icon name="check" [size]="14" [stroke]="3" /> }</span>
                  <div><strong>{{ f.label }}</strong><small>{{ f.text }}</small></div>
                </li>
              }
            </ol>
          }
          <a class="btn btn-whatsapp btn-sm" [href]="waFor(r.code)" target="_blank" rel="noopener">
            <app-icon name="whatsapp" [size]="18" /> Consultar por WhatsApp
          </a>
        </div>
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 760px; }
    .search { display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 20px; border-radius: 999px; animation: fadeUp .7s .1s both; }
    .search app-icon { color: var(--blue-500); }
    .search input { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 1.15rem; font-weight: 700; letter-spacing: .08em; padding: 10px 0; }
    .search input:focus { outline: none; }
    .error-box { display: flex; gap: 8px; align-items: center; margin-top: 18px; padding: 14px 18px; border-radius: 14px; background: rgba(239,68,68,.1); color: var(--red-500); animation: shake .4s; }
    .result { margin-top: 28px; padding: 28px; animation: fadeUp .6s var(--ease-out) both; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 20px; }
    .top small { color: var(--text-muted); }
    .top h2 { font-size: 1.8rem; letter-spacing: .06em; }
    .pill { padding: 6px 14px; border-radius: 999px; font-size: .82rem; font-weight: 700; background: var(--bg-soft); }
    .pill.pendiente { background: rgba(245,130,31,.15); color: var(--orange-600); }
    .pill.confirmada, .pill.en_proceso { background: rgba(30,136,229,.15); color: var(--blue-500); }
    .pill.completada { background: rgba(34,197,94,.15); color: #16a34a; }
    .pill.cancelada { background: rgba(239,68,68,.12); color: var(--red-500); }
    dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 26px; }
    dl div { padding: 14px; border-radius: 14px; background: var(--bg-soft); }
    dt { font-size: .78rem; color: var(--text-muted); } dd { font-weight: 700; }
    .cap::first-letter { text-transform: uppercase; }
    .flow { list-style: none; display: grid; gap: 0; margin-bottom: 26px; }
    .flow li { position: relative; display: flex; gap: 14px; padding-bottom: 22px; opacity: .5; animation: fadeUp .5s var(--ease-out) both; animation-delay: calc(.2s + var(--i) * .12s); }
    .flow li:not(:last-child)::before { content: ''; position: absolute; left: 13px; top: 28px; bottom: 0; width: 2px; background: var(--border); }
    .flow li.done { opacity: 1; } .flow li.done:not(:last-child)::before { background: var(--blue-500); }
    .dot { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--border); display: grid; place-items: center; flex-shrink: 0; background: var(--bg-elevated); color: #fff; }
    .done .dot { background: var(--grad-ice); border-color: transparent; }
    .now .dot { box-shadow: 0 0 0 0 rgba(30,136,229,.6); animation: nowPulse 1.8s infinite; }
    @keyframes nowPulse { 70% { box-shadow: 0 0 0 12px rgba(30,136,229,0); } 100% { box-shadow: 0 0 0 0 rgba(30,136,229,0); } }
    .flow strong { display: block; } .flow small { color: var(--text-muted); }
    .cancel { color: var(--red-500); margin-bottom: 18px; }
  `,
})
export class TrackingPage implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected code = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<BookingTracking | null>(null);
  protected readonly flow = FLOW;
  protected readonly longDate = longDate;
  protected readonly prettyTime = prettyTime;
  protected readonly stepIndex = computed(() => FLOW.findIndex((f) => f.status === this.result()?.status));

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('codigo');
    if (code) {
      this.code = code.toUpperCase();
      this.search();
    }
  }

  protected search(): void {
    const code = this.code.trim();
    if (!code) return;
    this.loading.set(true);
    this.error.set('');
    this.router.navigate([], { queryParams: { codigo: code }, replaceUrl: true });
    this.api.trackBooking(code).subscribe({
      next: (r) => {
        this.loading.set(false);
        this.result.set(r);
      },
      error: (err) => {
        this.loading.set(false);
        this.result.set(null);
        this.error.set(describeError(err).message);
      },
    });
  }

  protected statusLabel(s: BookingStatus): string {
    return { PENDIENTE: 'Pendiente', CONFIRMADA: 'Confirmada', EN_PROCESO: 'En proceso', COMPLETADA: 'Completada', CANCELADA: 'Cancelada' }[s];
  }

  protected waFor(code: string): string {
    return whatsappLink(`Hola AIRCONSOLUTION SERVICES SAC, quisiera consultar por mi reserva ${code}.`);
  }
}

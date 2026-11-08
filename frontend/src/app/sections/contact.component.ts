import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, describeError } from '../core/api.service';
import { business, whatsappLink } from '../core/site.data';
import { UiService } from '../core/ui.service';
import { IconComponent } from '../shared/icon.component';
import { RevealDirective } from '../shared/reveal.directive';
import { RippleDirective } from '../shared/ripple.directive';

type Field = 'name' | 'phone' | 'email' | 'message' | 'privacyAccepted';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule, RouterLink, IconComponent, RevealDirective, RippleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  private readonly api = inject(ApiService);
  private readonly ui = inject(UiService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly business = business;
  protected readonly wa = whatsappLink();
  // URL fija de Google Maps definida en site.data, no proviene del usuario.
  protected readonly mapUrl: SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(business.mapEmbedSrc);
  protected readonly showMap = signal(false);

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly serverErrors = signal<Record<string, string>>({});

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ()-]{7,20}$/)]],
    email: ['', [Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    privacyAccepted: [false, [Validators.requiredTrue]],
    website: [''],
  });

  protected readonly newsletterEmail = signal('');
  protected readonly newsletterState = signal<'idle' | 'sending' | 'done'>('idle');

  protected invalid(name: Field): boolean {
    const c = this.form.controls[name];
    return (c.invalid && c.touched) || !!this.serverErrors()[name];
  }

  protected errorFor(name: Field): string {
    const server = this.serverErrors()[name];
    if (server) return server;
    const c = this.form.controls[name];
    if (c.hasError('required') || c.hasError('requiredTrue')) {
      return name === 'privacyAccepted' ? 'Debes aceptar la política de privacidad.' : 'Este campo es obligatorio.';
    }
    if (c.hasError('minlength')) return name === 'message' ? 'Cuéntanos un poco más (mínimo 10 caracteres).' : 'Es demasiado corto.';
    if (c.hasError('pattern')) return 'Ingresa un teléfono válido.';
    if (c.hasError('email')) return 'Ingresa un correo válido.';
    return 'Revisa este campo.';
  }

  protected submit(): void {
    this.serverErrors.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.sending.set(true);
    this.api.sendContact({ ...v, email: v.email || null }).subscribe({
      next: (res) => {
        this.sending.set(false);
        this.sent.set(true);
        this.form.reset();
        this.ui.toast('success', '¡Mensaje enviado!', res.message);
      },
      error: (err) => {
        this.sending.set(false);
        const { message, fields } = describeError(err);
        this.serverErrors.set(fields);
        this.ui.toast('error', 'No se pudo enviar', message);
      },
    });
  }

  protected subscribe(e: Event, honeypot: string): void {
    e.preventDefault();
    const email = this.newsletterEmail().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.ui.toast('error', 'Correo inválido', 'Revisa que tu correo esté bien escrito.');
      return;
    }
    this.newsletterState.set('sending');
    this.api.subscribe(email, honeypot).subscribe({
      next: (res) => {
        this.newsletterState.set('done');
        this.ui.toast('success', '¡Suscripción lista!', res.message);
      },
      error: (err) => {
        this.newsletterState.set('idle');
        this.ui.toast('error', 'No se pudo suscribir', describeError(err).message);
      },
    });
  }
}

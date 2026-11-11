import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

import { business, navLinks, services, whatsappLink } from '../core/site.data';
import { UiService } from '../core/ui.service';
import { IconComponent } from '../shared/icon.component';
import { FACEBOOK_ANDROID_PACKAGE, TIKTOK_ANDROID_PACKAGE, appLink } from '../shared/app-link';
import { RevealDirective } from '../shared/reveal.directive';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, IconComponent, RevealDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <svg class="waves" viewBox="0 0 2880 120" preserveAspectRatio="none" aria-hidden="true">
        <path class="w1" d="M0 60c240 40 480 40 720 0s480-40 720 0 480 40 720 0 480-40 720 0v60H0z" />
      </svg>
      <div class="container grid">
        <div class="brand" appReveal="up">
          <div class="logo">
            <img src="images/logo.jpg" alt="" width="52" height="52" />
            <div><strong><span>AIRCON</span><span class="con">SOLUTION</span></strong><small>SERVICES SAC</small></div>
          </div>
          <p>Expertos en climatización, electricidad y mantenimiento para hogares, negocios e industrias en Lima.</p>
          <div class="social">
            <a [href]="wa" target="_blank" rel="noopener" aria-label="WhatsApp"><app-icon name="whatsapp" [size]="20" /></a>
            @if (business.facebook) {
              <a [href]="facebook.href" [attr.target]="facebook.newTab ? '_blank' : null" rel="noopener" aria-label="Facebook"><app-icon name="facebook" [size]="20" /></a>
            }
            @if (business.instagram) {
              <a [href]="business.instagram" target="_blank" rel="noopener" aria-label="Instagram"><app-icon name="instagram" [size]="20" /></a>
            }
            @if (business.tiktok) {
              <a [href]="tiktok.href" [attr.target]="tiktok.newTab ? '_blank' : null" rel="noopener" aria-label="TikTok"><app-icon name="tiktok" [size]="20" /></a>
            }
            <a [href]="'mailto:' + business.email" aria-label="Correo"><app-icon name="mail" [size]="20" /></a>
          </div>
        </div>

        <div appReveal="up" [revealDelay]="80">
          <h4>Navegación</h4>
          <ul>
            @for (l of links; track l.id) {
              <li><a [href]="'/#' + l.id" (click)="go(l.id, $event)">{{ l.label }}</a></li>
            }
            <li><a routerLink="/seguimiento">Seguir mi reserva</a></li>
          </ul>
        </div>

        <div appReveal="up" [revealDelay]="160">
          <h4>Servicios</h4>
          <ul>
            @for (s of services; track s.id) {
              <li><a href="/#reservar" (click)="book(s.id, $event)">{{ s.title }}</a></li>
            }
          </ul>
        </div>

        <div appReveal="up" [revealDelay]="240">
          <h4>Contacto</h4>
          <ul class="contact">
            <li><app-icon name="phone" [size]="18" /><a [href]="'tel:' + business.phone">{{ business.phoneDisplay }}</a></li>
            <li><app-icon name="phone" [size]="18" /><a [href]="'tel:' + business.phone2">{{ business.phone2Display }}</a></li>
            <li><app-icon name="mail" [size]="18" /><a [href]="'mailto:' + business.email">{{ business.email }}</a></li>
            <li><app-icon name="pin" [size]="18" /><span>{{ business.address }}</span></li>
            <li><app-icon name="clock" [size]="18" /><span>{{ business.hours }}</span></li>
          </ul>
        </div>
      </div>
      <div class="container bottom">
        <p>© {{ year }} {{ business.name }}. Todos los derechos reservados.</p>
        <nav aria-label="Legal">
          <a routerLink="/privacidad">Política de privacidad</a>
          <a routerLink="/admin">Panel</a>
        </nav>
      </div>
      <p class="container credit">
        Esta página fue realizada por la desarrolladora de software <strong>Angela Valeria Ruiz León</strong>
        · <a class="dev-phone" href="https://wa.me/51990073634" target="_blank" rel="noopener" aria-label="WhatsApp de la desarrolladora: 990 073 634">
          <app-icon name="whatsapp" [size]="15" /> 990 073 634</a>
      </p>
    </footer>
  `,
  styles: `
    .footer { position: relative; background: var(--navy-950); color: #b7c3d1; padding: 120px 0 28px; margin-top: 40px; overflow: hidden; }
    .waves { position: absolute; top: -1px; left: 0; width: 200%; max-width: none; height: 90px; transform: scaleY(-1); animation: wave 14s linear infinite; }
    .w1 { fill: var(--bg); }
    @keyframes wave { to { transform: translateX(-50%) scaleY(-1); } }
    .grid { display: grid; gap: 40px; grid-template-columns: 1fr; }
    @media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1024px) { .grid { grid-template-columns: 1.4fr 1fr 1.2fr 1.4fr; } }
    .logo { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    .logo img { border-radius: 50%; }
    .logo strong { font-family: var(--font-display); font-size: 1.4rem; color: #fff; display: block; line-height: 1; }
    .logo .con { color: var(--orange-500); }
    .logo small { letter-spacing: .38em; font-size: .6rem; font-weight: 700; }
    h4 { color: #fff; font-size: 1.05rem; margin-bottom: 18px; }
    ul { display: grid; gap: 10px; }
    a { transition: color .2s, padding .3s var(--ease-out); }
    ul a:hover { color: #fff; padding-left: 6px; }
    .contact li { display: flex; gap: 10px; align-items: flex-start; }
    .contact app-icon { color: var(--ice-400); margin-top: 3px; }
    .social { display: flex; gap: 10px; margin-top: 18px; }
    .social a { width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.06);
      color: #fff; transition: transform .35s var(--ease-spring), background .3s; }
    .social a:hover { background: var(--blue-500); transform: translateY(-4px) rotate(-8deg); }
    .bottom { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; margin-top: 56px; padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,.08); font-size: .88rem; }
    .bottom nav { display: flex; gap: 18px; }
    .credit { margin-top: 18px; text-align: center; font-size: .85rem; color: #8a9bb0; }
    /* espacio para que los botones flotantes no tapen el crédito en el celular */
    @media (max-width: 720px) { .footer { padding-bottom: 170px; } }
    .credit strong { color: #fff; font-weight: 600; }
    .dev-phone { display: inline-flex; align-items: center; gap: 5px; color: #fff; font-weight: 600; white-space: nowrap; }
    .dev-phone:hover { color: var(--green-500); }
    .bottom a:hover { color: #fff; }
  `,
})
export class FooterComponent {
  protected readonly business = business;
  protected readonly links = navLinks;
  protected readonly services = services;
  protected readonly wa = whatsappLink();
  protected readonly tiktok = appLink(business.tiktok, TIKTOK_ANDROID_PACKAGE, inject(DomSanitizer));
  protected readonly facebook = appLink(business.facebook, FACEBOOK_ANDROID_PACKAGE, inject(DomSanitizer));
  protected readonly year = new Date().getFullYear();
  private readonly ui = inject(UiService);
  private readonly router = inject(Router);

  protected go(id: string, e: Event): void {
    e.preventDefault();
    if (this.router.url.split('#')[0] !== '/') this.router.navigate(['/'], { fragment: id });
    else this.ui.scrollTo(id);
  }

  protected book(id: (typeof services)[number]['id'], e: Event): void {
    e.preventDefault();
    this.ui.preselectedService.set(id);
    this.go('reservar', e);
  }
}

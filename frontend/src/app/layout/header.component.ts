import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';

import { business, navLinks, whatsappLink } from '../core/site.data';
import { UiService } from '../core/ui.service';
import { FACEBOOK_ANDROID_PACKAGE, TIKTOK_ANDROID_PACKAGE, appLink } from '../shared/app-link';
import { IconComponent } from '../shared/icon.component';
import { MagneticDirective } from '../shared/magnetic.directive';
import { RippleDirective } from '../shared/ripple.directive';

@Component({
  selector: 'app-header',
  imports: [RouterLink, IconComponent, MagneticDirective, RippleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  protected readonly ui = inject(UiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly links = navLinks;
  protected readonly business = business;
  protected readonly tiktok = appLink(business.tiktok, TIKTOK_ANDROID_PACKAGE, inject(DomSanitizer));
  protected readonly facebook = appLink(business.facebook, FACEBOOK_ANDROID_PACKAGE, inject(DomSanitizer));
  protected readonly wa = whatsappLink();
  protected readonly scrolled = signal(false);
  protected readonly hidden = signal(false);
  protected readonly menuOpen = signal(false);
  protected readonly active = signal('inicio');
  /** Fuera de la portada no hay imagen oscura detrás: la cabecera va siempre sólida. */
  protected readonly onHome = signal(true);

  private lastY = 0;

  ngOnInit(): void {
    const syncRoute = () => this.onHome.set(this.router.url.split(/[?#]/)[0] === '/');
    syncRoute();
    const sub = this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(syncRoute);

    const onScroll = () => {
      const y = scrollY;
      this.scrolled.set(y > 40);
      // Se oculta al bajar y reaparece al subir.
      this.hidden.set(y > 400 && y > this.lastY && !this.menuOpen());
      this.lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true });

    // Resalta en el menú la sección visible (scrollspy).
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) this.active.set(e.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    const observe = () => navLinks.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) spy.observe(el);
    });
    setTimeout(observe, 300);

    this.destroyRef.onDestroy(() => {
      removeEventListener('scroll', onScroll);
      spy.disconnect();
      sub.unsubscribe();
    });
  }

  protected go(id: string, event?: Event): void {
    event?.preventDefault();
    this.closeMenu();
    if (this.router.url.split('#')[0] !== '/') {
      this.router.navigate(['/'], { fragment: id });
      return;
    }
    this.ui.scrollTo(id);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    document.body.classList.toggle('no-scroll', this.menuOpen());
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
    document.body.classList.remove('no-scroll');
  }

  protected toggleTheme(e: MouseEvent): void {
    this.ui.toggleTheme({ x: e.clientX, y: e.clientY });
  }
}

import { SafeUrl, DomSanitizer } from '@angular/platform-browser';

export interface AppLink {
  href: string | SafeUrl;
  /** Abrir en otra pestaña (solo para la versión web). */
  newTab: boolean;
}

/**
 * Enlace que en Android abre directo la app indicada (con la web como respaldo si no está instalada).
 * En iPhone el enlace https normal ya abre la app instalada; en computadora abre la web.
 */
export function appLink(url: string, androidPackage: string, sanitizer: DomSanitizer): AppLink {
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  if (!isAndroid) {
    return { href: url, newTab: !/iPhone|iPad|iPod/i.test(navigator?.userAgent ?? '') };
  }
  const { host, pathname, search } = new URL(url);
  const intent =
    `intent://${host}${pathname}${search}#Intent;scheme=https;package=${androidPackage};` +
    `S.browser_fallback_url=${encodeURIComponent(url)};end`;
  // URL construida aquí a partir de una constante del sitio; Angular bloquearía el esquema intent:// por defecto.
  return { href: sanitizer.bypassSecurityTrustUrl(intent), newTab: false };
}

export const TIKTOK_ANDROID_PACKAGE = 'com.zhiliaoapp.musically';

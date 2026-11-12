export interface AppLink {
  href: string;
  /** Abrir en otra pestaña (solo para la versión web). */
  newTab: boolean;
}

/**
 * Enlace que en Android abre directo la app indicada (con la web como respaldo si no está instalada).
 * En iPhone el enlace https normal ya abre la app instalada; en computadora abre la web.
 */
export function appLink(url: string, androidPackage: string): AppLink {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (!/Android/i.test(ua)) {
    return { href: url, newTab: !/iPhone|iPad|iPod/i.test(ua) };
  }
  const { host, pathname, search } = new URL(url);
  return {
    href:
      `intent://${host}${pathname}${search}#Intent;scheme=https;package=${androidPackage};` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`,
    newTab: false,
  };
}

export const TIKTOK_ANDROID_PACKAGE = 'com.zhiliaoapp.musically';
export const FACEBOOK_ANDROID_PACKAGE = 'com.facebook.katana';

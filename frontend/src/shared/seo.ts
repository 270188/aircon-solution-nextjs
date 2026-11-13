import { SITE_URL, pageSeo } from '../core/site.data';

const NOT_FOUND = {
  title: 'Página no encontrada | AIRCONSOLUTION SERVICES SAC',
  description: 'La página que buscas no existe.',
  noindex: true,
};

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Actualiza título, descripción, URL canónica, vista previa social e indexación según la página. */
export function applySeo(pathname: string): void {
  const seo = pageSeo[pathname] ?? NOT_FOUND;
  const url = `${SITE_URL}${pathname === '/' ? '/' : pathname}`;
  document.title = seo.title;
  setMeta('name', 'description', seo.description);
  setMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1');
  setMeta('property', 'og:title', seo.title);
  setMeta('property', 'og:description', seo.description);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', seo.title);
  setMeta('name', 'twitter:description', seo.description);
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (canonical) canonical.href = url;
}

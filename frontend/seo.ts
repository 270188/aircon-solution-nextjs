/**
 * SEO generado en la compilación a partir de src/core/site.data.ts:
 *  - Datos estructurados (Schema.org) del negocio local, el sitio web y las preguntas frecuentes.
 *  - Contenido HTML de respaldo dentro de #root para buscadores y visitantes sin JavaScript
 *    (React lo reemplaza al cargar).
 *  - sitemap.xml con las fotos de trabajos para Google Imágenes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { Plugin } from 'vite';

import {
  SITE_URL,
  business,
  checklist,
  coverage,
  faqs,
  galleryItems,
  pageSeo,
  quoteProcess,
  sectors,
  servicePages,
  services,
  type ServicePageData,
} from './src/core/site.data';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path: string) => `${SITE_URL}/${path.replace(/^\//, '')}`;

function structuredData(withFaq = true): string {
  const id = `${SITE_URL}/#negocio`;
  const graph = [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#web`,
      url: `${SITE_URL}/`,
      name: business.name,
      inLanguage: 'es-PE',
      publisher: { '@id': id },
    },
    {
      '@type': 'HVACBusiness',
      '@id': id,
      name: business.name,
      legalName: business.legalName,
      taxID: business.ruc,
      url: `${SITE_URL}/`,
      logo: abs('images/logo.jpg'),
      image: [abs('images/hero.jpg'), ...galleryItems.slice(0, 5).map((g) => abs(`${g.image}.jpg`))],
      description: pageSeo['/'].description,
      telephone: business.phone,
      email: business.email,
      priceRange: '$$',
      currenciesAccepted: 'PEN',
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.street,
        addressLocality: business.district,
        addressRegion: business.region,
        addressCountry: 'PE',
      },
      areaServed: [
        { '@type': 'City', name: 'Lima' },
        { '@type': 'City', name: 'Callao' },
      ],
      hasMap: business.mapLink,
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: business.openingDays, opens: business.opens, closes: business.closes },
      ],
      contactPoint: [business.phone, business.phone2].map((telephone) => ({
        '@type': 'ContactPoint',
        telephone,
        contactType: 'customer service',
        areaServed: 'PE',
        availableLanguage: 'Spanish',
      })),
      sameAs: [business.facebook, business.instagram, business.tiktok].filter(Boolean),
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios',
        itemListElement: services.map((s) => ({
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: s.title, description: s.description, areaServed: 'Lima' },
        })),
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/#faq`,
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];
  // "<" escapado para que ningún texto pueda cerrar la etiqueta <script>.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': withFaq ? graph : graph.filter((g) => g['@type'] !== 'FAQPage') }, null, 2).replace(/</g, '\\u003c');
}

/** Contenido principal en HTML simple: lo leen los buscadores y lo ve quien no tiene JavaScript. */
function fallbackContent(): string {
  return `
    <main class="seo-fallback">
      <h1>Aire acondicionado, mantenimiento y electricidad en Lima — ${esc(business.name)}</h1>
      <p>Instalamos, reparamos y mantenemos equipos de aire acondicionado e instalaciones eléctricas en Lima, con técnicos capacitados, repuestos originales, garantía por escrito y atención de emergencias 24/7.</p>
      <h2>Nuestros servicios</h2>
      <ul>
        ${services.map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></li>`).join('\n        ')}
      </ul>
      <h2>Soluciones corporativas integrales</h2>
      <ul>
        ${servicePages.map((p) => `<li><a href="/${p.slug}">${esc(p.h1)}</a></li>`).join('\n        ')}
      </ul>
      <h2>¿Por qué elegirnos?</h2>
      <ul>${checklist.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      <h2>Preguntas frecuentes</h2>
      ${faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('\n      ')}
      <h2>Contacto</h2>
      <address>
        ${esc(business.name)} · RUC ${business.ruc}<br>
        ${esc(business.address)}<br>
        Teléfono / WhatsApp: <a href="tel:${business.phone}">${esc(business.phoneDisplay)}</a> · <a href="tel:${business.phone2}">${esc(business.phone2Display)}</a><br>
        Correo: <a href="mailto:${business.email}">${esc(business.email)}</a><br>
        Horario: ${esc(business.hours)}
      </address>
      <nav><a href="/seguimiento">Seguir mi reserva</a> · <a href="/privacidad">Política de privacidad</a></nav>
    </main>`;
}

const captionOf = (image: string) => galleryItems.find((g) => g.image === image)?.caption ?? business.name;

function servicePageSitemapEntry(p: ServicePageData): string {
  const today = new Date().toISOString().slice(0, 10);
  const imgs = p.photos
    .map((i) => `    <image:image><image:loc>${abs(`${i}.jpg`)}</image:loc><image:title>${esc(captionOf(i))}</image:title></image:image>`)
    .join('\n');
  return `  <url>
    <loc>${SITE_URL}/${p.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
${imgs}
  </url>`;
}

/** Datos estructurados propios de una página de solución: el servicio y la ruta de navegación. */
function servicePageData(p: ServicePageData): string {
  const url = `${SITE_URL}/${p.slug}`;
  const graph = [
    {
      '@type': 'Service',
      '@id': `${url}#servicio`,
      name: p.h1,
      description: p.seoDescription,
      url,
      serviceType: p.label,
      provider: { '@id': `${SITE_URL}/#negocio` },
      areaServed: [{ '@type': 'City', name: 'Lima' }, { '@type': 'City', name: 'Callao' }],
      audience: { '@type': 'BusinessAudience', audienceType: sectors.map((s) => s.label).join(', ') },
      image: p.photos.map((i) => abs(`${i}.jpg`)),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: p.label, item: url },
      ],
    },
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
}

/** Contenido HTML de respaldo de una página de solución. */
function servicePageFallback(p: ServicePageData): string {
  return `
    <main class="seo-fallback">
      <p><a href="/">Inicio</a> › ${esc(p.label)}</p>
      <h1>${esc(p.h1)}</h1>
      <p>${esc(p.intro)}</p>
      <p><a href="https://wa.me/${business.phone.replace('+', '')}">Solicitar cotización por WhatsApp</a> · <a href="tel:${business.phone}">${esc(business.phoneDisplay)}</a></p>
      <h2>Atendemos a</h2>
      <ul>${sectors.map((s) => `<li>${esc(s.label)}: ${esc(s.text)}</li>`).join('')}</ul>
      <h2>¿Qué incluye?</h2>
      <ul>${p.includes.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
      <h2>Trabajos reales de nuestro equipo</h2>
      <ul>${p.photos.map((i) => `<li>${esc(captionOf(i))}</li>`).join('')}</ul>
      <h2>Proceso de atención</h2>
      <ol>${quoteProcess.map((s) => `<li>${esc(s.title)}: ${esc(s.text)}</li>`).join('')}</ol>
      <h2>Cobertura en Lima y Callao</h2>
      <ul>${coverage.map((c) => `<li>${esc(c.zone)}: ${esc(c.districts)}</li>`).join('')}</ul>
      <h2>Otras soluciones</h2>
      <ul>${servicePages.filter((o) => o.slug !== p.slug).map((o) => `<li><a href="/${o.slug}">${esc(o.label)}</a></li>`).join('')}</ul>
      <address>${esc(business.name)} · RUC ${business.ruc} · ${esc(business.address)}</address>
    </main>`;
}

/** Contenido HTML de respaldo de las páginas simples (seguimiento, privacidad, panel). */
function simplePageFallback(path: string): string {
  const seo = pageSeo[path];
  return `
    <main class="seo-fallback">
      <p><a href="/">Inicio</a> › ${esc(seo.title.split(' | ')[0])}</p>
      <h1>${esc(seo.title.split(' | ')[0])}</h1>
      <p>${esc(seo.description)}</p>
      <address>${esc(business.name)} · ${esc(business.phoneDisplay)} · ${esc(business.email)}</address>
    </main>`;
}

/**
 * A partir del index.html ya compilado, crea un HTML por página (<ruta>.html) con su propio título,
 * descripción, URL canónica, imagen para compartir y contenido de respaldo.
 */
function writePages(outDir: string): void {
  const home = pageSeo['/'];
  const base = readFileSync(resolve(outDir, 'index.html'), 'utf8');
  const homeImage = `${SITE_URL}/images/hero.jpg`;
  for (const path of Object.keys(pageSeo).filter((p) => p !== '/')) {
    const seo = pageSeo[path];
    const url = `${SITE_URL}${path}`;
    const service = servicePages.find((p) => `/${p.slug}` === path);
    let html = base
      // Las preguntas frecuentes solo se ven en la portada: su marcado va solo ahí.
      .replace(/(<script type="application\/ld\+json">)[\s\S]*?(<\/script>)/, (_m, open, close) => `${open}\n${structuredData(false)}\n  ${close}`)
      .replaceAll(esc(home.title), esc(seo.title))
      .replaceAll(esc(home.description), esc(seo.description))
      .replace(`<link rel="canonical" href="${SITE_URL}/">`, `<link rel="canonical" href="${url}">`)
      .replace(`<meta property="og:url" content="${SITE_URL}/">`, `<meta property="og:url" content="${url}">`)
      .replace(/<main class="seo-fallback">[\s\S]*?<\/main>/, () => (service ? servicePageFallback(service) : simplePageFallback(path)).trim());
    if (service) {
      const image = abs(`${service.photos[0]}.jpg`);
      html = html
        .replaceAll(`content="${homeImage}"`, `content="${image}"`)
        .replace(/<meta property="og:image:(width|height)"[^>]*>\s*/g, '')
        .replace(/(<meta property="og:image:alt" content=")[^"]*"/, `$1${esc(captionOf(service.photos[0]))}"`)
        .replace('</head>', () => `  <script type="application/ld+json">\n${servicePageData(service)}\n  </script>\n</head>`);
    }
    if (seo.noindex) {
      html = html.replace(/<meta name="robots" content="[^"]*">/, '<meta name="robots" content="noindex, nofollow">');
    }
    for (const must of [seo.title, url]) {
      if (!html.includes(esc(must))) throw new Error(`SEO: falta "${must}" en ${path}.html`);
    }
    writeFileSync(resolve(outDir, `${path.slice(1)}.html`), html);
  }
}

function sitemap(): string {
  const today = new Date().toISOString().slice(0, 10);
  const images = [
    { loc: 'images/hero.jpg', title: business.name },
    ...services.map((s) => ({ loc: `${s.image}.jpg`, title: s.title })),
    ...galleryItems.map((g) => ({ loc: `${g.image}.jpg`, title: g.caption })),
  ];
  const imageTags = images
    .map((i) => `    <image:image><image:loc>${abs(i.loc)}</image:loc><image:title>${esc(i.title)}</image:title></image:image>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
${imageTags}
  </url>
${servicePages.map(servicePageSitemapEntry).join('\n')}
  <url><loc>${SITE_URL}/seguimiento</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.4</priority></url>
  <url><loc>${SITE_URL}/privacidad</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
</urlset>
`;
}

export function seoPlugin(): Plugin {
  const home = pageSeo['/'];
  let outDir = '';
  let isBuild = false;
  return {
    name: 'airconsolution-seo',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
      isBuild = config.command === 'build';
    },
    closeBundle() {
      if (isBuild) writePages(outDir);
    },
    transformIndexHtml(html) {
      return html
        .replaceAll('%SEO_TITLE%', esc(home.title))
        .replaceAll('%SEO_DESCRIPTION%', esc(home.description))
        .replaceAll('%SITE_URL%', SITE_URL)
        .replace('<!--SEO_JSON_LD-->', `<script type="application/ld+json">\n${structuredData()}\n  </script>`)
        .replace('<!--SEO_FALLBACK-->', fallbackContent());
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap() });
    },
  };
}

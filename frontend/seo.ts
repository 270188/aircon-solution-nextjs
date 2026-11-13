/**
 * SEO generado en la compilación a partir de src/core/site.data.ts:
 *  - Datos estructurados (Schema.org) del negocio local, el sitio web y las preguntas frecuentes.
 *  - Contenido HTML de respaldo dentro de #root para buscadores y visitantes sin JavaScript
 *    (React lo reemplaza al cargar).
 *  - sitemap.xml con las fotos de trabajos para Google Imágenes.
 */
import type { Plugin } from 'vite';

import { SITE_URL, business, checklist, faqs, galleryItems, pageSeo, services } from './src/core/site.data';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (path: string) => `${SITE_URL}/${path.replace(/^\//, '')}`;

function structuredData(): string {
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
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c');
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
  <url><loc>${SITE_URL}/seguimiento</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.4</priority></url>
  <url><loc>${SITE_URL}/privacidad</loc><lastmod>${today}</lastmod><changefreq>yearly</changefreq><priority>0.2</priority></url>
</urlset>
`;
}

export function seoPlugin(): Plugin {
  const home = pageSeo['/'];
  return {
    name: 'airconsolution-seo',
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

import { business as b } from '../core/site.data';

export function PrivacyPage() {
  return (
    <div className="c-privacy-page">
      <article className="container legal">
        <div className="page-head">
          <span className="eyebrow">Legal</span>
          <h1 className="section-title">Política de privacidad</h1>
          <p>Última actualización: noviembre de 2026</p>
        </div>
        <p>
          En <strong>{b.legalName}</strong> protegemos tus datos personales conforme a la Ley N.° 29733, Ley de
          Protección de Datos Personales del Perú, y su reglamento.
        </p>
        <h2>¿Qué datos recopilamos?</h2>
        <p>Nombre, teléfono, correo electrónico (opcional), dirección del servicio y la descripción que nos envías en los formularios de reserva y contacto, así como tu correo si te suscribes al boletín.</p>
        <h2>¿Para qué los usamos?</h2>
        <ul>
          <li>Coordinar y realizar la visita técnica o el servicio que solicitaste.</li>
          <li>Responder tus consultas y enviarte cotizaciones.</li>
          <li>Si te suscribiste, enviarte recordatorios de mantenimiento y promociones. Puedes darte de baja cuando quieras.</li>
        </ul>
        <h2>¿Con quién los compartimos?</h2>
        <p>No vendemos ni compartimos tus datos con terceros para fines comerciales. Solo los usa nuestro personal y los proveedores tecnológicos que alojan el sitio y la base de datos, bajo medidas de seguridad adecuadas.</p>
        <h2>¿Cuánto tiempo los guardamos?</h2>
        <p>Mientras sea necesario para brindarte el servicio y cumplir obligaciones legales (por ejemplo, tributarias), o hasta que solicites su eliminación.</p>
        <h2>Tus derechos</h2>
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición (ARCO) escribiendo a{' '}
          <a href={`mailto:${b.email}`}>{b.email}</a> o al WhatsApp {b.phoneDisplay}.
        </p>
      </article>
    </div>
  );
}

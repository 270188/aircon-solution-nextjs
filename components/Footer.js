import { business } from "@/data/site";
import { LogoMark } from "./Header";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer>
      <div className="footer-grid container">
        <div className="footer-brand">
          <LogoMark textColor="light" />
          <p>
            Expertos en climatización, electricidad y mantenimiento. Brindamos
            confort y seguridad a tu hogar o empresa con garantía.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z"
                  stroke="#fff"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="#fff" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4" stroke="#fff" strokeWidth="1.6" />
                <circle cx="17.5" cy="6.5" r="1" fill="#fff" />
              </svg>
            </a>
            <a href={`https://wa.me/${business.phone.replace("+", "")}`} aria-label="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3a9 9 0 00-7.6 13.8L3 21l4.4-1.4A9 9 0 1012 3z"
                  stroke="#fff"
                  strokeWidth="1.6"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h5>Navegación</h5>
          <ul>
            <li><a href="#inicio">Inicio</a></li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#nosotros">Nosotros</a></li>
            <li><a href="#testimonios">Testimonios</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Servicios</h5>
          <ul>
            <li><a href="#servicios">Mantenimiento Preventivo</a></li>
            <li><a href="#servicios">Reparación de Equipos</a></li>
            <li><a href="#servicios">Instalaciones Eléctricas</a></li>
            <li><a href="#servicios">Aire Acondicionado</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h5>Contacto</h5>
          <ul>
            <li className="contact-line">
              📞 <a href={`tel:${business.phone}`}>{business.phoneDisplay}</a>
            </li>
            <li className="contact-line">
              ✉️ <a href={`mailto:${business.email}`}>{business.email}</a>
            </li>
            <li className="contact-line">📍 <span>{business.address}</span></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        © {year} {business.name}. Todos los derechos reservados.
        <p className="footer-credit">
          Página web elaborada por la desarrolladora de software{" "}
          <a href="#" rel="noopener">
            Valeria León
          </a>
        </p>
      </div>
    </footer>
  );
}

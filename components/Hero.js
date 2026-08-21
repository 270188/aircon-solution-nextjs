import Image from "next/image";
import { IconChevronDown } from "./Icons";

export default function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-bg">
        <Image
          src="/images/hero.jpg"
          alt="Técnico de AirConSolution reparando un aire acondicionado"
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="hero-overlay" />

      <div className="container hero-content">
        <h1>
          Climatización y Electricidad de <span className="grad1">Primer</span>{" "}
          <span className="grad2">Nivel</span>
        </h1>
        <p>
          Soluciones rápidas, seguras y eficientes para tu hogar o empresa.
          Garantizamos confort total con técnicos expertos.
        </p>
        <div className="hero-actions">
          <a href="#agenda" className="btn btn-orange">
            Reservar Cita
          </a>
          <a href="#servicios" className="btn btn-blue">
            Ver Servicios
          </a>
        </div>
      </div>

      <a href="#marquee" className="scroll-cue" aria-label="Bajar">
        <IconChevronDown />
      </a>
    </section>
  );
}

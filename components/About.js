import Image from "next/image";
import { checklist } from "@/data/site";
import { IconCheck } from "./Icons";

export default function About() {
  return (
    <section className="about" id="nosotros">
      <div className="container about-grid">
        <div className="about-media">
          <Image
            src="/images/about.jpg"
            alt="Técnico de AirConSolution dando mantenimiento a un equipo de aire acondicionado en azotea"
            width={900}
            height={1200}
            style={{ width: "100%", height: "460px", objectFit: "cover", borderRadius: "18px" }}
          />
          <div className="badge-exp">
            <strong>15+</strong>
            <span>
              Años de
              <br />
              Experiencia
            </span>
          </div>
        </div>
        <div className="about-copy">
          <p className="eyebrow">Sobre Nosotros</p>
          <h2 className="section-title">Expertos en climatización a tu servicio</h2>
          <p>
            En AirConSolution nos dedicamos a brindar soluciones integrales en
            climatización, electricidad y mantenimiento. Nuestro compromiso es
            garantizar el confort y la seguridad de tu hogar o empresa mediante
            un servicio profesional, rápido y eficiente.
          </p>
          <ul className="check-list">
            {checklist.map((item) => (
              <li key={item}>
                <IconCheck />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import { services } from "@/data/site";
import { serviceIcons } from "./Icons";

export default function Services() {
  return (
    <section className="services" id="servicios">
      <div className="container">
        <div className="services-head">
          <p className="eyebrow">Nuestros Servicios</p>
          <h2 className="section-title">Soluciones a tu medida</h2>
        </div>

        <div className="service-grid">
          {services.map((service, i) => {
            const Icon = serviceIcons[service.icon];
            return (
              <article className="service-card" key={service.id}>
                <div className="service-img">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    sizes="(max-width: 680px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div
                    className="service-icon"
                    style={{ background: i === 0 ? "var(--orange)" : "var(--blue)" }}
                  >
                    <Icon />
                  </div>
                </div>
                <div className="service-body">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

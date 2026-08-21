import Image from "next/image";
import { brands } from "@/data/site";

function BrandItem({ brand, delay }) {
  if (brand.type === "logo") {
    return (
      <span className="brand-item" style={{ animationDelay: `${delay}s` }}>
        <Image
          src={brand.src}
          alt={brand.name}
          width={110}
          height={34}
          className="brand-logo-img"
        />
      </span>
    );
  }
  return (
    <span className="brand-item brand-text" style={{ animationDelay: `${delay}s` }}>
      {brand.name}
    </span>
  );
}

export default function Marquee() {
  const doubled = [...brands, ...brands];

  return (
    <section className="marquee-section" id="marquee">
      <p className="marquee-title">
        TRABAJAMOS CON LOS MEJORES PROVEEDORES Y MATERIALES DEL MERCADO
      </p>
      <div className="marquee-track">
        {doubled.map((brand, i) => (
          <BrandItem
            key={`${brand.name}-${i}`}
            brand={brand}
            delay={(i % brands.length) * 0.35}
          />
        ))}
      </div>
    </section>
  );
}

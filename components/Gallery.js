import Image from "next/image";
import { galleryItems } from "@/data/site";

export default function Gallery() {
  return (
    <section className="gallery" id="galeria">
      <div className="container">
        <div className="gallery-head">
          <p className="eyebrow">Nuestro Trabajo</p>
          <h2 className="section-title">Proyectos realizados</h2>
        </div>
        <div className="gallery-grid">
          {galleryItems.map((item) => (
            <div
              className={`gallery-item${item.tall ? " tall" : ""}`}
              key={item.image}
            >
              <Image
                src={item.image}
                alt={item.caption}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 960px) 33vw, 25vw"
              />
              <span className="gallery-caption">{item.caption}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { testimonials } from "@/data/site";
import { IconStar } from "./Icons";

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const t = testimonials[index];

  return (
    <section className="testimonials" id="testimonios">
      <div className="container">
        <div className="testi-head">
          <p className="eyebrow">Testimonios</p>
          <h2 className="section-title">Lo que dicen nuestros clientes</h2>
        </div>

        <div className="testi-card" key={index}>
          <div className="stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <IconStar key={i} />
            ))}
          </div>
          <p>&quot;{t.text}&quot;</p>
          <div className="testi-author">
            {/* external avatar image, plain img is fine for a small remote thumbnail */}
            <img src={t.img} alt={t.name} />
            <div>
              <strong>{t.name}</strong>
              <span>{t.role}</span>
            </div>
          </div>
        </div>

        <div className="testi-dots">
          {testimonials.map((_, i) => (
            <button
              key={i}
              className={i === index ? "active" : ""}
              aria-label={`Testimonio ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

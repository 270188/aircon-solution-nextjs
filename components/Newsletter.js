"use client";

import { useState } from "react";
import { LogoMark } from "./Header";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Non-blocking: still confirm to the user
    }
    setSent(true);
    setEmail("");
  }

  return (
    <section className="newsletter">
      <div className="container newsletter-inner">
        <LogoMark textColor="light" />
        <h3>Suscríbete al Boletín</h3>
        <p>
          Recibe consejos de mantenimiento, novedades y ofertas exclusivas
          directamente en tu correo.
        </p>
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Ingresa tu correo"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn btn-orange btn-block">
            {sent ? "¡Gracias por suscribirte!" : "Suscribirme"}
          </button>
        </form>
      </div>
    </section>
  );
}

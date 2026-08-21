"use client";

import { useState } from "react";
import { business } from "@/data/site";
import { IconWhatsapp, IconMail, IconPin, IconEnvelope } from "./Icons";

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  async function sendToBackend() {
    setStatus("sending");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  async function handleWhatsapp(e) {
    e.preventDefault();
    await sendToBackend();
    const msg = `Hola AirConSolution,%0ANombre: ${form.name}%0ATeléfono: ${form.phone}%0ACorreo: ${form.email}%0AMensaje: ${form.message}`;
    window.open(`https://wa.me/${business.phone.replace("+", "")}?text=${msg}`, "_blank");
  }

  async function handleEmail() {
    await sendToBackend();
    const body = encodeURIComponent(form.message);
    window.location.href = `mailto:${business.email}?subject=Consulta desde la web&body=${body}%0A%0AContacto: ${form.email}`;
  }

  return (
    <section className="contact" id="contacto">
      <div className="container contact-grid">
        <div className="contact-form-wrap">
          <h3>Envíanos un mensaje</h3>
          <form className="contact-form" onSubmit={handleWhatsapp}>
            <div className="field">
              <label htmlFor="cName">Nombre Completo</label>
              <input
                id="cName"
                type="text"
                placeholder="Ej. Juan Pérez"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cPhone">Teléfono</label>
              <input
                id="cPhone"
                type="tel"
                placeholder="+51 985 899 731"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cEmail">Correo Electrónico</label>
              <input
                id="cEmail"
                type="email"
                placeholder="tucorreo@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="cMsg">Mensaje</label>
              <textarea
                id="cMsg"
                placeholder="¿En qué te podemos ayudar hoy?"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <div className="contact-cta">
              <button type="button" className="btn btn-orange btn-block" onClick={handleEmail}>
                Enviar por Correo
                <IconMail />
              </button>
              <button type="submit" className="btn btn-green">
                <IconWhatsapp />
                Enviar por WhatsApp
              </button>
            </div>
            {status === "sent" && (
              <p style={{ color: "var(--gray)", fontSize: ".85rem" }}>
                Mensaje registrado. ¡Gracias por escribirnos!
              </p>
            )}
          </form>
        </div>

        <div className="info-cards">
          <a className="info-card loc" href={business.mapLink} target="_blank" rel="noopener">
            <div className="info-icon">
              <IconPin />
            </div>
            <div>
              <strong>Los Olivos, Lima</strong>
              <p>{business.address} (Abrir en Maps)</p>
            </div>
          </a>
          <div className="map-embed">
            <iframe
              title="Ubicación AirConSolution"
              loading="lazy"
              src={business.mapEmbedSrc}
            />
          </div>

          <a
            className="info-card wa"
            href={`https://wa.me/${business.phone.replace("+", "")}`}
            target="_blank"
            rel="noopener"
          >
            <div className="info-icon">
              <IconWhatsapp color="var(--green)" size={22} />
            </div>
            <div>
              <strong>{business.phoneDisplay}</strong>
              <p>Haz clic para chatear directamente por WhatsApp.</p>
            </div>
          </a>
          <a className="info-card mail" href={`mailto:${business.email}`}>
            <div className="info-icon">
              <IconEnvelope />
            </div>
            <div>
              <strong>{business.email}</strong>
              <p>Haz clic para redactar un correo directo en Gmail.</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}

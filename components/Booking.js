"use client";

import { useMemo, useState } from "react";
import { business, timeSlots } from "@/data/site";
import { IconCalendar, IconWrench, IconWhatsapp } from "./Icons";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DOWS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const SERVICE_OPTIONS = [
  "Aire Acondicionado",
  "Mantenimiento Preventivo",
  "Reparación de Equipos",
  "Instalaciones Eléctricas",
  "Estructuras Metálicas",
  "Bombas de Agua",
];

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default function Booking() {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(startOfDay(today));
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    service: SERVICE_OPTIONS[0],
    description: "",
  });
  const [status, setStatus] = useState(null);

  const cells = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    let startIdx = firstOfMonth.getDay() - 1;
    if (startIdx < 0) startIdx = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const list = [];
    for (let i = startIdx; i > 0; i--) {
      list.push({ day: daysInPrevMonth - i + 1, disabled: true });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(viewYear, viewMonth, d);
      const disabled = dateObj < startOfDay(today);
      const isSel =
        selectedDate.getFullYear() === viewYear &&
        selectedDate.getMonth() === viewMonth &&
        selectedDate.getDate() === d;
      list.push({ day: d, disabled, selected: isSel, dateObj });
    }
    const remainder = list.length % 7;
    const trailing = remainder === 0 ? 0 : 7 - remainder;
    for (let d = 1; d <= trailing; d++) {
      list.push({ day: d, disabled: true });
    }
    return list;
  }, [viewYear, viewMonth, selectedDate, today]);

  function goPrevMonth() {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }

  function goNextMonth() {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  const dateLabel = `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}, ${selectedDate.getFullYear()} | ${selectedSlot}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");

    const payload = {
      ...form,
      date: `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}, ${selectedDate.getFullYear()}`,
      time: selectedSlot,
    };

    try {
      await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Even if the backend log fails, still let the person continue via WhatsApp
    }

    const msg =
      `Hola AirConSolution, quiero reservar una cita:%0A` +
      `Nombre: ${form.name}%0A` +
      `Teléfono: ${form.phone}%0A` +
      `Dirección: ${form.address}%0A` +
      `Servicio: ${form.service}%0A` +
      `Fecha: ${payload.date} - ${selectedSlot}%0A` +
      `Descripción: ${form.description}`;

    setStatus("sent");
    window.open(`https://wa.me/${business.phone.replace("+", "")}?text=${msg}`, "_blank");
  }

  return (
    <section className="booking" id="agenda">
      <div className="container">
        <div className="booking-head">
          <p className="eyebrow">Solicitar Servicio</p>
          <h2 className="section-title">Programa tu cita con nosotros</h2>
        </div>

        <div className="booking-grid">
          <div className="cal-card">
            <div className="cal-header">
              <h4>
                {MONTHS[viewMonth]} {viewYear}
              </h4>
              <div className="cal-nav">
                <button type="button" onClick={goPrevMonth} aria-label="Mes anterior">
                  &lt;
                </button>
                <button type="button" onClick={goNextMonth} aria-label="Mes siguiente">
                  &gt;
                </button>
              </div>
            </div>
            <div className="cal-grid">
              {DOWS.map((d) => (
                <div className="dow" key={d}>
                  {d}
                </div>
              ))}
              {cells.map((cell, i) => (
                <div
                  key={i}
                  className={`cal-day${cell.disabled ? " disabled" : ""}${
                    cell.selected ? " selected" : ""
                  }`}
                  onClick={() => {
                    if (!cell.disabled && cell.dateObj) setSelectedDate(cell.dateObj);
                  }}
                >
                  {cell.day}
                </div>
              ))}
            </div>

            <div className="selected-box">
              <h5>Programación Seleccionada</h5>
              <div className="selected-date">
                <IconCalendar />
                <span>{dateLabel}</span>
              </div>
              <div className="selected-service">
                <IconWrench size={20} />
                <span>
                  <span className="s-title">Servicio: {form.service}</span>
                  <span className="s-sub">Visita técnica a domicilio</span>
                </span>
              </div>
            </div>
          </div>

          <div className="slots-card">
            <h4>Elige un horario</h4>
            <div>
              {timeSlots.map((slot) => (
                <label
                  key={slot}
                  className={`slot${slot === selectedSlot ? " active" : ""}`}
                  onClick={() => setSelectedSlot(slot)}
                >
                  <input
                    type="radio"
                    name="slot"
                    readOnly
                    checked={slot === selectedSlot}
                  />
                  {slot}
                </label>
              ))}
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="bkName">Nombre Completo</label>
                <input
                  id="bkName"
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="bkPhone">Teléfono</label>
                <input
                  id="bkPhone"
                  type="tel"
                  placeholder="+51 985 899 731"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="bkAddress">Dirección del servicio</label>
                <input
                  id="bkAddress"
                  type="text"
                  placeholder="Ej. Av. Universitaria 123, Los Olivos"
                  required
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="bkService">Seleccione Servicio</label>
                <select
                  id="bkService"
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                >
                  {SERVICE_OPTIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="bkDesc">Descripción del problema</label>
                <textarea
                  id="bkDesc"
                  placeholder="Describe brevemente el problema o servicio requerido..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-green">
                <IconWhatsapp />
                {status === "sending" ? "Enviando..." : "Enviar Reserva por WhatsApp"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

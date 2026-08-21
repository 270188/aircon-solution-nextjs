"use client";

import { useState } from "react";
import Image from "next/image";
import { navLinks } from "@/data/site";
import { IconWhatsapp } from "./Icons";

function LogoMark({ withText = true, textColor = "dark" }) {
  return (
    <a href="#inicio" className="logo" aria-label="AirConSolution - inicio">
      <Image
        src="/images/logo.jpg"
        alt="AirConSolution"
        width={46}
        height={46}
        className="logo-mark"
      />
      {withText && (
        <span>
          <span className="logo-text">
            <span className="air" style={textColor === "light" ? { color: "#fff" } : undefined}>
              AIR
            </span>
            <span className="con">CON</span>
          </span>
          <span
            className="logo-sub"
            style={textColor === "light" ? { color: "#b7c3d1" } : undefined}
          >
            SOLUTION
          </span>
        </span>
      )}
    </a>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header>
        <div className="nav-wrap">
          <LogoMark />

          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="desktop-actions">
            <a href="#agenda" className="btn btn-blue">
              Reservar Cita
            </a>
          </div>

          <button
            className="hamburger"
            aria-label="Abrir menú"
            onClick={() => setMenuOpen(true)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? " open" : ""}`}>
        <div className="mobile-menu-top">
          <LogoMark />
          <button
            className="mobile-menu-close"
            aria-label="Cerrar menú"
            onClick={() => setMenuOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className="mobile-links">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="mlink"
              onClick={() => setMenuOpen(false)}
            >
              {link.label.toUpperCase()}
            </a>
          ))}
          <a
            href="#agenda"
            className="btn btn-blue mlink"
            onClick={() => setMenuOpen(false)}
          >
            RESERVAR CITA
          </a>
        </div>
        <div className="mobile-social">
          <a href="#" aria-label="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v6h3v-6h3l1-3h-4v-2c0-.6.4-1 1-1z"
                stroke="#0d1b2e"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <a href="#" aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="#0d1b2e" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4" stroke="#0d1b2e" strokeWidth="1.6" />
              <circle cx="17.5" cy="6.5" r="1" fill="#0d1b2e" />
            </svg>
          </a>
          <a href="https://wa.me/51985899731" aria-label="WhatsApp">
            <IconWhatsapp color="#0d1b2e" size={20} />
          </a>
        </div>
      </div>
    </>
  );
}

export { LogoMark };

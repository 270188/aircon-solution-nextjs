"use client";

import { useEffect, useState } from "react";
import { business } from "@/data/site";
import { IconChevronUp } from "./Icons";

export default function FloatingButtons() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 500);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        className="wa-float"
        href={`https://wa.me/${business.phone.replace("+", "")}`}
        target="_blank"
        rel="noopener"
        aria-label="Escribir por WhatsApp"
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3a9 9 0 00-7.6 13.8L3 21l4.4-1.4A9 9 0 1012 3z"
            stroke="#fff"
            strokeWidth="1.8"
          />
          <path
            d="M8.5 8.7c0 4 3 6.8 6.8 6.8.5 0 .9-.4.9-1v-1.1l-2.3-.7-1 1a5.4 5.4 0 01-3.6-3.6l1-1-.7-2.3H8.6c-.1 0-.1.4-.1.9z"
            fill="#fff"
          />
        </svg>
      </a>

      <button
        className={`back-top${show ? " show" : ""}`}
        aria-label="Subir"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <IconChevronUp />
      </button>
    </>
  );
}

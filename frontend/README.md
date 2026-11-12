# Frontend — AIRCONSOLUTION SERVICES SAC (React + Vite + TypeScript)

```bash
npm install
npm run dev        # http://localhost:4200 (redirige /api al backend en :8080)
npm test           # pruebas (Vitest + Testing Library)
npm run build      # verifica tipos (tsc) y compila con Vite en dist/
```

- Contenido editable (teléfonos, servicios, fotos, testimonios, preguntas frecuentes): `src/core/site.data.ts`
- Fotos de trabajos: `public/images/trabajos/` (subir cada foto en `.jpg` y `.webp`) y agregar una línea en `galleryItems`.
- Colores y estilos globales: `src/styles/global.scss`; estilos de cada sección en `src/styles/components/`.
- Animaciones por atributos: `data-reveal="up"`, `data-tilt`, `data-magnetic`, `data-ripple`, `data-parallax` (ver `src/shared/effects.ts`).

# Frontend — AIRCONSOLUTION SERVICES SAC (Angular 21)

```bash
npm install
npm start          # http://localhost:4200 (redirige /api al backend en :8080)
npm test           # pruebas unitarias (Vitest)
npm run build      # genera dist/frontend/browser
```

- Contenido editable (teléfonos, servicios, fotos, testimonios, preguntas frecuentes): `src/app/core/site.data.ts`
- Fotos de trabajos: `public/images/trabajos/` (subir cada foto en `.jpg` y `.webp`) y agregar una línea en `galleryItems`.
- Colores y estilos globales: `src/styles.scss`
- Despliegue en Vercel: `vercel.json` (Root Directory = `frontend`).

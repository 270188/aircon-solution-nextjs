# AIRCONSOLUTION SERVICES SAC — React + Vite + TypeScript y Spring Boot

Sitio web y sistema de reservas de **AIRCONSOLUTION SERVICES SAC** (aire acondicionado, mantenimiento,
electricidad, estructuras metálicas y bombas de agua en Lima).

| Parte | Tecnología | Carpeta | Dónde se publica |
|---|---|---|---|
| Frontend | React 19 + Vite 8 + TypeScript | `frontend/` | Render (servido por Spring Boot) |
| Backend | Spring Boot 4.1 · Java 21 · JPA · Flyway · Spring Security | `backend/` | Render (Docker), junto con el frontend |
| Base de datos | PostgreSQL. H2 en memoria para desarrollo | — | Neon |

Las mejoras respecto a la versión anterior en Next.js, y los requerimientos funcionales y no funcionales,
están en [`docs/MEJORAS.md`](docs/MEJORAS.md).

## Correr en tu computadora

Requisitos: Java 21, Maven 3.9+, Node.js 22.

```bash
# Terminal 1 — backend en http://localhost:8080 (base de datos H2 en memoria)
cd backend
ADMIN_PASSWORD=demo1234 mvn spring-boot:run
```

```bash
# Terminal 2 — frontend en http://localhost:4200
cd frontend
npm install
npm run dev
```

- Documentación de la API (Swagger): http://localhost:8080/swagger-ui.html
- Panel de administración: http://localhost:4200/admin (usuario `admin`, contraseña la de `ADMIN_PASSWORD`)

Pruebas:

```bash
cd backend && mvn test
```

```bash
cd frontend && npm test
```

```bash
cd frontend && npm run build    # comprueba tipos con TypeScript y compila con Vite en frontend/dist
```

## Publicar (Render + Neon, gratis)

Todo corre en **un solo servicio** de Render: la imagen Docker (`Dockerfile` en la raíz) compila la página
React con Vite y la sirve el mismo Spring Boot que expone la API, así no hay problemas de dominios cruzados.

- **Base de datos:** PostgreSQL gratis en [Neon](https://neon.tech) (proyecto `airconsolution-services`).
  Las tablas se crean solas al arrancar (Flyway).
- **Servicio web:** Render, plan gratis, definido en `render.yaml` (Blueprint). Cada `git push` a la rama
  configurada vuelve a desplegar.
- **Contraseña del panel:** Render la genera; se ve en el servicio → **Environment** → `ADMIN_PASSWORD`.
- En el plan gratis el servicio se duerme tras 15 minutos sin visitas; la siguiente visita tarda ~1 minuto.

### SEO
Se genera solo al compilar a partir de `frontend/src/core/site.data.ts` (ver `frontend/seo.ts`): datos estructurados
para Google, contenido de respaldo para buscadores, `sitemap.xml` con las fotos y los títulos/descripciones de cada página
(`pageSeo`). Si cambias el dominio, actualiza `SITE_URL` en ese archivo y `frontend/public/robots.txt`.

### Dominio propio
En Render → servicio → **Settings → Custom Domains** agrega tu dominio y crea en Hosting Perú los registros
DNS que Render te indique. Si tu dominio no es `airconsolutionsac.com`, reemplázalo en
`frontend/src/index.html`, `frontend/public/sitemap.xml` y `frontend/public/robots.txt`.

`frontend/vercel.json` queda como alternativa por si algún día prefieres servir la página desde Vercel.

## Estructura

```
backend/
  src/main/java/pe/airconsolution/api/
    booking/      Reservas: disponibilidad, creación, seguimiento por código
    contact/      Mensajes del formulario de contacto
    newsletter/   Suscriptores del boletín
    admin/        Endpoints del panel (protegidos con usuario y contraseña)
    config/       Seguridad, CORS, límite de solicitudes, OpenAPI
    common/       Manejo de errores en español (RFC 9457)
  src/main/resources/
    application.yml        Configuración (horarios, cupos por horario, días cerrados…)
    db/migration/          Esquema de base de datos (Flyway)
frontend/                 React 19 + Vite + TypeScript
  index.html               Página base (SEO, datos estructurados para Google)
  src/
    core/site.data.ts      TODO el contenido editable del sitio
    core/api.ts            Cliente de la API (fetch)
    core/ui.ts             Avisos, tema claro/oscuro y servicio preseleccionado
    layout/                Cabecera, pie, pantalla de carga, efectos, avisos
    sections/              Secciones de la portada (hero, servicios, galería, reservas…)
    pages/                 Inicio, seguimiento, panel (cotizaciones y facturación), privacidad, 404
    shared/                Animaciones (data-reveal, data-tilt…), íconos, fechas, IGV y RUC
    styles/                Estilos globales y de cada componente (SCSS)
  public/images/trabajos/  Fotos de trabajos reales
```

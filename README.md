# AIRCONSOLUTION SERVICES SAC — Angular + Spring Boot

Sitio web y sistema de reservas de **AIRCONSOLUTION SERVICES SAC** (aire acondicionado, mantenimiento,
electricidad, estructuras metálicas y bombas de agua en Lima).

| Parte | Tecnología | Carpeta | Dónde se publica |
|---|---|---|---|
| Frontend | Angular 21 (standalone, signals, zoneless) | `frontend/` | Vercel |
| Backend | Spring Boot 4.1 · Java 21 · JPA · Flyway · Spring Security | `backend/` | Render (Docker) u otro hosting de contenedores |
| Base de datos | PostgreSQL (Supabase, Neon, Render…). H2 en memoria para desarrollo | — | — |

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
npm start
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

## Publicar

### 1. Base de datos (PostgreSQL)
Crea una base en Supabase o Neon. Las tablas se crean solas al arrancar el backend (migraciones Flyway en
`backend/src/main/resources/db/migration`). Necesitas la cadena de conexión en formato JDBC:
`jdbc:postgresql://HOST:5432/BASE?sslmode=require`, más el usuario y la contraseña.

### 2. Backend en Render
1. En [render.com](https://render.com) → **New → Blueprint** → elige este repositorio (usa `render.yaml`).
2. Completa `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` y una `ADMIN_PASSWORD` segura.
3. Cuando termine, copia la URL del servicio (por ejemplo `https://airconsolution-api.onrender.com`).

> En el plan gratuito de Render el servicio se duerme tras 15 minutos sin uso y la primera petición tarda
> ~1 minuto. Para un negocio en producción conviene el plan pagado más económico.

### 3. Frontend en Vercel
1. En Vercel, en el proyecto, ve a **Settings → General → Root Directory** y pon `frontend`.
2. Si la URL del backend no es `https://airconsolution-api.onrender.com`, cámbiala en `frontend/vercel.json`
   (regla `/api/:path*`).
3. Despliega. Vercel reenvía `/api/...` al backend, así el navegador nunca habla con otro dominio.

### 4. Dominio
En Vercel → **Settings → Domains** agrega tu dominio y configura el DNS en Hosting Perú
(registro `A @ 76.76.21.21` y `CNAME www cname.vercel-dns.com`, o los valores que te muestre Vercel).
Si tu dominio no es `airconsolutionsac.com`, reemplázalo en `frontend/src/index.html`,
`frontend/public/sitemap.xml`, `frontend/public/robots.txt` y `ALLOWED_ORIGINS` en `render.yaml`.

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
frontend/
  src/app/
    core/site.data.ts      TODO el contenido editable del sitio
    core/api.service.ts    Cliente de la API
    layout/                Cabecera, pie, pantalla de carga, efectos, avisos
    sections/              Secciones de la portada (hero, servicios, galería, reservas…)
    pages/                 Inicio, seguimiento, panel, privacidad, 404
    shared/                Directivas de animación, íconos y utilidades
  public/images/trabajos/  Fotos de trabajos reales
```

# AirConSolution — Next.js + React + Supabase

Sitio web de AirConSolution construido con **Next.js 14 (App Router)** y **React**,
con base de datos real en **Supabase** (Postgres) para guardar los formularios.

## Requisitos

- Node.js 18.18 o superior
- npm
- Una cuenta gratuita en [supabase.com](https://supabase.com)

## 1. Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta (puedes usar GitHub).
2. Clic en **New Project**. Ponle un nombre (ej. `aircon-solution`) y una contraseña
   para la base de datos (guárdala, no la necesitarás para esto pero es buena práctica).
3. Espera a que el proyecto termine de crearse (~2 minutos).
4. Ve a **SQL Editor** (menú izquierdo) → **New query**.
5. Abre el archivo `supabase/schema.sql` de este proyecto, copia todo su contenido,
   pégalo en el editor y dale **Run**. Esto crea las 3 tablas necesarias:
   - `contact_submissions`
   - `booking_submissions`
   - `newsletter_subscribers`
6. Ve a **Project Settings** (ícono de engranaje) → **API**. Ahí vas a encontrar:
   - **Project URL** → esta es tu `SUPABASE_URL`
   - **service_role** (en la sección "Project API keys", dice "secret") → esta es tu
     `SUPABASE_SERVICE_ROLE_KEY`

   La `service_role` key nunca debe compartirse ni subirse a GitHub — da acceso
   total a la base de datos. Solo se usa dentro del servidor (API routes), nunca
   en el navegador.

## 2. Configurar las variables de entorno

**En tu computadora (desarrollo local):**

```bash
cp .env.local.example .env.local
```

Y edita `.env.local` con tus valores reales de `SUPABASE_URL` y
`SUPABASE_SERVICE_ROLE_KEY`.

**En Vercel (producción):**

1. En tu proyecto de Vercel, ve a **Settings -> Environment Variables**.
2. Agrega:
   - `SUPABASE_URL` = tu Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = tu service_role key
3. Vuelve a desplegar el proyecto (Vercel lo hace automático si conectaste GitHub
   y haces push, o puedes forzarlo desde **Deployments -> Redeploy**).

Si no configuras estas variables, el sitio sigue funcionando en modo de
desarrollo local guardando los envíos en `data/submissions.json` como respaldo,
pero en Vercel es indispensable configurarlas porque no hay almacenamiento de
archivos persistente.

## 3. Instalación y ejecución local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## 4. Producción

```bash
npm run build
npm run start
```

## Estructura

```
app/
  layout.js          Layout raíz (fuentes, metadata)
  page.js             Página principal (ensambla todos los componentes)
  globals.css         Estilos globales del sitio
  api/
    contact/route.js    Backend del formulario de contacto
    booking/route.js    Backend del formulario de reserva de citas
    newsletter/route.js Backend de suscripción al boletín
components/           Componentes de React (Header, Hero, Services, Booking, etc.)
data/
  site.js             Todo el contenido del sitio (servicios, testimonios, marcas, contacto)
lib/
  supabase.js         Cliente de conexión a Supabase (servidor)
  storage.js           Funciones para guardar/leer envíos (usa Supabase si está
                        configurado, o un JSON local como respaldo en desarrollo)
supabase/
  schema.sql          Script SQL para crear las tablas en Supabase
public/
  images/             Fotos reales del trabajo, logos de marcas y fotos de testimonios
```

## ¿Cómo veo los mensajes y reservas que llegan?

En el panel de Supabase, ve a **Table Editor** (menú izquierdo) y selecciona
cualquiera de las 3 tablas (`contact_submissions`, `booking_submissions`,
`newsletter_subscribers`) para ver todos los registros en una tabla, ordenar,
filtrar o exportarlos a CSV.

También puedes correr consultas SQL directas en **SQL Editor**, por ejemplo:

```sql
select * from booking_submissions order by created_at desc;
```

## Datos del negocio

Todo el contenido editable (teléfono, correo, dirección, servicios, marcas,
testimonios, horarios disponibles) está centralizado en `data/site.js` para que
sea fácil de actualizar sin tocar los componentes.

## Publicar con tu dominio (airconsolutionsac.com)

1. Sube este proyecto a un repositorio de GitHub.
2. Impórtalo en [vercel.com](https://vercel.com) (Add New -> Project).
3. Configura las variables de entorno de Supabase (paso 2 de arriba).
4. En **Settings -> Domains** dentro de Vercel, agrega `airconsolutionsac.com`.
5. Configura los registros DNS que Vercel te indique en el panel de tu proveedor
   de dominio.

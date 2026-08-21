-- =========================================================
-- Esquema de base de datos para AirConSolution
-- Ejecuta este script completo en Supabase:
-- Panel de Supabase -> SQL Editor -> New query -> pega esto -> Run
-- =========================================================

-- Mensajes del formulario de contacto
create table if not exists contact_submissions (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  email text,
  message text,
  created_at timestamptz not null default now()
);

-- Reservas de citas (formulario de agenda)
create table if not exists booking_submissions (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  address text,
  service text,
  description text,
  appointment_date text,
  appointment_time text,
  created_at timestamptz not null default now()
);

-- Suscripciones al boletín
create table if not exists newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Seguridad: activamos Row Level Security. Las escrituras desde la web
-- se hacen con la Service Role Key (backend), que siempre puede
-- escribir sin importar estas políticas. Esto evita que alguien
-- pueda leer/escribir estas tablas directamente desde el navegador
-- con la clave pública (anon key).
alter table contact_submissions enable row level security;
alter table booking_submissions enable row level security;
alter table newsletter_subscribers enable row level security;

-- (Opcional) Si en algún momento quieres ver las últimas reservas
-- directamente en el SQL Editor de Supabase, puedes correr:
--   select * from booking_submissions order by created_at desc;
--   select * from contact_submissions order by created_at desc;
--   select * from newsletter_subscribers order by created_at desc;

import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

/**
 * Devuelve un cliente de Supabase listo para usarse en el servidor
 * (API routes). Usa la Service Role Key para poder escribir sin
 * depender de políticas de RLS por usuario, ya que estos formularios
 * son públicos (cualquier visitante puede enviar el formulario).
 *
 * Requiere las variables de entorno:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  return cachedClient;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

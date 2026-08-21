import fs from "fs";
import path from "path";
import { getSupabaseServerClient, isDatabaseConfigured } from "./supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "submissions.json");

const TABLES = {
  contact: "contact_submissions",
  booking: "booking_submissions",
  newsletter: "newsletter_subscribers",
};

// Traduce los campos "camelCase" que usan los formularios a las
// columnas reales de cada tabla en Supabase (snake_case).
function toRow(kind, entry) {
  if (kind === "contact") {
    return {
      name: entry.name,
      phone: entry.phone,
      email: entry.email || null,
      message: entry.message || "",
    };
  }
  if (kind === "booking") {
    return {
      name: entry.name,
      phone: entry.phone,
      address: entry.address || "",
      service: entry.service || "",
      description: entry.description || "",
      appointment_date: entry.date || "",
      appointment_time: entry.time || "",
    };
  }
  if (kind === "newsletter") {
    return { email: entry.email };
  }
  return entry;
}

// ---------- Respaldo local en JSON (solo para desarrollo sin Supabase) ----------
function readLocal() {
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { contact: [], booking: [], newsletter: [] };
  }
}

function writeLocal(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), "utf-8");
}

function appendLocal(kind, entry) {
  const data = readLocal();
  if (!data[kind]) data[kind] = [];
  const saved = { ...entry, receivedAt: new Date().toISOString() };
  data[kind].push(saved);
  writeLocal(data);
  return saved;
}

function listLocal(kind) {
  return readLocal()[kind] || [];
}

// ---------- API pública usada por las rutas /api/* ----------

/**
 * Guarda un envío. Si Supabase está configurado (variables de entorno
 * SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY), lo guarda ahí. Si no,
 * usa un archivo JSON local como respaldo para poder seguir probando
 * el sitio en desarrollo sin tener que configurar nada todavía.
 */
export async function appendSubmission(kind, entry) {
  if (isDatabaseConfigured()) {
    const supabase = getSupabaseServerClient();
    const table = TABLES[kind];
    const row = toRow(kind, entry);

    const { data, error } = await supabase.from(table).insert(row).select().single();

    if (error) {
      throw new Error(`Error guardando en Supabase (${table}): ${error.message}`);
    }
    return data;
  }

  return appendLocal(kind, entry);
}

export async function listSubmissions(kind) {
  if (isDatabaseConfigured()) {
    const supabase = getSupabaseServerClient();
    const table = TABLES[kind];

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error leyendo de Supabase (${table}): ${error.message}`);
    }
    return data;
  }

  return listLocal(kind);
}

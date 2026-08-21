import { NextResponse } from "next/server";
import { appendSubmission, listSubmissions } from "@/lib/storage";

export async function POST(request) {
  const body = await request.json();

  if (!body?.email) {
    return NextResponse.json({ ok: false, error: "Correo requerido." }, { status: 400 });
  }

  try {
    const saved = await appendSubmission("newsletter", { email: body.email });
    return NextResponse.json({ ok: true, submission: saved });
  } catch (err) {
    console.error(err);
    // El error más común aquí es un correo duplicado (constraint UNIQUE).
    return NextResponse.json(
      { ok: false, error: "No se pudo registrar el correo (puede que ya esté suscrito)." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const submissions = await listSubmissions("newsletter");
    return NextResponse.json({ ok: true, submissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "No se pudo leer la información." }, { status: 500 });
  }
}

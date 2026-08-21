import { NextResponse } from "next/server";
import { appendSubmission, listSubmissions } from "@/lib/storage";

export async function POST(request) {
  const body = await request.json();

  if (!body?.name || !body?.phone) {
    return NextResponse.json(
      { ok: false, error: "Nombre y teléfono son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const saved = await appendSubmission("contact", {
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      message: body.message || "",
    });
    return NextResponse.json({ ok: true, submission: saved });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el mensaje." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const submissions = await listSubmissions("contact");
    return NextResponse.json({ ok: true, submissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "No se pudo leer la información." }, { status: 500 });
  }
}

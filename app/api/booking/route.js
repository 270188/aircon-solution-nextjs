import { NextResponse } from "next/server";
import { appendSubmission, listSubmissions } from "@/lib/storage";

export async function POST(request) {
  const body = await request.json();

  if (!body?.name || !body?.phone || !body?.date) {
    return NextResponse.json(
      { ok: false, error: "Nombre, teléfono y fecha son obligatorios." },
      { status: 400 }
    );
  }

  try {
    const saved = await appendSubmission("booking", {
      name: body.name,
      phone: body.phone,
      address: body.address || "",
      service: body.service || "",
      description: body.description || "",
      date: body.date,
      time: body.time,
    });
    return NextResponse.json({ ok: true, submission: saved });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar la reserva." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const submissions = await listSubmissions("booking");
    return NextResponse.json({ ok: true, submissions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "No se pudo leer la información." }, { status: 500 });
  }
}

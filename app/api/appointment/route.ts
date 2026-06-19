import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const required = ["name", "phone", "service"];
  const missing = required.filter((field) => !String(body[field] ?? "").trim());

  if (missing.length) {
    return NextResponse.json({ ok: false, error: `Missing: ${missing.join(", ")}` }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Appointment request received by the website endpoint. Connect SMTP, CRM, or database storage before production launch."
  });
}

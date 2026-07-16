import { NextResponse } from "next/server";
import { renderProcedurePrepPdf } from "@/lib/pdf/render";

// Deliberately public (no authorize()/session gate): this is pre-visit
// patient-education content shown on the public procedure page, not a
// clinical record — the same trust boundary as the procedure pages
// themselves. renderProcedurePrepPdf validates the slug against the real
// published procedure list, so an unknown slug 404s rather than rendering.
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "slug is required." }, { status: 400 });
  }

  const result = await renderProcedurePrepPdf(slug);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.filename}"`,
      "Cache-Control": "public, max-age=3600"
    }
  });
}

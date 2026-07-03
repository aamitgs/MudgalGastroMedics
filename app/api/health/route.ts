export async function GET() {
  return Response.json({
    ok: true,
    service: "mudgal-gastromedics",
    timestamp: new Date().toISOString()
  });
}

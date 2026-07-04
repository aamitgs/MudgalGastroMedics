import packageInfo from "@/package.json";

export async function GET() {
  return Response.json({
    ok: true,
    service: "mudgal-gastromedics",
    version: packageInfo.version,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
}

import { ImageResponse } from "next/og";
import { getServicePage } from "@/lib/service-pages";
import { site } from "@/lib/site-data";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

type OgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: OgImageProps) {
  const { slug } = await params;
  const page = getServicePage(slug);
  const title = page?.title ?? "Gastroenterology Services in Agra";
  const description = page?.description ?? site.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #062832 0%, #0e7490 48%, #047857 100%)",
          color: "white",
          fontFamily: "Arial, Helvetica, sans-serif",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 12% 12%, rgba(34, 211, 238, 0.34), transparent 330px), radial-gradient(circle at 88% 18%, rgba(185, 133, 47, 0.34), transparent 300px)"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 70,
            right: 70,
            top: 58,
            bottom: 58,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid rgba(255,255,255,0.24)",
            background: "rgba(2, 22, 29, 0.68)",
            borderRadius: 22,
            padding: 52,
            boxShadow: "0 30px 90px rgba(2,22,29,0.38)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 16, height: 16, borderRadius: 999, background: "#b9852f" }} />
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: "#a5f3fc" }}>
              Mudgal Gastromedics Hospital
            </div>
          </div>
          <div>
            <div style={{ fontSize: 68, lineHeight: 0.98, fontWeight: 900, maxWidth: 940 }}>{title}</div>
            <div style={{ marginTop: 28, fontSize: 28, lineHeight: 1.28, color: "rgba(255,255,255,0.82)", maxWidth: 950 }}>
              {description}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, fontWeight: 800 }}>
            <div>Shaheed Nagar, Agra</div>
            <div>Call {site.mobile}</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}

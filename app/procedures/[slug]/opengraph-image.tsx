import { ImageResponse } from "next/og";
import { getPublicProcedure } from "@/lib/cms-public";
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
  const procedure = await getPublicProcedure(slug);
  const title = procedure?.title ?? "Gastroenterology Care";
  const summary = procedure?.summary ?? site.tagline;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #062832 0%, #0e7490 46%, #047857 100%)",
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
              "radial-gradient(circle at 18% 16%, rgba(34, 211, 238, 0.34), transparent 310px), radial-gradient(circle at 84% 14%, rgba(185, 133, 47, 0.34), transparent 260px)"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 72,
            right: 72,
            top: 60,
            bottom: 60,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "1px solid rgba(255,255,255,0.26)",
            background: "rgba(2, 22, 29, 0.62)",
            borderRadius: 22,
            padding: 52,
            boxShadow: "0 28px 80px rgba(2,22,29,0.35)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: "#b9852f"
              }}
            />
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", color: "#a5f3fc" }}>
              Mudgal Gastromedics Hospital
            </div>
          </div>
          <div>
            <div style={{ fontSize: 72, lineHeight: 0.96, fontWeight: 900, letterSpacing: -2, maxWidth: 920 }}>
              {title} in Agra
            </div>
            <div style={{ marginTop: 28, fontSize: 30, lineHeight: 1.28, color: "rgba(255,255,255,0.82)", maxWidth: 920 }}>
              {summary}
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

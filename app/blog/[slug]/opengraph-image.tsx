import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getSeoBlogPost } from "@/lib/blog-posts";
import { site } from "@/lib/site-data";

export const runtime = "edge";
export const alt = "Mudgal Gastromedics Hospital blog article";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

type OpenGraphImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { slug } = await params;
  const post = getSeoBlogPost(slug);
  if (!post) notFound();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#061f27",
          color: "white",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(circle at 15% 10%, ${post.accent}66, transparent 340px), radial-gradient(circle at 88% 24%, rgba(16,185,129,0.32), transparent 360px), linear-gradient(135deg, #061f27, #0d3d49 55%, #08242b)`
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -90,
            top: -80,
            width: 460,
            height: 460,
            borderRadius: 460,
            border: "2px solid rgba(255,255,255,0.12)"
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 72px",
            width: "100%",
            height: "100%"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 20px",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.1)",
                color: "#baf2ff",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 3,
                textTransform: "uppercase"
              }}
            >
              <span style={{ width: 12, height: 12, borderRadius: 12, background: post.accent }} />
              {post.category}
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#d9f8ff" }}>{site.city}</div>
          </div>

          <div style={{ maxWidth: 930, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 78, lineHeight: 0.96, fontWeight: 900, letterSpacing: -2 }}>
              {post.title}
            </div>
            <div style={{ marginTop: 28, maxWidth: 820, fontSize: 30, lineHeight: 1.35, color: "rgba(255,255,255,0.78)" }}>
              {post.description}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{site.name}</div>
              <div style={{ display: "flex", fontSize: 23, color: "rgba(255,255,255,0.74)" }}>
                {site.addressLine1}, {site.city} | Call {site.mobile}
              </div>
            </div>
            <div
              style={{
                padding: "18px 24px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.94)",
                color: "#092a33",
                fontSize: 26,
                fontWeight: 900
              }}
            >
              {post.relatedLabel}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}

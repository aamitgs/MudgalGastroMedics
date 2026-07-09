import { ImageResponse } from "next/og";
import { getSeoBlogPost } from "@/lib/blog-posts";
import { site } from "@/lib/site-data";

export const runtime = "edge";

type CoverImageProps = {
  params: Promise<{ slug: string }>;
};

const size = {
  width: 1600,
  height: 757
};

function topicIcon(value: string) {
  const text = value.toLowerCase();
  if (text.includes("liver") || text.includes("fibroscan") || text.includes("jaundice") || text.includes("sgpt")) return "LIVER";
  if (text.includes("colon") || text.includes("stool") || text.includes("ibd") || text.includes("ibs")) return "BOWEL";
  if (text.includes("ercp") || text.includes("bile") || text.includes("cbd") || text.includes("pancrea")) return "BILE";
  if (text.includes("endoscopy") || text.includes("swallow") || text.includes("ulcer")) return "GI";
  return "CARE";
}

export async function GET(_: Request, { params }: CoverImageProps) {
  const { slug } = await params;
  const post = getSeoBlogPost(slug);

  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  const label = topicIcon(`${post.title} ${post.category} ${post.keywords.join(" ")}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#061f27",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(3,31,39,0.98) 0%, rgba(6,55,67,0.9) 44%, rgba(8,145,178,0.36) 100%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            opacity: 0.72
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -80,
            top: 20,
            width: 670,
            height: 670,
            borderRadius: 670,
            border: "1px solid rgba(186,242,255,0.2)",
            background:
              "radial-gradient(circle at 44% 42%, rgba(34,211,238,0.32), rgba(16,185,129,0.16) 38%, rgba(255,255,255,0.04) 39%, transparent 70%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 78,
            top: 132,
            width: 430,
            height: 430,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.1)",
            transform: "rotate(3deg)"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 132,
            top: 182,
            width: 330,
            height: 330,
            borderRadius: 330,
            border: "2px solid rgba(186,242,255,0.38)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#baf2ff",
            fontSize: 82,
            fontWeight: 900,
            letterSpacing: 4
          }}
        >
          {label}
        </div>
        <div
          style={{
            position: "absolute",
            right: 116,
            bottom: 82,
            display: "flex",
            gap: 16
          }}
        >
          {["Liver Health", "Endoscopy", "Expert Care"].map((item) => (
            <div
              key={item}
              style={{
                padding: "14px 18px",
                borderRadius: 999,
                border: "1px solid rgba(186,242,255,0.26)",
                background: "rgba(3,31,39,0.64)",
                color: "#d9f8ff",
                fontSize: 22,
                fontWeight: 800
              }}
            >
              {item}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "74px 86px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: "linear-gradient(135deg, #22d3ee, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#05232b",
                fontSize: 28,
                fontWeight: 900
              }}
            >
              MGM
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 1 }}>{site.name}</div>
              <div style={{ marginTop: 5, fontSize: 20, color: "#c6f6ff", fontWeight: 700 }}>
                A Gastro & Liver Superspeciality Centre
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 860, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                alignSelf: "flex-start",
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(186,242,255,0.34)",
                background: "rgba(255,255,255,0.08)",
                color: "#77eaff",
                fontSize: 22,
                fontWeight: 900,
                letterSpacing: 3,
                textTransform: "uppercase"
              }}
            >
              Blog | {post.category}
            </div>
            <div style={{ marginTop: 34, fontSize: 78, lineHeight: 0.98, fontWeight: 900, maxWidth: 910 }}>
              {post.title}
            </div>
            <div style={{ marginTop: 26, maxWidth: 780, fontSize: 31, lineHeight: 1.35, color: "rgba(255,255,255,0.76)" }}>
              {post.description}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              color: "#d9f8ff",
              fontSize: 24,
              fontWeight: 800
            }}
          >
            <span>{site.city}</span>
            <span style={{ opacity: 0.55 }}>•</span>
            <span>{post.relatedLabel}</span>
            <span style={{ opacity: 0.55 }}>•</span>
            <span>Call {site.mobile}</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}

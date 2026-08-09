import { ImageResponse } from "next/og";
import { getBlogPost, getSettings } from "@/lib/data";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ggraphixc design note";
export const revalidate = 300;

async function loadManrope() {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Manrope:wght@700;800&display=swap"
    ).then((r) => r.text());
    const url = css.match(/url\((https:\/\/[^)]+)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function BlogOgImage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, s] = await Promise.all([getBlogPost(slug), getSettings().catch(() => null)]);
  const brand = s?.brand_name || "ggraphixc";
  const designer = s?.designer_name || "Godson Otobo";
  const role = s?.role_title || "Graphics Designer";
  const title = post?.title ?? "ggraphixc design note";
  const cover = post?.cover_url?.startsWith("http") ? post.cover_url : null;
  const tags = post?.tags ?? null;
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const fontData = await loadManrope();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "#0a0a0c",
          fontFamily: "Manrope, sans-serif",
          position: "relative"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -100,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "rgba(0,91,234,0.3)",
            filter: "blur(80px)"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -180,
            right: cover ? -60 : 300,
            width: 560,
            height: 560,
            borderRadius: "50%",
            background: "rgba(0,210,255,0.2)",
            filter: "blur(90px)"
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00d2ff, #005bea)",
              boxShadow: "0 0 16px rgba(0,210,255,0.8)"
            }}
          />
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f5f5f7", letterSpacing: -1 }}>
            {brand}
          </div>
          <div style={{ fontSize: 19, color: "#9aa0a8", fontWeight: 700, marginLeft: 8 }}>
            / DESIGN NOTES
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 48,
            position: "relative",
            width: "100%"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", flex: cover ? "1 1 60%" : "1 1 auto" }}>
            {tags && (
              <div
                style={{
                  alignSelf: "flex-start",
                  padding: "8px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(0,210,255,0.35)",
                  background: "rgba(0,210,255,0.08)",
                  color: "#9adff5",
                  fontSize: 18,
                  fontWeight: 700,
                  marginBottom: 20
                }}
              >
                {tags}
              </div>
            )}
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "#f5f5f7",
                lineHeight: 1.1,
                letterSpacing: -1.5,
                maxWidth: 640
              }}
            >
              {title}
            </div>
          </div>

          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              width={360}
              height={280}
              style={{ borderRadius: 22, objectFit: "cover", border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 360,
                height: 280,
                borderRadius: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, rgba(0,210,255,0.16), rgba(0,91,234,0.18))",
                border: "1px solid rgba(255,255,255,0.1)",
                fontSize: 92,
                fontWeight: 800,
                color: "rgba(245,245,247,0.5)",
                flexShrink: 0
              }}
            >
              {initials}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#9aa0a8" }}>
            {`${designer} · ${role}`}
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d2ff" }} />
          <div style={{ fontSize: 19, fontWeight: 700, color: "#9aa0a8" }}>
            Read the full note →
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Manrope", data: fontData, weight: 800 as const }]
        : []
    }
  );
}

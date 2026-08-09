import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data";
import { loadOgFont } from "@/lib/og-font";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Design studio";
// Rebuild periodically so settings edits (brand/designer/headline) show up in
// shared-link images without a full redeploy.
export const revalidate = 300;

export default async function OpengraphImage() {
  const s = await getSettings().catch(() => null);
  const brand = s?.brand_name || "ggraphixc";
  const designer = (s?.designer_name || "Godson Otobo").toUpperCase();
  const role = (s?.role_title || "Graphics Designer").toUpperCase();
  const headline = s?.hero_headline || "I Design Brands, Visuals & Digital Experiences";
  // Split the headline into two balanced lines so long settings copy never
  // overflows the 1200×630 canvas at the large font size.
  const words = headline.split(" ");
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");
  const fontData = await loadOgFont(800);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0a0a0c",
          fontFamily: "Manrope, sans-serif"
        }}
      >
        {/* ambient glows */}
        <div
          style={{
            position: "absolute",
            top: -180,
            left: -120,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: "rgba(0,91,234,0.35)",
            filter: "blur(80px)"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -200,
            right: -100,
            width: 620,
            height: 620,
            borderRadius: "50%",
            background: "rgba(0,210,255,0.22)",
            filter: "blur(90px)"
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00d2ff, #005bea)",
              boxShadow: "0 0 18px rgba(0,210,255,0.8)"
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 800, color: "#f5f5f7", letterSpacing: -1 }}>
            {brand}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div style={{ fontSize: 26, color: "#00d2ff", fontWeight: 700, marginBottom: 18 }}>
            {`${designer} · ${role}`}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              fontWeight: 800,
              color: "#f5f5f7",
              lineHeight: 1.05,
              letterSpacing: -2
            }}
          >
            <span>{line1}</span>
            {line2 && <span style={{ marginTop: 4 }}>{line2}</span>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative" }}>
          {["Brand Identity", "Creative Systems", "UI / Web", "Social & Motion"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid rgba(0,210,255,0.35)",
                background: "rgba(0,210,255,0.08)",
                color: "#9adff5",
                fontSize: 20,
                fontWeight: 700
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            { name: "Manrope", data: fontData, weight: 800 as const }
          ]
        : []
    }
  );
}

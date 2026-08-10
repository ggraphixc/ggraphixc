import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/data";
import { cloudinaryDownloadUrl } from "@/lib/images";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Press & Media Kit — ${s.brand_name}`,
    description: `Brand facts, logo downloads, colors and usage guidelines for ${s.brand_name} by ${s.designer_name}.`
  };
}

export default async function PressPage() {
  const s = await getSettings();
  const brand = s.brand_name || "ggraphixc";
  const designer = s.designer_name || "Godson Otobo";
  const logo = s.logo_image || "/images/brand/ggraphixc-logo.png";
  const email = s.contact_email || "hello@ggraphixc.vercel.app";
  const accent = "#00d2ff";
  const royal = "#005bea";
  const ink = "#0a0a0c";
  const paper = "#f5f5f7";

  const facts = [
    { label: "Studio", value: brand },
    { label: "Founder & designer", value: designer },
    { label: "Specialism", value: s.role_title || "Graphics Designer" },
    { label: "Location", value: s.location || "—" }
  ];

  const guidelines = [
    "Keep clear space around the logo equal to the height of the mark on all sides.",
    "Always use the original colors — never recolor, tint, or apply effects.",
    "Scale proportionally. Never stretch, squish, or rotate the mark.",
    "On busy or photographic backgrounds, place the logo on a solid surface or use the mono version."
  ];

  return (
    <div className="section" style={{ paddingTop: 160 }}>
      <div className="container" style={{ maxWidth: 980 }}>
        <span className="kicker">Press &amp; Media</span>
        <h1 className="section-title" style={{ fontSize: "clamp(30px, 5vw, 52px)", marginBottom: 16 }}>
          The {brand} Press Kit
        </h1>
        <p className="section-lead" style={{ maxWidth: 640, margin: 0 }}>
          Everything writers, podcasters and partners need — brand facts, logo files, colors and
          usage guidelines — in one place.
        </p>

        {/* Brand facts */}
        <div className="press-facts" style={{ marginTop: 40 }}>
          {facts.map((f) => (
            <div key={f.label} className="press-fact">
              <div className="press-fact-label">{f.label}</div>
              <div className="press-fact-value">{f.value}</div>
            </div>
          ))}
        </div>

        {/* Logo download */}
        <div className="press-grid" style={{ marginTop: 24 }}>
          <div className="glass" style={{ padding: 28, display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              <i className="fa-solid fa-download" style={{ color: "var(--accent)", marginRight: 10 }} />
              Brand mark
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 18 }}>
              Primary logo with transparency — ready for print and digital use.
            </p>
            <div
              className="press-logo"
              style={{
                flex: 1,
                minHeight: 180,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                marginBottom: 18,
                padding: 20
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo} alt={`${brand} logo`} style={{ maxWidth: "70%", maxHeight: 120, objectFit: "contain" }} />
            </div>
            <a href={cloudinaryDownloadUrl(logo)} download className="btn btn-primary" style={{ justifyContent: "center" }}>
              <i className="fa-solid fa-file-arrow-down" /> Download logo
            </a>
          </div>

          {/* Brand colors */}
          <div className="glass" style={{ padding: 28, display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
              <i className="fa-solid fa-palette" style={{ color: "var(--accent)", marginRight: 10 }} />
              Brand colors
            </h2>
            <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 18 }}>
              The palette used across {brand} communications.
            </p>
            <div className="press-swatches" style={{ flex: 1 }}>
              {[
                { name: "Accent", hex: accent, text: ink },
                { name: "Royal", hex: royal, text: "#ffffff" },
                { name: "Ink", hex: ink, text: "#ffffff" },
                { name: "Paper", hex: paper, text: ink }
              ].map((c) => (
                <div key={c.name} className="swatch" style={{ background: c.hex }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 12, color: c.text }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, opacity: 0.75, color: c.text, letterSpacing: "0.04em" }}>{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage guidelines */}
        <div className="glass" style={{ padding: 28, marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
            <i className="fa-solid fa-circle-check" style={{ color: "var(--accent)", marginRight: 10 }} />
            Usage guidelines
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.7, marginBottom: 14 }}>
            How to use the {brand} brand mark — please follow these to keep the brand consistent.
          </p>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0, listStyle: "none", margin: 0 }}>
            {guidelines.map((g) => (
              <li key={g} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.6, color: "var(--text)" }}>
                <i className="fa-solid fa-check" style={{ color: "var(--accent)", marginTop: 3, flexShrink: 0 }} />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Press contact */}
        <div
          className="glass"
          style={{
            marginTop: 24,
            padding: 30,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            border: "1px solid rgba(0, 210, 255, 0.25)",
            background: "rgba(0, 210, 255, 0.05)"
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Press inquiries</h2>
            <p style={{ color: "var(--muted)", fontSize: 13.5, margin: 0 }}>
              Interviews, features and collaborations — I usually reply within 24 hours.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href={`mailto:${email}?subject=Press%20inquiry`} className="btn btn-primary">
              <i className="fa-solid fa-envelope" /> {email}
            </a>
            <Link href="/contact" className="btn btn-ghost">
              Start a project <i className="fa-solid fa-arrow-right" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

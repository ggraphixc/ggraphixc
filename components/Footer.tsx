import Link from "next/link";
import { getSettings } from "@/lib/data";

const COLS = [
  {
    title: "Studio",
    links: [
      { label: "About", href: "/about" },
      { label: "Projects", href: "/projects" },
      { label: "Blog", href: "/blog" },
      { label: "Reviews", href: "/#reviews" }
    ]
  },
  {
    title: "Services",
    links: [
      { label: "Graphic Design", href: "/services" },
      { label: "Web & UI Design", href: "/services" },
      { label: "Branding", href: "/services" },
      { label: "Campaign & Social", href: "/services" }
    ]
  }
];

export default async function Footer() {
  const settings = await getSettings();
  const email = settings.contact_email || "hello@ggraphixc.com";

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 14 }}>
              <span className="dot" />
              ggraphixc
            </div>
            <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 280 }}>
              Premium brand identity, creative systems, and conversion-ready design by Godson Otobo.
            </p>
            <a
              href={`mailto:${email}`}
              style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700, display: "inline-block", marginTop: 10 }}
            >
              {email}
            </a>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text)", marginBottom: 12 }}>
                {col.title}
              </h4>
              {col.links.map((l) => (
                <Link key={l.label} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <h4 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text)", marginBottom: 12 }}>
              Contact
            </h4>
            <Link href={`mailto:${email}`}>{email}</Link>
            <Link href="/contact">Start a Project</Link>
            <Link href="/admin">Admin</Link>
          </div>
        </div>
        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid var(--border)",
            color: "var(--muted)",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <span>© 2026 ggraphixc. All rights reserved.</span>
          <span>Designed by Godson Otobo</span>
        </div>
      </div>
    </footer>
  );
}

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

const SOCIALS = [
  { icon: "fa-brands fa-behance", label: "Behance", href: "https://behance.net" },
  { icon: "fa-brands fa-instagram", label: "Instagram", href: "https://instagram.com" },
  { icon: "fa-brands fa-x-twitter", label: "X (Twitter)", href: "https://x.com" },
  { icon: "fa-brands fa-linkedin-in", label: "LinkedIn", href: "https://linkedin.com" }
];

export default async function Footer() {
  const settings = await getSettings();
  const email = settings.contact_email || "hello@ggraphixc.com";

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand" style={{ marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/brand/ggraphixc-logo.png" alt="" className="brand-mark" />
              ggraphixc
            </Link>
            <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 300, lineHeight: 1.7 }}>
              Premium brand identity, creative systems, and conversion-ready design by Godson Otobo.
            </p>
            <a
              href={`mailto:${email}`}
              style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700, display: "inline-block", marginTop: 12 }}
            >
              {email}
            </a>
            <div className="footer-social">
              {SOCIALS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}>
                  <i className={s.icon} />
                </a>
              ))}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <h4>{col.title}</h4>
              {col.links.map((l) => (
                <Link key={l.label} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
          <div>
            <h4>Contact</h4>
            <Link href={`mailto:${email}`}>{email}</Link>
            <Link href="/contact">Start a Project</Link>
            <Link href="/admin">Admin</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 ggraphixc. All rights reserved.</span>
          <span>Designed by Godson Otobo</span>
        </div>
      </div>
    </footer>
  );
}

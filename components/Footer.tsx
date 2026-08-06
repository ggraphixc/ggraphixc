import Link from "next/link";
import { getSettings } from "@/lib/data";
import NewsletterForm from "@/components/NewsletterForm";

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

const SOCIALS: { key: string; icon: string; label: string }[] = [
  { key: "social_behance", icon: "fa-brands fa-behance", label: "Behance" },
  { key: "social_instagram", icon: "fa-brands fa-instagram", label: "Instagram" },
  { key: "social_x", icon: "fa-brands fa-x-twitter", label: "X (Twitter)" },
  { key: "social_linkedin", icon: "fa-brands fa-linkedin-in", label: "LinkedIn" }
];

export default async function Footer() {
  const settings = await getSettings();
  const brand = settings.brand_name || "ggraphixc";
  const email = settings.contact_email || "hello@ggraphixc.com";
  const socials = SOCIALS.filter((s) => settings[s.key]);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link href="/" className="brand" style={{ marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/brand/ggraphixc-logo.png" alt="" className="brand-mark" />
              {brand}
            </Link>
            <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 300, lineHeight: 1.7 }}>
              {settings.footer_description}
            </p>
            <a
              href={`mailto:${email}`}
              style={{ color: "var(--accent)", fontSize: 14, fontWeight: 700, display: "inline-block", marginTop: 12 }}
            >
              {email}
            </a>
            {socials.length > 0 && (
              <div className="footer-social">
                {socials.map((s) => (
                  <a key={s.key} href={settings[s.key]} target="_blank" rel="noreferrer" aria-label={s.label}>
                    <i className={s.icon} />
                  </a>
                ))}
              </div>
            )}
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
          <NewsletterForm />
        </div>
        <div className="footer-bottom">
          <span>{settings.copyright_text}</span>
          <span>{settings.footer_credit}</span>
        </div>
      </div>
    </footer>
  );
}

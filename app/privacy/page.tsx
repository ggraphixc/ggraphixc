import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const brand = s.brand_name || "ggraphixc";
  return {
    title: `Privacy Policy — ${brand}`,
    description: `How ${brand} collects, uses, and protects your data.`
  };
}

export const revalidate = 300;

const SECTIONS: { h: string; body: string }[] = [
  {
    h: "What we collect",
    body:
      "Contact form: your name, email, phone/WhatsApp (optional), budget range, and message. Newsletter: your email address. Analytics: anonymous event counts (chat opened, message sent, contact form submitted) — no IPs, no cookies used for tracking."
  },
  {
    h: "How it's used",
    body:
      "Your contact message is read only by the studio to reply to your inquiry. Your newsletter email is used only to send you the monthly design notes you signed up for — every issue includes a one-click unsubscribe link, and you can email hello@ggraphixc.vercel.app any time to be removed."
  },
  {
    h: "Where it's stored",
    body:
      "Contact messages and newsletter signups are stored in Supabase (our database). Newsletter addresses are also synced to Brevo, the service we send email through. Uploaded images you see on the site are stored via Cloudinary. All of these providers are bound by their own data-processing agreements."
  },
  {
    h: "AI assistant",
    body:
      "The chat assistant on this site ('Concierge') uses Google's Gemini AI to answer questions about the studio and its work. Your question is sent to Google's API to generate the reply. Please don't include sensitive personal data in chat messages."
  },
  {
    h: "Cookies & local storage",
    body:
      "We don't use tracking cookies. The site uses browser local storage only for small conveniences (e.g. remembering that you dismissed the chat tip). The admin area uses an authentication session cookie so only the owner can sign in."
  },
  {
    h: "Your rights",
    body:
      "You can ask for a copy of the personal data we hold about you, ask us to correct it, or ask us to delete it — just email hello@ggraphixc.vercel.app. We'll act on reasonable requests within 30 days. Newsletter removal is instant via the unsubscribe link in any email."
  },
  {
    h: "Changes",
    body:
      "If this policy changes in a way that affects you, we'll update this page and, where relevant, mention it in a future newsletter."
  }
];

export default async function PrivacyPage() {
  const s = await getSettings();
  const brand = s.brand_name || "ggraphixc";
  const contactEmail = s.contact_email || "hello@ggraphixc.vercel.app";
  const SECTIONS_DYNAMIC = SECTIONS.map((sec) => ({
    ...sec,
    body: sec.body.replaceAll("hello@ggraphixc.vercel.app", contactEmail).replaceAll("the studio", brand)
  }));
  return (
    <section className="section" style={{ paddingTop: 160 }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <Reveal>
          <Link href="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
            <i className="fa-solid fa-arrow-left" /> Home
          </Link>
          <span className="kicker">Privacy</span>
          <h1 className="section-title" style={{ fontSize: "clamp(30px, 5vw, 48px)" }}>
            Privacy Policy
          </h1>
          <p className="section-lead" style={{ fontSize: 17 }}>
            Last updated: {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}.
            In plain language — this site collects very little, and uses it only to run its business.
          </p>
        </Reveal>

        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 0 }}>
          {SECTIONS_DYNAMIC.map((sec, i) => (
            <Reveal key={sec.h} delay={i * 40}>
              <div style={{ padding: "26px 0", borderTop: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 10 }}>{sec.h}</h2>
                <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.8 }}>{sec.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p style={{ marginTop: 40, color: "var(--muted)", fontSize: 14, lineHeight: 1.8 }}>
            Questions? Email{" "}
            <a href={`mailto:${contactEmail}`} style={{ color: "var(--accent)" }}>
              {contactEmail}
            </a>{" "}
            — or{" "}
            <Link href="/contact" style={{ color: "var(--accent)" }}>
              send a project brief
            </Link>
            .
          </p>
        </Reveal>
      </div>
    </section>
  );
}

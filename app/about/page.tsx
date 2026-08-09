import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `About — ${s.brand_name}`,
    description: `About ${s.designer_name} (${s.brand_name}) — a ${s.role_title.toLowerCase()} focused on clarity, craft, and brands that earn trust.`
  };
}

export const revalidate = 300;

const PROCESS = [
  { n: "01", t: "Discover", d: "We clarify your goals, audience, and what makes the brand different." },
  { n: "02", t: "Design", d: "Concepts, systems, and prototypes — refined against real feedback." },
  { n: "03", t: "Deliver", d: "Final assets, source files, and a kit your team can actually use." },
  { n: "04", t: "Grow", d: "Ongoing visual support so new work stays consistent and on-brand." }
];

const SKILLS = [
  "Brand Identity", "Logo Design", "Creative Systems", "Product & UI", "Social & Campaign",
  "Packaging & Print", "Art Direction", "Motion Graphics"
];

export default async function AboutPage() {
  const s = await getSettings();
  const stats = [
    { num: s.stats_projects, label: "Projects Delivered" },
    { num: s.stats_clients, label: "Happy Clients" },
    { num: s.stats_experience, label: "Years of Craft" },
    { num: s.stats_satisfaction, label: "Client Satisfaction" }
  ];

  return (
    <>
      <section className="section" style={{ paddingTop: 160, paddingBottom: 60 }}>
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">About</span>
              <h1 className="section-title">Design that earns attention, trust &amp; action</h1>
              <p className="section-lead" style={{ fontSize: 19 }}>{s.about_text}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40 }}>
        <div className="container">
          <div className="stat-grid">
            {stats.map((st) => (
              <Reveal key={st.label}>
                <div className="stat glass" style={{ padding: "28px 26px" }}>
                  <div className="num">{st.num}</div>
                  <div style={{ color: "var(--muted)", fontWeight: 600 }}>{st.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">Specialties</span>
              <h2 className="section-title">What I work on</h2>
              <p className="section-lead">
                Eight disciplines, one standard: every output earns its place in your brand system.
              </p>
            </div>
          </Reveal>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 28 }}>
            {SKILLS.map((sk) => (
              <span key={sk} className="kicker" style={{ background: "var(--glass)", borderColor: "var(--border)", color: "var(--text)" }}>
                {sk}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">Process</span>
              <h2 className="section-title">How we work</h2>
              <p className="section-lead">
                A clear, four-step rhythm that keeps every project moving and every decision documented.
              </p>
            </div>
          </Reveal>
          <div className="process-grid">
            {PROCESS.map((p, i) => (
              <Reveal key={p.n} delay={i * 60}>
                <div className="glass" style={{ padding: 26, height: "100%", position: "relative", overflow: "hidden" }}>
                  <div style={{ fontFamily: "Caveat, cursive", fontSize: 44, color: "var(--accent)", fontWeight: 600, lineHeight: 1 }}>{p.n}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, margin: "10px 0 6px" }}>{p.t}</h3>
                  <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.65 }}>{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div
              className="glass"
              style={{
                padding: "48px 40px",
                textAlign: "center",
                background: "linear-gradient(135deg, rgba(0,210,255,0.07), rgba(0,91,234,0.1)), var(--glass)"
              }}
            >
              <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: "clamp(24px, 3.5vw, 36px)" }}>
                Let&apos;s build your next advantage
              </h2>
              <p className="section-lead" style={{ margin: "12px auto 26px", textAlign: "center" }}>
                Tell me about your brand and where you want it to go.
              </p>
              <Link href="/contact" className="btn btn-primary">
                Start a Project <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

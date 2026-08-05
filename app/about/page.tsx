import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = {
  title: "About — ggraphixc",
  description: "About Godson Otobo (ggraphixc) — a graphics designer focused on clarity, craft, and brands that earn trust."
};

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
            <span className="kicker">About</span>
            <h1 className="section-title">Design that earns attention, trust & action</h1>
          </Reveal>
          <Reveal delay={100}>
            <p className="section-lead" style={{ fontSize: 19 }}>{s.about_text}</p>
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
            <h2 className="section-title">What I work on</h2>
          </Reveal>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            {SKILLS.map((sk) => (
              <span key={sk} className="kicker" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text)" }}>
                {sk}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <h2 className="section-title">How we work</h2>
          </Reveal>
          <div className="process-grid">
            {PROCESS.map((p, i) => (
              <Reveal key={p.n} delay={i * 60}>
                <div className="glass" style={{ padding: 26, height: "100%" }}>
                  <div style={{ fontFamily: "Caveat, cursive", fontSize: 40, color: "var(--accent)", fontWeight: 600 }}>{p.n}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, margin: "8px 0" }}>{p.t}</h3>
                  <p style={{ color: "var(--muted)", fontSize: 14 }}>{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ textAlign: "center" }}>
        <div className="container">
          <Reveal>
            <h2 className="section-title">Let&apos;s build your next advantage</h2>
            <p className="section-lead" style={{ margin: "0 auto 26px" }}>
              Tell me about your brand and where you want it to go.
            </p>
            <Link href="/contact" className="btn btn-primary">
              Start a Project <i className="fa-solid fa-arrow-right" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

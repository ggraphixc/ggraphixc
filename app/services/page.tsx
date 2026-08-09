import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getSettings, getServices } from "@/lib/data";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Services — ${s.brand_name}`,
    description: `Brand identity, creative systems, web/UI design, and campaign visuals by ${s.designer_name} (${s.brand_name}).`
  };
}

function featuresOf(s: { features: string | null }): string[] {
  return (s.features ?? "")
    .split(/\n+/)
    .map((f) => f.trim())
    .filter(Boolean);
}

const PROCESS = [
  { step: "01", title: "Discovery", description: "Understanding your goals, audience, and requirements through detailed consultation." },
  { step: "02", title: "Strategy", description: "Developing a clear approach and creative direction based on research and insights." },
  { step: "03", title: "Design", description: "Crafting visual solutions with meticulous attention to detail and creativity." },
  { step: "04", title: "Delivery", description: "Polishing, refining, and delivering final assets ready for implementation." }
];

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <section className="section" style={{ paddingTop: 170, paddingBottom: 60 }}>
        <div className="hero-glow" />
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">Services</span>
              <h1 className="section-title" style={{ fontSize: "clamp(36px, 5.5vw, 60px)" }}>
                What I <span className="accent-text">offer</span>
              </h1>
              <p className="section-lead">
                Comprehensive design solutions tailored to elevate your brand and achieve your business objectives.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          {services.map((s, index) => (
            <Reveal key={s.id} delay={index * 60}>
              <div
                className="glass service-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 44,
                  padding: "42px 40px",
                  marginBottom: 22,
                  alignItems: "center"
                }}
              >
                <div>
                  <div className="icon-accent" style={{ width: 54, height: 54, fontSize: 20, marginBottom: 18 }}>
                    <i className={`fa-solid ${s.icon}`} />
                  </div>
                  <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: "clamp(24px, 3vw, 34px)" }}>
                    {s.title}
                  </h2>
                  {s.subtitle && (
                    <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: 14, margin: "8px 0 12px" }}>
                      {s.subtitle}
                    </p>
                  )}
                  <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>{s.description}</p>
                </div>
                {featuresOf(s).length > 0 && (
                <div>
                  <div
                    className="service-features"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px 16px",
                      background: "rgba(0, 210, 255, 0.03)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: 24
                    }}
                  >
                    {featuresOf(s).map((f) => (
                      <span key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--accent), var(--royal))",
                            flexShrink: 0,
                            boxShadow: "0 0 8px rgba(0,210,255,0.5)"
                          }}
                        />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
        <div className="container">
          <Reveal>
            <div className="section-head">
              <span className="kicker">My Process</span>
              <h2 className="section-title">How I work</h2>
              <p className="section-lead">Four clear stages from first call to final delivery — no surprises, no drift.</p>
            </div>
          </Reveal>
          <div className="process-grid">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 80}>
                <div className="glass" style={{ padding: 28, height: "100%" }}>
                  <div
                    style={{
                      fontFamily: "Manrope, sans-serif",
                      fontSize: 46,
                      fontWeight: 800,
                      color: "rgba(0, 210, 255, 0.14)",
                      lineHeight: 1
                    }}
                  >
                    {p.step}
                  </div>
                  <h3 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: 18, margin: "12px 0 6px" }}>
                    {p.title}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>{p.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 20 }}>
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
                Ready to start your project?
              </h2>
              <p className="section-lead" style={{ margin: "12px auto 24px", textAlign: "center" }}>
                Let&apos;s discuss how I can help bring your vision to life with the right design solution.
              </p>
              <Link href="/contact" className="btn btn-primary">
                Get In Touch <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

import Reveal from "@/components/Reveal";

export default function About({ text }: { text: string }) {
  return (
    <section className="section" id="about">
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            gap: "50px",
            alignItems: "center"
          }}
          className="about-grid"
        >
          <Reveal>
            <div
              className="glass"
              style={{
                aspectRatio: "1 / 1",
                borderRadius: "24px",
                background:
                  "radial-gradient(circle at 30% 20%, rgba(0,210,255,0.22), transparent 55%), radial-gradient(circle at 80% 90%, rgba(0,91,234,0.25), transparent 55%), #0f0f12",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/about/portrait.jpg"
                alt="Godson Otobo — ggraphixc"
                loading="lazy"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <span className="kicker">About</span>
            <h2 className="section-title">Design that earns attention, trust & action</h2>
            <p className="section-lead" style={{ marginBottom: 24 }}>
              {text}
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span className="kicker" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text)" }}>
                Brand Identity
              </span>
              <span className="kicker" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text)" }}>
                Creative Systems
              </span>
              <span className="kicker" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text)" }}>
                Product UI
              </span>
              <span className="kicker" style={{ background: "rgba(255,255,255,0.04)", borderColor: "var(--border)", color: "var(--text)" }}>
                Social & Motion
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

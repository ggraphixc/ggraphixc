import Reveal from "@/components/Reveal";

export default function About({
  text,
  designerName = "Godson Otobo",
  roleTitle = "Brand & Visual Systems Designer",
  portrait = "/images/about/portrait.jpg"
}: {
  text: string;
  designerName?: string;
  roleTitle?: string;
  portrait?: string;
}) {
  const initials = designerName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
                borderRadius: "28px",
                background:
                  "radial-gradient(circle at 30% 20%, rgba(0,210,255,0.22), transparent 55%), radial-gradient(circle at 80% 90%, rgba(0,91,234,0.25), transparent 55%), #0f0f12",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                boxShadow: "var(--shadow)"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portrait}
                alt={designerName}
                loading="lazy"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  right: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "rgba(5,5,7,0.72)",
                  border: "1px solid var(--border-strong)",
                  backdropFilter: "blur(12px)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px"
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--accent), var(--royal))",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#04060a",
                    flexShrink: 0
                  }}
                >
                  {initials}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{designerName}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12.5 }}>{roleTitle}</div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <span className="kicker">About</span>
            <h2 className="section-title">Design that earns attention, trust &amp; action</h2>
            <p className="section-lead" style={{ marginBottom: 26, fontSize: 16.5 }}>
              {text}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["Brand Identity", "Creative Systems", "Product UI", "Social & Motion"].map((chip) => (
                <span
                  key={chip}
                  className="kicker"
                  style={{ background: "var(--glass)", borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {chip}
                </span>
              ))}
            </div>
            <a href="/about" className="btn btn-outline" style={{ marginTop: 28 }}>
              More about me <i className="fa-solid fa-arrow-right" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

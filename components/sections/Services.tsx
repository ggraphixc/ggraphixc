import Link from "next/link";
import Reveal from "@/components/Reveal";

const SERVICES = [
  {
    icon: "fa-palette",
    title: "Brand Identity",
    desc: "Logos, color systems, typography, and brand guidelines that make you instantly recognizable."
  },
  {
    icon: "fa-layer-group",
    title: "Creative Systems",
    desc: "Reusable templates, icon libraries, and asset kits so your team stays on-brand at scale."
  },
  {
    icon: "fa-object-group",
    title: "Product & UI Design",
    desc: "Clean interfaces and component libraries that remove friction from first tap to conversion."
  },
  {
    icon: "fa-bullhorn",
    title: "Social & Campaign",
    desc: "Scroll-stopping ad creative, carousels, and motion graphics built around real goals."
  },
  {
    icon: "fa-wand-magic-sparkles",
    title: "Packaging & Print",
    desc: "Tactile, premium packaging and print design that feels as good as it looks."
  },
  {
    icon: "fa-compass-drafting",
    title: "Art Direction",
    desc: "A consistent visual direction across every touchpoint, from shoots to launch."
  }
];

export default function Services() {
  return (
    <section className="section" id="services">
      <div className="container">
        <Reveal>
          <div className="section-head center">
            <span className="kicker">What I Do</span>
            <h2 className="section-title">Premium design, built to be seen &amp; trusted</h2>
            <p className="section-lead">
              Full-cycle visual craft — from first sketch to shipped system. One obsessive standard.
            </p>
          </div>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "22px",
            marginTop: 48
          }}
          className="services-grid"
        >
          {SERVICES.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <div className="glass service-card" style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="icon-accent" style={{ marginBottom: 18 }}>
                  <i className={`fa-solid ${s.icon}`} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.65, flex: 1 }}>{s.desc}</p>
                <Link
                  href="/services"
                  className="card-link"
                  style={{ color: "var(--accent)", fontSize: 13, fontWeight: 700 }}
                >
                  Explore service <i className="fa-solid fa-arrow-right" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

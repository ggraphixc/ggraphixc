import Link from "next/link";
import Reveal from "@/components/Reveal";
import type { Service } from "@/lib/types";

export default function Services({ items }: { items: Service[] }) {
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
          {items.map((s, i) => (
            <Reveal key={s.id} delay={i * 60}>
              <div className="glass service-card" style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column" }}>
                <div className="icon-accent" style={{ marginBottom: 18 }}>
                  <i className={`fa-solid ${s.icon}`} />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.65, flex: 1 }}>{s.description}</p>
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

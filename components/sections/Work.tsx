import Link from "next/link";
import Reveal from "@/components/Reveal";
import type { Project } from "@/lib/types";

export default function Work({ projects }: { projects: Project[] }) {
  return (
    <section className="section" id="work">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">Selected Work</span>
            <h2 className="section-title">Designs built to earn attention, trust &amp; action</h2>
            <p className="section-lead">
              A hand-picked selection of identities, systems, and campaigns — each one built around a real business goal.
            </p>
          </div>
        </Reveal>

        <div className="work-grid" style={{ marginTop: 44 }}>
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 50}>
              <Link
                className="work-card"
                href={`/projects/${p.slug}`}
                style={{ display: "flex" }}
              >
                <div className="thumb">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.title} loading="lazy" />
                  ) : null}
                  {p.category && <span className="tag">{p.category}</span>}
                  {p.featured && (
                    <span
                      className="tag"
                      style={{
                        left: "auto",
                        right: 14,
                        background: "rgba(0,210,255,0.9)",
                        borderColor: "transparent",
                        color: "#04060a"
                      }}
                    >
                      Featured
                    </span>
                  )}
                </div>
                <div className="body">
                  {p.result && <div className="result" style={{ marginBottom: 6 }}>{p.result}</div>}
                  <h3 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3 }}>{p.title}</h3>
                  {p.description && (
                    <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>{p.description}</p>
                  )}
                  <span className="card-link">
                    View case study <i className="fa-solid fa-arrow-right" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

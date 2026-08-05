import Reveal from "@/components/Reveal";
import type { Testimonial } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Testimonials({ items }: { items: Testimonial[] }) {
  return (
    <section className="section" id="reviews">
      <div className="container">
        <Reveal>
          <span className="kicker">Client Reviews</span>
          <h2 className="section-title">What clients say about working together</h2>
        </Reveal>

        <div className="t-grid" style={{ marginTop: 44 }}>
          {items.map((t, i) => (
            <Reveal key={t.id} delay={i * 60}>
              <div className="t-card glass" style={{ padding: 28 }}>
                <p className="quote">“{t.quote}”</p>
                <div className="who">
                  {t.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="avatar" src={t.avatar_url} alt={t.name} />
                  ) : (
                    <span className="avatar">{initials(t.name)}</span>
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

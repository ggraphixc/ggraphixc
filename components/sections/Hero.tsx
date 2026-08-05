import Reveal from "@/components/Reveal";
import HeroCanvas from "@/components/three/HeroCanvas";

export default function Hero({
  headline,
  lead
}: {
  headline: string;
  lead: string;
}) {
  return (
    <section className="hero" id="top">
      <HeroCanvas />
      <div className="hero-glow" />
      <div className="container hero-inner">
        <Reveal>
          <div className="hero-badge badge-handle">
            <span className="badge-dot" aria-hidden="true" />
            <span>
              Graphics Designer · Brand &amp; Visual Systems
            </span>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h1>{headline}</h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="lead">{lead}</p>
        </Reveal>
        <Reveal delay={240}>
          <div className="hero-actions">
            <a href="#contact" className="btn btn-primary">
              Start a Project <i className="fa-solid fa-arrow-right" />
            </a>
            <a href="#work" className="btn btn-outline">
              View Selected Work
            </a>
          </div>
        </Reveal>
        <Reveal delay={320}>
          <div className="hero-proof">
            <span className="stars" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <i key={i} className="fa-solid fa-star" />
              ))}
            </span>
            <span>5.0 rated by <strong>40+ brands</strong></span>
            <span className="divider" aria-hidden="true" />
            <span>
              <strong>6+ years</strong> of visual craft
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

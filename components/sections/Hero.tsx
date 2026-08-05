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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/brand/ggraphixc-logo.png" alt="" style={{ height: 18, width: "auto" }} />
            Graphics Designer · Brand & Visual Systems
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
      </div>
    </section>
  );
}

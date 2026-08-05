import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section" style={{ paddingTop: 170, minHeight: "70vh", display: "flex", alignItems: "center" }}>
      <div className="hero-glow" />
      <div className="container" style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div
          className="kicker"
          style={{ margin: "0 auto 18px", fontSize: 12 }}
        >
          Error 404
        </div>
        <h1 className="section-title" style={{ fontSize: "clamp(44px, 9vw, 96px)", margin: "0 0 12px" }}>
          Lost in the <span className="accent-text">layout</span>
        </h1>
        <p className="section-lead" style={{ margin: "0 auto 32px", maxWidth: 460 }}>
          The page you&apos;re looking for doesn&apos;t exist — or it took a wrong turn during art direction.
        </p>
        <div className="hero-actions">
          <Link href="/" className="btn btn-primary">
            <i className="fa-solid fa-house" /> Back to Home
          </Link>
          <Link href="/projects" className="btn btn-outline">
            Browse Projects
          </Link>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import ProjectGallery from "@/components/ProjectGallery";
import { getProjects, getProjectBySlug, getProjectGallery } from "@/lib/data";

export const revalidate = 300;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found — ggraphixc" };
  // The branded social-share image comes from ./opengraph-image.tsx (cover +
  // title, generated per project) — no raw-URL override needed here.
  return {
    title: `${project.title} — ggraphixc`,
    description: project.description ?? undefined,
    openGraph: {
      title: project.title,
      description: project.description ?? undefined
    }
  };
}

export default async function ProjectCaseStudy({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const [allProjects, gallery] = await Promise.all([
    getProjects(),
    getProjectGallery(project.id)
  ]);

  const idx = allProjects.findIndex((p) => p.id === project.id);
  const prev = idx > 0 ? allProjects[idx - 1] : null;
  const next = idx >= 0 && idx < allProjects.length - 1 ? allProjects[idx + 1] : null;

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ggraphixc.vercel.app";
  const projectLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.description ?? undefined,
    image: project.image_url ?? undefined,
    creator: { "@type": "Person", name: "Godson Otobo", url: base },
    url: `${base}/projects/${project.slug}`,
    genre: project.category ?? undefined
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(projectLd) }} />
      <section className="cs-hero">
        <div className="hero-glow" />
        <div className="container">
          <Reveal>
            <Link href="/projects" className="btn btn-ghost btn-sm" style={{ marginBottom: 22 }}>
              <i className="fa-solid fa-arrow-left" /> All Projects
            </Link>
            <div style={{ margin: "10px 0" }}>
              <span className="kicker">{project.category ?? "Case Study"}</span>
            </div>
            <h1 className="section-title vt-title" style={{ fontSize: "clamp(32px, 6vw, 64px)", maxWidth: "18ch" }}>
              {project.title}
            </h1>
            {project.description && (
              <p className="section-lead" style={{ fontSize: 18, marginTop: 10 }}>
                {project.description}
              </p>
            )}
            <div className="cs-meta">
              {project.client_name && (
                <span className="chip">
                  Client <strong>{project.client_name}</strong>
                </span>
              )}
              {project.result && (
                <span className="chip">
                  Outcome <strong>{project.result}</strong>
                </span>
              )}
              {project.featured && (
                <span className="chip">
                  <strong style={{ color: "var(--accent)" }}>Featured</strong>
                </span>
              )}
            </div>
          </Reveal>

          {project.image_url && (
            <Reveal delay={80}>
              <div className="thumb-hero" style={{ marginTop: 20 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={project.image_url} alt={project.title} />
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {(project.challenge || project.solution || project.results) && (
        <section className="section" style={{ paddingTop: 30 }}>
          <div className="container" style={{ maxWidth: 900 }}>
            {project.challenge && (
              <Reveal>
                <div className="cs-block">
                  <h3>The Challenge</h3>
                  <p>{project.challenge}</p>
                </div>
              </Reveal>
            )}
            {project.solution && (
              <Reveal>
                <div className="cs-block">
                  <h3>The Approach</h3>
                  <p>{project.solution}</p>
                </div>
              </Reveal>
            )}
            {project.results && (
              <Reveal>
                <div className="cs-block">
                  <h3>The Results</h3>
                  <p>{project.results}</p>
                </div>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="section" style={{ paddingTop: 10 }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            <Reveal>
              <span className="kicker">Gallery</span>
              <h2 className="section-title" style={{ fontSize: "clamp(24px, 3.5vw, 38px)" }}>
                Inside the project
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <div style={{ marginTop: 30 }}>
                <ProjectGallery images={gallery} />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className="section" style={{ paddingTop: 10 }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <Reveal>
            <div
              className="glass"
              style={{
                padding: "44px 40px",
                textAlign: "center",
                background:
                  "linear-gradient(135deg, rgba(0,210,255,0.07), rgba(0,91,234,0.1)), rgba(255,255,255,0.02)"
              }}
            >
              <h2 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 800, fontSize: "clamp(24px, 3.5vw, 36px)" }}>
                Have a brief like this?
              </h2>
              <p className="section-lead" style={{ margin: "12px auto 24px", textAlign: "center" }}>
                Let&apos;s turn your project into the next case study. I reply within 24 hours.
              </p>
              <Link href="/contact" className="btn btn-primary">
                Start Your Project <i className="fa-solid fa-arrow-right" />
              </Link>
            </div>
          </Reveal>

          {(prev || next) && (
            <Reveal delay={100}>
              <nav className="cs-nav" aria-label="Other projects">
                {prev ? (
                  <Link href={`/projects/${prev.slug}`} style={{ textAlign: "left" }}>
                    <span className="dir">← Previous</span>
                    <div className="t">{prev.title}</div>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link href={`/projects/${next.slug}`} style={{ textAlign: "right" }}>
                    <span className="dir">Next →</span>
                    <div className="t">{next.title}</div>
                  </Link>
                ) : (
                  <span />
                )}
              </nav>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}

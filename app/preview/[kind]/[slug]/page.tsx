import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost, getProjectBySlug, getProjectGallery } from "@/lib/data";
import { verifyPreview } from "@/lib/preview-link";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PreviewPage({
  params,
  searchParams
}: {
  params: Promise<{ kind: string; slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { kind, slug } = await params;
  const { t } = await searchParams;

  const payload = t ? verifyPreview(t) : null;
  const expected = `${kind}:${slug}`;
  if (payload !== expected) {
    return (
      <section className="section" style={{ paddingTop: 160 }}>
        <div className="container" style={{ maxWidth: 640, textAlign: "center" }}>
          <div className="glass" style={{ padding: 48 }}>
            <span className="kicker" style={{ marginBottom: 16 }}>
              <i className="fa-solid fa-lock" style={{ marginRight: 6 }} /> Draft preview
            </span>
            <h1 className="section-title" style={{ fontSize: "clamp(26px, 4vw, 40px)" }}>
              Invalid or expired preview link
            </h1>
            <p className="section-lead" style={{ margin: "0 auto" }}>
              Preview links are signed for a reason — only the admin can open unpublished content.
              Head back to the admin panel and copy a fresh preview link from the blog or projects page.
            </p>
            <Link href="/admin" className="btn btn-primary" style={{ marginTop: 24 }}>
              <i className="fa-solid fa-arrow-left" /> Back to admin
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (kind === "blog") {
    const post = await getBlogPost(slug);
    if (!post) notFound();
    const paragraphs = post.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    return (
      <article className="section" style={{ paddingTop: 160 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <PreviewBanner type="blog post" title={post.title} />
          <Link href="/admin/blog" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
            <i className="fa-solid fa-arrow-left" /> Back to admin
          </Link>
          {post.tags && <div style={{ margin: "16px 0 4px" }}><span className="kicker">{post.tags}</span></div>}
          <h1 className="section-title" style={{ fontSize: "clamp(30px, 5vw, 52px)" }}>{post.title}</h1>
          {post.excerpt && <p className="section-lead" style={{ fontSize: 19 }}>{post.excerpt}</p>}
          {post.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover_url} alt={post.title} style={{ width: "100%", borderRadius: 18, display: "block", marginTop: 30 }} />
          )}
          <div style={{ marginTop: 34, fontSize: 17, lineHeight: 1.8, color: "#d9d9de" }}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{ marginBottom: 20 }}>{para}</p>
            ))}
          </div>
        </div>
      </article>
    );
  }

  // kind === "project"
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  const gallery = await getProjectGallery(project.id);
  return (
    <article>
      <section className="cs-hero">
        <div className="hero-glow" />
        <div className="container">
          <PreviewBanner type="project" title={project.title} />
          <Link href="/admin/projects" className="btn btn-ghost btn-sm" style={{ marginBottom: 22 }}>
            <i className="fa-solid fa-arrow-left" /> Back to admin
          </Link>
          <div style={{ margin: "10px 0" }}>
            <span className="kicker">{project.category ?? "Case Study"}</span>
          </div>
          <h1 className="section-title vt-title" style={{ fontSize: "clamp(32px, 6vw, 64px)", maxWidth: "18ch" }}>
            {project.title}
          </h1>
          {project.description && (
            <p className="section-lead" style={{ fontSize: 18, marginTop: 10 }}>{project.description}</p>
          )}
          <div className="cs-meta">
            {project.client_name && (
              <span className="chip">Client <strong>{project.client_name}</strong></span>
            )}
            {project.result && (
              <span className="chip">Outcome <strong>{project.result}</strong></span>
            )}
          </div>
          {project.image_url && (
            <div className="thumb-hero" style={{ marginTop: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={project.image_url} alt={project.title} />
            </div>
          )}
        </div>
      </section>
      {(project.challenge || project.solution || project.results) && (
        <section className="section" style={{ paddingTop: 30 }}>
          <div className="container" style={{ maxWidth: 900 }}>
            {project.challenge && (
              <div className="cs-block"><h3>The Challenge</h3><p>{project.challenge}</p></div>
            )}
            {project.solution && (
              <div className="cs-block"><h3>The Approach</h3><p>{project.solution}</p></div>
            )}
            {project.results && (
              <div className="cs-block"><h3>The Results</h3><p>{project.results}</p></div>
            )}
          </div>
        </section>
      )}
      {gallery.length > 0 && (
        <section className="section" style={{ paddingTop: 10 }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            <span className="kicker">Gallery</span>
            <h2 className="section-title" style={{ fontSize: "clamp(24px, 3.5vw, 38px)" }}>Inside the project</h2>
            <div className="gallery-grid" style={{ marginTop: 30 }}>
              {gallery.map((g) => (
                <div key={g.id} className="g-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.image_url} alt={g.alt_text ?? project.title} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function PreviewBanner({ type, title }: { type: string; title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        marginBottom: 20,
        padding: "12px 18px",
        borderRadius: "var(--radius-md)",
        border: "1px dashed rgba(255, 180, 84, 0.5)",
        background: "rgba(255, 180, 84, 0.07)",
        color: "#ffb454",
        fontSize: 13.5,
        fontWeight: 700
      }}
    >
      <i className="fa-solid fa-eye" />
      <span>
        Draft preview — “{title}” is not public yet. Only people with this link can see it.
      </span>
    </div>
  );
}

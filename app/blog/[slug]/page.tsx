import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import TrackDownload from "@/components/TrackDownload";
import PageViewTracker from "@/components/PageViewTracker";
import { getBlogPost, getPublishedBlog, getSettings } from "@/lib/data";
import { cloudinaryDownloadUrl, fileNameFromUrl, watermarkFromSettings } from "@/lib/images";

export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await getPublishedBlog();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Post not found — ggraphixc" };
  return { title: `${post.title} — ggraphixc`, description: post.excerpt ?? undefined };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([getBlogPost(slug), getSettings()]);
  if (!post) notFound();
  const watermark = watermarkFromSettings(settings);
  // Blog images follow the global download setting (no per-post override).
  const blogDownloadsOk = settings.allow_downloads !== "no";

  // Parse content: lines starting with "## " become section headings (rendered
  // as h2 with an id for the table of contents); everything else is a paragraph.
  const blocks = post.content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  type PostBlock =
    | { type: "h2"; text: string; id: string }
    | { type: "p"; text: string }
    | { type: "img"; src: string; alt: string };
  const sections: { id: string; heading: string }[] = [];
  // Markdown-style images (![alt](url)) on their own line become clickable,
  // downloadable figures; "## " lines become TOC-able section headings.
  const IMG_RE = /^!\[([^\]]*)\]\((\S+)\)\s*$/;
  const rendered: PostBlock[] = blocks.map((block) => {
    const img = block.match(IMG_RE);
    if (img) {
      return { type: "img" as const, src: img[2], alt: img[1].trim() || "Blog image" };
    }
    const m = block.match(/^##\s+(.+)$/);
    if (m) {
      const heading = m[1].trim();
      const id = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      sections.push({ id, heading });
      return { type: "h2" as const, text: heading, id };
    }
    return { type: "p" as const, text: block };
  });

  // Reading time: ~200 words per minute, minimum 1 minute.
  const wordCount = post.content.trim().split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.round(wordCount / 200));

  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://ggraphixc.vercel.app";
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_url ? [post.cover_url] : undefined,
    datePublished: post.created_at,
    author: { "@type": "Person", name: settings.designer_name || "Godson Otobo", url: base },
    publisher: {
      "@type": "Organization",
      name: settings.brand_name || "ggraphixc",
      url: base
    },
    mainEntityOfPage: `${base}/blog/${post.slug}`
  };

  return (
    <article className="section" style={{ paddingTop: 160 }}>
      <PageViewTracker kind="post" slug={post.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <div className="container" style={{ maxWidth: 760 }}>
        <Reveal>
          <Link href="/blog" className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }}>
            <i className="fa-solid fa-arrow-left" /> Back to Blog
          </Link>
          {post.tags && <div style={{ margin: "16px 0 4px" }}><span className="kicker">{post.tags}</span></div>}
          <h1 className="section-title" style={{ fontSize: "clamp(30px, 5vw, 52px)" }}>{post.title}</h1>
          {post.excerpt && <p className="section-lead" style={{ fontSize: 19 }}>{post.excerpt}</p>}
          <div className="post-meta" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", color: "var(--muted)", fontSize: 13, marginTop: 16 }}>
            <span>
              <i className="fa-regular fa-clock" style={{ marginRight: 6 }} />
              {readMinutes} min read
            </span>
            <span className="divider" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-strong)" }} aria-hidden="true" />
            <span>
              <i className="fa-regular fa-calendar" style={{ marginRight: 6 }} />
              {new Date(post.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </span>
          </div>
        </Reveal>

        {post.cover_url && (
          <Reveal delay={80}>
            <figure className="blog-img" style={{ marginTop: 30 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover_url} alt={post.title} />
              <div className="blog-img-actions">
                <a href={post.cover_url} target="_blank" rel="noopener noreferrer" className="blog-img-btn">
                  <i className="fa-solid fa-expand" aria-hidden="true" /> Open
                </a>
                {blogDownloadsOk ? (
                  <TrackDownload
                    href={cloudinaryDownloadUrl(post.cover_url, watermark)}
                    download={fileNameFromUrl(post.cover_url, "ggraphixc-cover")}
                    kind="post"
                    slug={post.slug}
                    className="blog-img-btn blog-img-dl"
                  >
                    <i className="fa-solid fa-download" aria-hidden="true" /> Download
                  </TrackDownload>
                ) : (
                  <a
                    href={`/contact?about=${encodeURIComponent(`Request access to the images from the post: ${post.title}`)}`}
                    className="blog-img-btn blog-img-dl"
                  >
                    <i className="fa-solid fa-lock" aria-hidden="true" /> Request access
                  </a>
                )}
              </div>
            </figure>
          </Reveal>
        )}

        <div
          className="post-layout"
          style={{
            display: "grid",
            gridTemplateColumns: sections.length > 0 ? "minmax(0,1fr) 220px" : "minmax(0,1fr)",
            gap: 40,
            alignItems: "start"
          }}
        >
          <div style={{ marginTop: 34, fontSize: 17, lineHeight: 1.8, color: "var(--text)" }}>
            {rendered.map((block, i) =>
              block.type === "img" ? (
                <figure key={i} className="blog-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.src} alt={block.alt} loading="lazy" />
                  <div className="blog-img-actions">
                    <a href={block.src} target="_blank" rel="noopener noreferrer" className="blog-img-btn">
                      <i className="fa-solid fa-expand" aria-hidden="true" /> Open
                    </a>
                    {blogDownloadsOk ? (
                      <TrackDownload
                        href={cloudinaryDownloadUrl(block.src, watermark)}
                        download={fileNameFromUrl(block.src, `ggraphixc-blog-image-${i + 1}`)}
                        kind="post"
                        slug={post.slug}
                        className="blog-img-btn blog-img-dl"
                      >
                        <i className="fa-solid fa-download" aria-hidden="true" /> Download
                      </TrackDownload>
                    ) : (
                      <a
                        href={`/contact?about=${encodeURIComponent(`Request access to the images from the post: ${post.title}`)}`}
                        className="blog-img-btn blog-img-dl"
                      >
                        <i className="fa-solid fa-lock" aria-hidden="true" /> Request access
                      </a>
                    )}
                  </div>
                </figure>
              ) : block.type === "h2" ? (
                <h2 key={i} id={block.id} style={{ fontSize: 24, fontWeight: 800, margin: "36px 0 14px", scrollMarginTop: 100 }}>
                  {block.text}
                </h2>
              ) : (
                <p key={i} style={{ marginBottom: 20 }}>{block.text}</p>
              )
            )}
          </div>
          {sections.length > 0 && (
            <nav
              className="post-toc"
              aria-label="Table of contents"
              style={{
                position: "sticky",
                top: 110,
                padding: "18px 20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--glass)",
                fontSize: 13.5,
                marginTop: 34
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginBottom: 12 }}>
                On this page
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    style={{ color: "var(--muted)", fontWeight: 600, lineHeight: 1.4, transition: "color 0.2s var(--cb)" }}
                    className="toc-link"
                  >
                    {sec.heading}
                  </a>
                ))}
              </div>
            </nav>
          )}
        </div>

        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          <Link href="/contact" className="btn btn-primary">
            Work with me <i className="fa-solid fa-arrow-right" />
          </Link>
        </div>
      </div>
    </article>
  );
}

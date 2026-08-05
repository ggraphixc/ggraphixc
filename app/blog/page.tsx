import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { getPublishedBlog } from "@/lib/data";

export const metadata: Metadata = {
  title: "Blog — ggraphixc",
  description: "Design notes, brand systems, and process from Godson Otobo (ggraphixc)."
};

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedBlog();

  return (
    <section className="section" style={{ paddingTop: 160 }}>
      <div className="container">
        <Reveal>
          <span className="kicker">Blog</span>
          <h1 className="section-title">Notes on design & brand</h1>
          <p className="section-lead">Short, practical writing on brand systems, visual craft, and process.</p>
        </Reveal>

        <div className="work-grid" style={{ marginTop: 40 }}>
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={i * 50}>
              <Link href={`/blog/${p.slug}`} className="work-card" style={{ display: "block", height: "100%" }}>
                <div className="thumb">
                  {p.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_url} alt={p.title} loading="lazy" />
                  ) : null}
                  {p.tags && <span className="tag">{p.tags}</span>}
                </div>
                <div className="body">
                  <h3 style={{ fontSize: 20, fontWeight: 800 }}>{p.title}</h3>
                  {p.excerpt && <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>{p.excerpt}</p>}
                  <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13, display: "inline-block", marginTop: 14 }}>
                    Read post →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {posts.length === 0 && <p style={{ color: "var(--muted)" }}>No posts published yet.</p>}
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import BlogExplorer from "@/components/BlogExplorer";
import { getPublishedBlog, getSettings } from "@/lib/data";
import { getPopularContent } from "@/lib/analytics";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: `Blog — ${s.brand_name}`,
    description: `Design notes, brand systems, and process from ${s.designer_name} (${s.brand_name}).`
  };
}

export const revalidate = 300;

export default async function BlogPage() {
  const posts = await getPublishedBlog();

  // Most-read strip: resolve the top viewed post slugs to titles. Best-effort —
  // if analytics is empty or the table's missing, the strip simply doesn't show.
  let mostRead: { slug: string; title: string; count: number }[] = [];
  try {
    const popular = await getPopularContent(30);
    const postSlugs = popular.filter((p) => p.kind === "post").slice(0, 5).map((p) => p.slug);
    if (postSlugs.length > 0) {
      const sb = getServiceSupabase();
      const { data } = await sb
        .from("blog_posts")
        .select("slug, title")
        .in("slug", postSlugs);
      const titleOf = new Map((data as { slug: string; title: string }[]).map((r) => [r.slug, r.title]));
      mostRead = popular
        .filter((p) => p.kind === "post")
        .slice(0, 5)
        .map((p) => ({ slug: p.slug, title: titleOf.get(p.slug) ?? p.slug, count: p.count }))
        .filter((r) => titleOf.has(r.slug));
    }
  } catch {}

  return (
    <section className="section" style={{ paddingTop: 160 }}>
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">Blog</span>
            <h1 className="section-title">Notes on design &amp; brand</h1>
            <p className="section-lead">Short, practical writing on brand systems, visual craft, and process.</p>
          </div>
        </Reveal>

        {mostRead.length > 0 && (
          <Reveal delay={60}>
            <div
              style={{
                marginTop: 28,
                padding: "16px 20px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                background: "var(--glass)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap"
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", flexShrink: 0 }}>
                <i className="fa-solid fa-fire" style={{ marginRight: 6 }} />
                Most read
              </span>
              {mostRead.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  style={{ fontSize: 13.5, fontWeight: 700, color: "var(--muted)", transition: "color 0.2s var(--cb)" }}
                  className="most-read-link"
                >
                  {r.title}
                </Link>
              ))}
            </div>
          </Reveal>
        )}

        {posts.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No posts published yet.</p>
        ) : (
          <BlogExplorer posts={posts} />
        )}
      </div>
    </section>
  );
}

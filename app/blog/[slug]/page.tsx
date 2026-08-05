import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import { getBlogPost, getPublishedBlog } from "@/lib/data";

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
  const post = await getBlogPost(slug);
  if (!post) notFound();

  const paragraphs = post.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="section" style={{ paddingTop: 160 }}>
      <div className="container" style={{ maxWidth: 760 }}>
        <Reveal>
          <Link href="/blog" className="btn btn-ghost btn-sm" style={{ marginBottom: 22 }}>
            <i className="fa-solid fa-arrow-left" /> Back to Blog
          </Link>
          {post.tags && <div style={{ margin: "14px 0" }}><span className="kicker">{post.tags}</span></div>}
          <h1 className="section-title" style={{ fontSize: "clamp(30px, 5vw, 52px)" }}>{post.title}</h1>
          {post.excerpt && <p className="section-lead" style={{ fontSize: 19 }}>{post.excerpt}</p>}
        </Reveal>

        {post.cover_url && (
          <Reveal delay={80}>
            <div className="work-card" style={{ marginTop: 30, border: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.cover_url} alt={post.title} style={{ width: "100%", borderRadius: 18, display: "block" }} />
            </div>
          </Reveal>
        )}

        <div style={{ marginTop: 34, fontSize: 17, lineHeight: 1.8, color: "#d9d9de" }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ marginBottom: 20 }}>{para}</p>
          ))}
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

import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import BlogExplorer from "@/components/BlogExplorer";
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
          <div className="section-head">
            <span className="kicker">Blog</span>
            <h1 className="section-title">Notes on design &amp; brand</h1>
            <p className="section-lead">Short, practical writing on brand systems, visual craft, and process.</p>
          </div>
        </Reveal>

        {posts.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No posts published yet.</p>
        ) : (
          <BlogExplorer posts={posts} />
        )}
      </div>
    </section>
  );
}

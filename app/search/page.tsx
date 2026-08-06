import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { searchContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search — ggraphixc",
  description: "Search ggraphixc's portfolio projects and design notes."
};

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const { projects, posts } = query ? await searchContent(query) : { projects: [], posts: [] };
  const total = projects.length + posts.length;

  return (
    <section className="section" style={{ paddingTop: 160 }}>
      <div className="container" style={{ maxWidth: 900 }}>
        <Reveal>
          <span className="kicker">Search</span>
          <h1 className="section-title" style={{ fontSize: "clamp(30px, 5vw, 48px)" }}>
            Find work &amp; notes
          </h1>
        </Reveal>

        <form action="/search" method="get" style={{ marginTop: 26 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              padding: "6px 6px 6px 20px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.03)",
              maxWidth: 560
            }}
          >
            <i className="fa-solid fa-magnifying-glass" style={{ color: "var(--muted)", fontSize: 15 }} />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search projects, brand systems, design notes…"
              aria-label="Search"
              autoFocus={Boolean(query)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, padding: "12px 0" }}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: "10px 22px" }}>
              Search
            </button>
          </div>
        </form>

        {!query ? (
          <p style={{ color: "var(--muted)", marginTop: 40, fontSize: 15 }}>
            Type a keyword above to search case studies and blog posts — e.g. “brand”, “social”, “UI”.
          </p>
        ) : total === 0 ? (
          <p style={{ color: "var(--muted)", marginTop: 40, fontSize: 15 }}>
            Nothing matched <strong style={{ color: "var(--text)" }}>“{query}”</strong>. Try a broader term,
            or browse <Link href="/projects" style={{ color: "var(--accent)" }}>all projects</Link>.
          </p>
        ) : (
          <div style={{ marginTop: 34 }}>
            <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 16 }}>
              {total} result{total === 1 ? "" : "s"} for <strong style={{ color: "var(--text)" }}>“{query}”</strong>
            </p>

            {projects.length > 0 && (
              <div style={{ marginBottom: 30 }}>
                <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12, color: "var(--accent)" }}>
                  <i className="fa-solid fa-images" style={{ marginRight: 8 }} />
                  Projects
                </h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {projects.map((p) => (
                    <Link
                      key={p.id}
                      href={`/projects/${p.slug}`}
                      className="glass"
                      style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                        padding: 14,
                        borderRadius: 14,
                        textDecoration: "none"
                      }}
                    >
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.image_url}
                          alt=""
                          style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 10, flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ width: 72, height: 52, borderRadius: 10, background: "var(--surface)", flexShrink: 0 }} />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15.5, color: "var(--text)" }}>{p.title}</div>
                        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span>{p.category ?? "Case study"}</span>
                          {p.result && (
                            <span style={{ color: "var(--accent)", fontWeight: 600 }}>{p.result}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 12, color: "var(--accent)" }}>
                  <i className="fa-solid fa-pen-nib" style={{ marginRight: 8 }} />
                  Design notes
                </h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {posts.map((b) => (
                    <Link
                      key={b.id}
                      href={`/blog/${b.slug}`}
                      className="glass"
                      style={{ display: "block", padding: 16, borderRadius: 14, textDecoration: "none" }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: "var(--text)" }}>{b.title}</div>
                      {b.excerpt && (
                        <div style={{ color: "var(--muted)", fontSize: 13.5, marginTop: 5, lineHeight: 1.6 }}>{b.excerpt}</div>
                      )}
                      {b.tags && (
                        <span style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, display: "inline-block" }}>
                          {b.tags}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

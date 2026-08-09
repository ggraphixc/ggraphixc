"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import type { BlogPost } from "@/lib/types";

export default function BlogExplorer({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState("All");

  const tags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.tags?.split(",").map((t) => t.trim()).filter(Boolean).forEach((t) => set.add(t)));
    return ["All", ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const inTag = tag === "All" || p.tags?.toLowerCase().includes(tag.toLowerCase());
      const inQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.excerpt ?? "").toLowerCase().includes(q) ||
        (p.tags ?? "").toLowerCase().includes(q);
      return inTag && inQuery;
    });
  }, [posts, query, tag]);

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
          marginTop: 30
        }}
      >
        <div className="field" style={{ flex: 1, minWidth: 240, marginBottom: 0 }}>
          <label htmlFor="blog-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Search posts
          </label>
          <input
            id="blog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            style={{ paddingLeft: 38, backgroundImage: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className="btn btn-sm"
              style={{
                borderRadius: 100,
                border: "1px solid",
                borderColor: tag === t ? "var(--accent)" : "var(--border)",
                background: tag === t ? "rgba(0,210,255,0.12)" : "var(--glass)",
                color: tag === t ? "var(--accent)" : "var(--muted)",
                fontWeight: 700
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="work-grid" style={{ marginTop: 36 }}>
        {filtered.map((p, i) => (
          <Reveal key={p.id} delay={i * 50}>
            <Link href={`/blog/${p.slug}`} className="work-card" style={{ display: "flex", height: "100%" }}>
              <div className="thumb">
                {p.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_url} alt={p.title} loading="lazy" />
                ) : null}
                {p.tags && <span className="tag">{p.tags}</span>}
              </div>
              <div className="body">
                <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>{p.title}</h3>
                {p.excerpt && <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>{p.excerpt}</p>}
                <span className="card-link">
                  Read post <i className="fa-solid fa-arrow-right" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "var(--muted)", marginTop: 30 }}>
          No posts match “{query}”{tag !== "All" ? ` in ${tag}` : ""}. Try a different search.
        </p>
      )}
    </>
  );
}

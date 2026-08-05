"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import Reveal from "@/components/Reveal";

function initialsOrImg(p: Project) {
  return p.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.image_url} alt={p.title} loading="lazy" />
  ) : null;
}

export default function ProjectsBrowser({ projects }: { projects: Project[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [projects]);

  const [active, setActive] = useState("All");
  const filtered = active === "All" ? projects : projects.filter((p) => p.category === active);

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "30px 0 40px" }}>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className="btn btn-sm"
            style={{
              borderRadius: 100,
              border: "1px solid",
              borderColor: active === c ? "var(--accent)" : "var(--border)",
              background: active === c ? "rgba(0,210,255,0.12)" : "rgba(255,255,255,0.03)",
              color: active === c ? "var(--accent)" : "var(--muted)",
              fontWeight: 700
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="work-grid">
        {filtered.map((p, i) => (
          <Reveal key={p.id} delay={i * 40}>
            <Link
              className="work-card"
              href={`/projects/${p.slug}`}
              style={{ display: "flex" }}
            >
              <div className="thumb">
                {initialsOrImg(p)}
                {p.category && <span className="tag">{p.category}</span>}
                {p.featured && (
                  <span
                    className="tag"
                    style={{
                      left: "auto",
                      right: 14,
                      background: "rgba(0,210,255,0.9)",
                      borderColor: "transparent",
                      color: "#04060a"
                    }}
                  >
                    Featured
                  </span>
                )}
              </div>
              <div className="body">
                {p.result && <div className="result" style={{ marginBottom: 6 }}>{p.result}</div>}
                <h3 style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.3 }}>{p.title}</h3>
                {p.description && (
                  <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>{p.description}</p>
                )}
                <span className="card-link">
                  View case study <i className="fa-solid fa-arrow-right" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "var(--muted)" }}>No projects in this category yet.</p>
      )}
    </>
  );
}

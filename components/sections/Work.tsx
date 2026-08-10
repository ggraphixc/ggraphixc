"use client";

import Link from "next/link";
import Reveal from "@/components/Reveal";
import { trackEvent } from "@/lib/client-track";
import { fileSlug, fileNameFromUrl, triggerDownload, type WatermarkOptions } from "@/lib/images";
import type { Project } from "@/lib/types";

export default function Work({
  projects,
  watermark
}: {
  projects: Project[];
  watermark?: WatermarkOptions;
}) {
  return (
    <section className="section" id="work">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <span className="kicker">Selected Work</span>
            <h2 className="section-title">Designs built to earn attention, trust &amp; action</h2>
            <p className="section-lead">
              A hand-picked selection of identities, systems, and campaigns — each one built around a real business goal.
            </p>
          </div>
        </Reveal>

        <div className="work-grid" style={{ marginTop: 44 }}>
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={i * 50}>
              <div className="work-card">
                <div className="thumb">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.title} loading="lazy" />
                  ) : null}
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
                  {p.image_url && (
                    <button
                      type="button"
                      className="work-dl"
                      aria-label={`Download ${p.title} image`}
                      title="Download full-resolution image"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const url = p.image_url;
                        if (url) {
                          triggerDownload(url, fileNameFromUrl(url, fileSlug(p.title)), watermark);
                          try {
                            trackEvent("download", { kind: "project", slug: p.slug });
                          } catch {}
                        }
                      }}
                    >
                      <i className="fa-solid fa-download" aria-hidden="true" />
                    </button>
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
                {/* Stretched-link overlay: covers the card for navigation while
                    the download button stays a valid, clickable sibling. */}
                <Link
                  className="work-card-link"
                  href={`/projects/${p.slug}`}
                  aria-label={`View case study: ${p.title}`}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

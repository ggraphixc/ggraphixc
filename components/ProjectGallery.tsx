"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "@/lib/client-track";
import { cloudinaryDownloadUrl, fileNameFromUrl, type WatermarkOptions } from "@/lib/images";
import type { ProjectImage } from "@/lib/types";

export default function ProjectGallery({
  images,
  watermark,
  slug,
  title,
  downloadsAllowed = true
}: {
  images: ProjectImage[];
  watermark?: WatermarkOptions;
  slug?: string;
  title?: string;
  /** When false the download button becomes a “Request access” link. */
  downloadsAllowed?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<number | null>(null);
  const erroredRef = useRef<string | null>(null);
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);

  const openAt = useCallback((i: number) => {
    setHint(false); // a fresh image re-evaluates the hint on load
    openRef.current = i;
    setOpen(i);
  }, []);

  const close = useCallback(() => {
    openRef.current = null;
    setOpen(null);
  }, []);

  const step = useCallback(
    (dir: number) => {
      const i = openRef.current;
      if (i === null || i === undefined) return;
      openAt((i + dir + images.length) % images.length);
    },
    [images.length, openAt]
  );

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // The viewer lives inline in the page — scroll it into view and move focus
  // into it when it opens.
  useEffect(() => {
    if (open === null) return;
    viewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    viewerRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Auto-hide the "scroll to explore" hint shortly after it appears — keyed
  // on hint, so it also works when an image loads slowly.
  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(false), 4000);
    return () => window.clearTimeout(t);
  }, [hint]);

  // Keyboard: Escape closes, arrows switch images.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  if (images.length === 0) return null;

  const current = open === null ? null : images[open];

  return (
    <>
      {open !== null && current && (
        <div className="gallery-viewer" ref={viewerRef} tabIndex={-1}>
          <div className="gv-top">
            <span className="lb-count" aria-hidden="true">
              {open + 1} / {images.length}
            </span>
            <div className="gv-actions">
              {downloadsAllowed ? (
                <a
                  className="gv-dl"
                  href={cloudinaryDownloadUrl(current.image_url, watermark)}
                  download={fileNameFromUrl(current.image_url, `ggraphixc-gallery-${open + 1}`)}
                  aria-label="Download this image"
                  title="Download full-resolution image"
                  onClick={() => {
                    if (slug) {
                      try {
                        trackEvent("download", { kind: "project", slug });
                      } catch {}
                    }
                  }}
                >
                  <i className="fa-solid fa-download" aria-hidden="true" />
                </a>
              ) : (
                <a
                  className="gv-dl gv-request"
                  href={`/contact?about=${encodeURIComponent(
                    title
                      ? `Request access to the full-resolution images of ${title}`
                      : "Request access to project images"
                  )}`}
                  aria-label="Request download access"
                  title="Downloads are restricted — request access"
                >
                  <i className="fa-solid fa-lock" aria-hidden="true" />
                </a>
              )}
              <button className="lb-close" onClick={close} aria-label="Close viewer">
                ✕
              </button>
            </div>
          </div>

          <div className="gv-stage">
            <button
              className="lb-btn lb-prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={current.image_url}
              alt={current.alt_text ?? ""}
              onLoad={(e) => {
                // Hint only when the image is taller than the screen.
                setHint(
                  e.currentTarget.getBoundingClientRect().height > window.innerHeight * 0.92
                );
              }}
              onError={() => {
                const id = current.id;
                if (erroredRef.current === id) {
                  // Already skipped this one after failing others — give up.
                  erroredRef.current = null;
                  close();
                  return;
                }
                erroredRef.current = id;
                if (images.length > 1) step(1);
                else close();
              }}
              onPointerDown={(e) => {
                swipeRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
              }}
              onPointerUp={(e) => {
                // Touch-only horizontal swipe switches images (vertical swipe
                // stays a page scroll — touch-action: pan-y on the img).
                const s = swipeRef.current;
                swipeRef.current = null;
                if (!s || e.pointerType !== "touch") return;
                const dx = e.clientX - s.x;
                const dy = e.clientY - s.y;
                if (
                  Date.now() - s.t < 700 &&
                  Math.abs(dx) > 48 &&
                  Math.abs(dx) > Math.abs(dy) * 1.4
                ) {
                  step(dx < 0 ? 1 : -1);
                }
              }}
            />
            <button
              className="lb-btn lb-next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next image"
            >
              ›
            </button>
          </div>

          <div className="lb-dots">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                className={`lb-dot ${i === open ? "active" : ""}`}
                onClick={() => openAt(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === open ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {hint &&
        createPortal(
          <div className="gv-hint" role="status">
            <i className="fa-solid fa-arrows-up-down" aria-hidden="true" /> Scroll to explore
          </div>,
          document.body
        )}

      <div className="gallery-grid">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className="g-item"
            onClick={() => openAt(i)}
            aria-label={`Open image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt={img.alt_text ?? ""} loading="lazy" />
          </button>
        ))}
      </div>
    </>
  );
}

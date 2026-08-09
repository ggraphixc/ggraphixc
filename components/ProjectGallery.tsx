"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProjectImage } from "@/lib/types";

export default function ProjectGallery({ images }: { images: ProjectImage[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (dir: number) => {
      setOpen((i) => (i === null ? null : (i + dir + images.length) % images.length));
    },
    [images.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="gallery-grid">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            className="g-item"
            onClick={() => setOpen(i)}
            aria-label={`Open image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.image_url} alt={img.alt_text ?? ""} loading="lazy" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div className="lightbox" onClick={close} role="dialog" aria-modal="true" aria-label="Image viewer">
          <button className="lb-close" onClick={close} aria-label="Close viewer">
            ✕
          </button>
          <div className="lb-count" aria-hidden="true">
            {open + 1} / {images.length}
          </div>
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
            src={images[open].image_url}
            alt={images[open].alt_text ?? ""}
            onClick={(e) => e.stopPropagation()}
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
          {/* Filmstrip: one dot per image — click to jump. Scrolls horizontally
              when a gallery has many images so it never overflows the screen. */}
          <div className="lb-dots">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                className={`lb-dot ${i === open ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(i);
                }}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === open ? "true" : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

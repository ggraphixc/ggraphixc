"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { ProjectImage } from "@/lib/types";

const ZOOM_MAX = 4;
const ZOOM_DEFAULT = 2.5;
const ZOOM_STEP = 0.5;

type Offset = { x: number; y: number };

type Gesture = {
  mode: "pan" | "pinch" | "none";
  pointers: Map<number, { x: number; y: number }>;
  startX: number;
  startY: number;
  startOff: Offset;
  startZoom: number;
  startDist: number;
  mid: Offset;
};

export default function ProjectGallery({ images }: { images: ProjectImage[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [zoom, setZoomState] = useState(1);
  const [off, setOffState] = useState<Offset>({ x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);
  const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<number | null>(null);
  const zoomRef = useRef(1);
  const offRef = useRef<Offset>({ x: 0, y: 0 });
  const fitRef = useRef({ w: 0, h: 0 });
  const gestureRef = useRef<Gesture | null>(null);
  const movedRef = useRef(false);
  const lastTapRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const erroredRef = useRef<string | null>(null);

  const clampNum = (v: number, min: number, max: number) =>
    Math.min(max, Math.max(min, v));

  const setZoom = useCallback((z: number) => {
    zoomRef.current = z;
    setZoomState(z);
  }, []);
  const setOff = useCallback((o: Offset) => {
    offRef.current = o;
    setOffState(o);
  }, []);

  /** Clamp the pan offset so the image edges never pull inside the canvas. */
  const clampOff = useCallback((o: Offset, z: number): Offset => {
    const card = cardRef.current;
    if (!card) return o;
    const r = card.getBoundingClientRect();
    const { w, h } = fitRef.current;
    if (!w || !h) return o;
    const maxX = Math.max(0, (w * z - r.width) / 2);
    const maxY = Math.max(0, (h * z - r.height) / 2);
    return { x: clampNum(o.x, -maxX, maxX), y: clampNum(o.y, -maxY, maxY) };
  }, []);

  /** Zoom to newZ keeping the point (ax, ay — relative to the canvas) fixed. */
  const setZoomAnchored = useCallback(
    (newZ: number, ax: number, ay: number) => {
      const card = cardRef.current;
      const z0 = zoomRef.current;
      if (!card) {
        setZoom(newZ);
        return;
      }
      const r = card.getBoundingClientRect();
      const cxp = ax - r.width / 2;
      const cyp = ay - r.height / 2;
      const cx = (cxp - offRef.current.x) / z0;
      const cy = (cyp - offRef.current.y) / z0;
      setOff(clampOff({ x: cxp - cx * newZ, y: cyp - cy * newZ }, newZ));
      setZoom(newZ);
    },
    [clampOff, setOff, setZoom]
  );

  const resetZoom = useCallback(() => {
    const r = cardRef.current?.getBoundingClientRect();
    setZoomAnchored(1, r ? r.width / 2 : 0, r ? r.height / 2 : 0);
  }, [setZoomAnchored]);

  const zoomStep = useCallback(
    (d: number) => {
      const r = cardRef.current?.getBoundingClientRect();
      const z = clampNum(zoomRef.current + d * ZOOM_STEP, 1, ZOOM_MAX);
      setZoomAnchored(z, r ? r.width / 2 : 0, r ? r.height / 2 : 0);
    },
    [setZoomAnchored]
  );

  /** Fit the image into the viewing canvas (contain, never upscale) and size
      the container to match it — the lightbox inherits the image's size. */
  const measure = useCallback(() => {
    const img = imgRef.current;
    const lb = lightboxRef.current;
    if (!img || !lb) return;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    if (!natW || !natH) return;
    const cs = window.getComputedStyle(lb);
    const cw =
      lb.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    const ch =
      lb.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
    if (cw <= 0 || ch <= 0) return;
    const scale = Math.min(cw / natW, ch / natH, 1);
    const w = Math.max(1, Math.floor(natW * scale));
    const h = Math.max(1, Math.floor(natH * scale));
    fitRef.current = { w, h };
    setCardSize({ w, h });
    setOff(clampOff(offRef.current, zoomRef.current));
  }, [clampOff, setOff]);

  const openAt = useCallback(
    (i: number) => {
      setZoom(1);
      setOff({ x: 0, y: 0 });
      // Keep the previous card size until the new image is measured — the
      // image letterboxes briefly (object-fit contain), then the card morphs
      // smoothly to the new fit instead of popping to fullscreen.
      movedRef.current = false;
      lastTapRef.current = null;
      openRef.current = i;
      setOpen(i);
    },
    [setZoom, setOff]
  );

  const close = useCallback(() => {
    if (movedRef.current) {
      // The pointer was dragging/pinching — swallow the click that follows.
      movedRef.current = false;
      return;
    }
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

  // Keep openRef in sync (openAt/close already reset zoom/pan + openRef).
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // Keyboard navigation + body scroll lock while the viewer is open.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Escape always closes, even right after a drag (movedRef may be set).
        movedRef.current = false;
        close();
      }
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

  // Re-measure on resize so pan bounds stay correct.
  useEffect(() => {
    if (open === null) return;
    const onResize = () => {
      measure();
      setOff(clampOff(offRef.current, zoomRef.current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, measure, clampOff, setOff]);

  // Desktop mouse-wheel zoom (non-passive so the page can't scroll behind it).
  // Attached to the whole lightbox so wheel works over the black area too;
  // the anchor is mapped into the image card's coordinate space.
  useEffect(() => {
    const el = lightboxRef.current;
    if (!el || open === null) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cr = cardRef.current?.getBoundingClientRect();
      const z = clampNum(zoomRef.current * Math.exp(-e.deltaY * 0.0015), 1, ZOOM_MAX);
      if (Math.abs(z - zoomRef.current) < 0.001) return;
      setZoomAnchored(z, cr ? e.clientX - cr.left : 0, cr ? e.clientY - cr.top : 0);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, setZoomAnchored]);

  // --- Pointer gestures: single-finger pan (when zoomed), two-finger pinch ---
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current ?? {
      mode: "none" as const,
      pointers: new Map<number, { x: number; y: number }>(),
      startX: 0,
      startY: 0,
      startOff: { x: 0, y: 0 },
      startZoom: 1,
      startDist: 1,
      mid: { x: 0, y: 0 }
    };
    g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (g.pointers.size === 1) {
      g.mode = "pan";
      g.startX = e.clientX;
      g.startY = e.clientY;
      g.startOff = { ...offRef.current };
      g.startZoom = zoomRef.current;
      movedRef.current = false;
      // Only a pan-capable gesture needs the transition disabled.
      if (zoomRef.current > 1.001) setGesturing(true);
    } else if (g.pointers.size === 2) {
      setGesturing(true);
      const pts = [...g.pointers.values()];
      const r = cardRef.current?.getBoundingClientRect();
      g.mode = "pinch";
      g.startDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      g.startZoom = zoomRef.current;
      g.startOff = { ...offRef.current };
      g.mid = r
        ? {
            x: (pts[0].x + pts[1].x) / 2 - r.left,
            y: (pts[0].y + pts[1].y) / 2 - r.top
          }
        : { x: 0, y: 0 };
      movedRef.current = true;
    }
    gestureRef.current = g;
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g || !g.pointers.has(e.pointerId)) return;
      g.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (g.mode === "pan" && g.pointers.size === 1) {
        const dx = e.clientX - g.startX;
        const dy = e.clientY - g.startY;
        if (Math.hypot(dx, dy) > 6) movedRef.current = true;
        if (g.startZoom > 1.001) {
          setOff(clampOff({ x: g.startOff.x + dx, y: g.startOff.y + dy }, g.startZoom));
        }
      } else if (g.mode === "pinch" && g.pointers.size >= 2) {
        const pts = [...g.pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || g.startDist;
        const z = clampNum(g.startZoom * (dist / g.startDist), 1, ZOOM_MAX);
        const { x: mx, y: my } = g.mid;
        const cx = (mx - g.startOff.x) / g.startZoom;
        const cy = (my - g.startOff.y) / g.startZoom;
        setOff(clampOff({ x: mx - cx * z, y: my - cy * z }, z));
        setZoom(z);
        movedRef.current = true;
      }
    },
    [clampOff, setOff, setZoom]
  );

  const endPointer = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gestureRef.current;
      if (!g) return;
      g.pointers.delete(e.pointerId);
      if (g.pointers.size === 0) {
        setGesturing(false);
        // Touch double-tap toggles zoom (mouse uses onDoubleClick).
        if (e.pointerType === "touch" && e.target === imgRef.current) {
          const now = Date.now();
          const last = lastTapRef.current;
          if (
            !movedRef.current &&
            last &&
            now - last.t < 300 &&
            Math.hypot(e.clientX - last.x, e.clientY - last.y) < 24
          ) {
            const r = cardRef.current?.getBoundingClientRect();
            const z = zoomRef.current > 1.01 ? 1 : ZOOM_DEFAULT;
            setZoomAnchored(z, r ? e.clientX - r.left : 0, r ? e.clientY - r.top : 0);
            lastTapRef.current = null;
            movedRef.current = true;
            gestureRef.current = null;
            return;
          }
          lastTapRef.current = { x: e.clientX, y: e.clientY, t: now };
        } else {
          lastTapRef.current = null;
        }
        gestureRef.current = null;
      } else if (g.pointers.size === 1) {
        // One finger lifted — resume panning with the remaining pointer.
        const pts = [...g.pointers.values()];
        g.mode = "pan";
        g.startX = pts[0].x;
        g.startY = pts[0].y;
        g.startOff = { ...offRef.current };
        g.startZoom = zoomRef.current;
        movedRef.current = true;
      }
    },
    [setZoomAnchored]
  );

  if (images.length === 0) return null;

  return (
    <>
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

      {open !== null && (
        <div
          className="lightbox"
          ref={lightboxRef}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div
            className="lb-card"
            ref={cardRef}
            data-zoomed={zoom > 1 ? "true" : "false"}
            data-gesturing={gesturing ? "true" : "false"}
            style={cardSize ? { width: cardSize.w, height: cardSize.h } : undefined}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
          >
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
              key={images[open].id}
              ref={imgRef}
              src={images[open].image_url}
              alt={images[open].alt_text ?? ""}
              draggable={false}
              onLoad={measure}
              onError={() => {
                const id = images[open].id;
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
              onDoubleClick={(e) => {
                e.stopPropagation();
                const r = cardRef.current?.getBoundingClientRect();
                const z = zoomRef.current > 1.01 ? 1 : ZOOM_DEFAULT;
                setZoomAnchored(z, r ? e.clientX - r.left : 0, r ? e.clientY - r.top : 0);
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${zoom})` }}
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
            {/* Zoom controls: − / % (tap % to reset) / + */}
            <div
              className="lb-zoom"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => zoomStep(-1)}
                disabled={zoom <= 1.01}
                aria-label="Zoom out"
              >
                −
              </button>
              <button
                type="button"
                className="lb-zoom-pct"
                onClick={resetZoom}
                disabled={zoom <= 1.01}
                aria-label="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => zoomStep(1)}
                disabled={zoom >= ZOOM_MAX}
                aria-label="Zoom in"
              >
                +
              </button>
            </div>
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
                    openAt(i);
                  }}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === open ? "true" : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

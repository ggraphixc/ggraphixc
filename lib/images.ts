// Cloudinary URL helpers shared across the site. Cloudinary can force a
// download with the fl_attachment flag; for any other host we fall back to
// the plain URL (browsers open it, users save with right-click / long-press).

function isCloudinary(url: string): boolean {
  return url.includes("res.cloudinary.com") && url.includes("/image/upload/");
}

export type WatermarkOptions = {
  /** Brand text stamped on the image; empty/whitespace disables the overlay. */
  text?: string;
  /** Font size in px (default 24). */
  size?: number;
  /** Opacity 0–100 (default 45). */
  opacity?: number;
  /** center | top-left | top-right | bottom-left | bottom-right (default center). */
  position?: string;
};

/**
 * Resolve whether downloads are allowed for a project (or the site default):
 * a per-project override wins; otherwise the global allow_downloads setting
 * (anything except "no" means allowed).
 */
export function downloadsAllowed(
  project: { allow_downloads?: boolean | null } | null | undefined,
  settings: Record<string, string>
): boolean {
  if (project?.allow_downloads === true) return true;
  if (project?.allow_downloads === false) return false;
  return (settings.allow_downloads ?? "").toLowerCase() !== "no";
}

// Build watermark options from the site_settings record (all string values).
// Dependency-free so client components and route handlers share one rule.
export function watermarkFromSettings(settings: Record<string, string>): WatermarkOptions {
  return {
    text: settings.download_watermark || "",
    size: Number(settings.download_watermark_size) || 24,
    opacity: Number(settings.download_watermark_opacity) || 45,
    position: settings.download_watermark_position || "center"
  };
}

const POSITION_GRAVITY: Record<string, string> = {
  "top-left": "g_north_west",
  "top-right": "g_north_east",
  "bottom-left": "g_south_west",
  "bottom-right": "g_south_east"
};

// Appends the brand-text watermark (configurable size/opacity/position) and
// optionally caps the delivery width. No-op for non-Cloudinary hosts or when
// no text is configured.
export function cloudinaryWatermarkUrl(
  url: string,
  watermark?: string | WatermarkOptions,
  maxWidth?: number
): string {
  if (!isCloudinary(url)) return url;
  const o: WatermarkOptions = typeof watermark === "string" ? { text: watermark } : watermark ?? {};
  const transforms: string[] = [];
  if (maxWidth && maxWidth > 0) transforms.push(`w_${maxWidth}`);
  if (o.text?.trim()) {
    const size = o.size && o.size > 0 ? Math.round(o.size) : 24;
    const opacity = Number.isFinite(o.opacity)
      ? Math.min(100, Math.max(0, Math.round(o.opacity as number)))
      : 45;
    transforms.push(`l_text:Arial_${size}:${encodeURIComponent(o.text.trim())}`);
    transforms.push(`o_${opacity}`);
    transforms.push("co_rgb:ffffff");
    const gravity = POSITION_GRAVITY[o.position ?? "center"];
    if (gravity) transforms.push(gravity, "x_16", "y_16");
  }
  if (transforms.length === 0) return url;
  return url.replace("/image/upload/", `/image/upload/${transforms.join(",")}/`);
}

export function cloudinaryDownloadUrl(
  url: string,
  watermark?: string | WatermarkOptions
): string {
  if (!isCloudinary(url)) return url;
  const wm = cloudinaryWatermarkUrl(url, watermark);
  return wm.replace("/image/upload/", "/image/upload/fl_attachment/");
}

// Turn free text (a title, an alt) into a safe file stem.
export function fileSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "ggraphixc-download";
}

// Best-effort file name for a URL: keeps the source file name + extension
// when present, otherwise falls back to a clean stem with .jpg.
export function fileNameFromUrl(url: string, fallback: string): string {
  try {
    const clean = url.split("?")[0];
    const seg = clean.split("/").pop();
    if (seg && /\.(png|jpe?g|webp|gif|svg|avif|pdf|mp4|webm)$/i.test(seg)) return seg;
  } catch {
    /* ignore */
  }
  return `${fallback}.jpg`;
}

// Slugify only the stem of a file name, keeping its extension (for zip
// contents and download attributes).
export function slugFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return fileSlug(name);
  return `${fileSlug(name.slice(0, dot))}${name.slice(dot).toLowerCase()}`;
}

// Client-side download trigger — used where the download control can't be a
// real anchor (e.g. a button nested inside a link card).
export function triggerDownload(
  url: string,
  filename: string,
  watermark?: string | WatermarkOptions
): void {
  const a = document.createElement("a");
  a.href = cloudinaryDownloadUrl(url, watermark);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

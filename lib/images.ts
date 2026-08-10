// Cloudinary URL helpers shared across the site. Cloudinary can force a
// download with the fl_attachment flag; for any other host we fall back to
// the plain URL (browsers open it, users save with right-click / long-press).

function isCloudinary(url: string): boolean {
  return url.includes("res.cloudinary.com") && url.includes("/image/upload/");
}

// Appends a subtle brand-text overlay (the downloadable-image watermark) and
// optionally caps the delivery width. No-op for non-Cloudinary hosts or when
// nothing is requested.
export function cloudinaryWatermarkUrl(
  url: string,
  watermark?: string,
  maxWidth?: number
): string {
  if (!isCloudinary(url)) return url;
  const parts: string[] = [];
  if (maxWidth && maxWidth > 0) parts.push(`w_${maxWidth}`);
  if (watermark?.trim()) {
    const text = encodeURIComponent(watermark.trim());
    parts.push(`l_text:Arial_24:${text},o_45,co_rgb:ffffff`);
  }
  if (parts.length === 0) return url;
  return url.replace("/image/upload/", `/image/upload/${parts.join(",")}/`);
}

export function cloudinaryDownloadUrl(url: string, watermark?: string): string {
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
export function triggerDownload(url: string, filename: string, watermark?: string): void {
  const a = document.createElement("a");
  a.href = cloudinaryDownloadUrl(url, watermark);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

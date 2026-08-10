// Cloudinary URL helpers shared across the site. Cloudinary can force a
// download with the fl_attachment flag; for any other host we fall back to
// the plain URL (browsers open it, users save with right-click / long-press).

export function cloudinaryDownloadUrl(url: string): string {
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    return url.replace("/image/upload/", "/image/upload/fl_attachment/");
  }
  return url;
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

// Client-side download trigger — used where the download control can't be a
// real anchor (e.g. a button nested inside a link card).
export function triggerDownload(url: string, filename: string): void {
  const a = document.createElement("a");
  a.href = cloudinaryDownloadUrl(url);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

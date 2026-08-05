/**
 * Client-side image compressor — runs in the admin upload flow so photos
 * never hit Supabase Storage at full camera size.
 *
 * Target band: 50–250 KB.
 *   - Files already ≤ 50 KB are returned untouched (no point compressing).
 *   - Files already ≤ 250 KB at ≤ maxWidth (longest edge) are returned
 *     untouched (no quality loss).
 *   - Otherwise: decode via `createImageBitmap` (off-main-thread), scale so the
 *     LONGEST edge fits maxWidth, then iterate — shrink the width in steps and
 *     binary-search the encode quality at each width — until the output lands at
 *     or under 250 KB.
 *   - Never returns a file larger than the original.
 */
export type CompressOptions = {
  maxWidth?: number; // cap on the longest edge, default 1920
  minSizeKB?: number; // files at or below this size are skipped, default 50
  maxSizeKB?: number; // target ceiling, default 250
};

const MIN_QUALITY = 0.35;
const MAX_QUALITY = 0.9;

const WEBP_SUPPORTED =
  typeof document !== "undefined" &&
  document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");

function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return createImageBitmap(file);
    } catch {
      // fall through to <img> decoding
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}

function closeSource(source: ImageBitmap | HTMLImageElement) {
  if ("close" in source && typeof source.close === "function") source.close();
}

export async function compressImage(
  file: File,
  { maxWidth = 1920, minSizeKB = 50, maxSizeKB = 250 }: CompressOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  // Already under the floor — return as-is.
  if (file.size <= minSizeKB * 1024) return file;

  const source = await decodeImage(file).catch(() => null);
  if (!source) return file;

  // Already web-friendly: small AND not oversized. Keep original quality.
  if (file.size <= maxSizeKB * 1024 && Math.max(source.width, source.height) <= maxWidth) {
    closeSource(source);
    return file;
  }

  const maxBytes = maxSizeKB * 1024;
  const type = WEBP_SUPPORTED ? "image/webp" : "image/jpeg";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // A missing 2D context means we cannot draw — never ship a blank image.
  if (!ctx) {
    closeSource(source);
    return file;
  }

  // Scale so the longest edge fits maxWidth, preserving aspect ratio.
  const scale = Math.min(1, maxWidth / Math.max(source.width, source.height));
  const startWidth = Math.max(1, Math.round(source.width * scale));
  const startHeight = Math.max(1, Math.round(source.height * scale));

  const drawAt = (w: number, h: number) => {
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  };

  const encode = (quality: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), type, quality));

  // Binary-search the highest quality that fits the budget at the canvas's
  // current size; also remember the smallest blob produced so far.
  const bestQuality = async (): Promise<{ accepted: Blob | null; smallest: Blob | null }> => {
    let lo = MIN_QUALITY;
    let hi = MAX_QUALITY;
    let accepted: Blob | null = null;
    let smallest: Blob | null = null;
    for (let i = 0; i < 6; i++) {
      const mid = (lo + hi) / 2;
      const blob = await encode(mid);
      if (!blob) break;
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= maxBytes) {
        accepted = blob;
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return { accepted, smallest };
  };

  // Shrink the width in steps until the budget is met (never below the clamp).
  const minWidth = Math.min(startWidth, Math.max(480, Math.round(startWidth * 0.5)));
  let accepted: Blob | null = null;
  let smallest: Blob | null = null;
  let width = startWidth;

  while (width >= minWidth && !accepted) {
    const h = Math.max(1, Math.round(startHeight * (width / startWidth)));
    drawAt(width, h);
    const result = await bestQuality();
    if (result.accepted) accepted = result.accepted;
    if (result.smallest && (!smallest || result.smallest.size < smallest.size)) {
      smallest = result.smallest;
    }
    if (!accepted) width = Math.round(width * 0.8);
  }

  // Best effort if the budget was never met: ship the most compressed blob.
  const finalBlob = accepted ?? smallest;

  closeSource(source);

  // Never ship something bigger than what the user uploaded.
  if (!finalBlob || finalBlob.size >= file.size) return file;

  const ext = type === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
  return new File([finalBlob], name, { type });
}

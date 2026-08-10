import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { getSettings } from "@/lib/data";
import { cloudinaryWatermarkUrl, fileNameFromUrl, slugFileName } from "@/lib/images";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
// Several images have to be fetched + zipped — allow a generous budget.
export const maxDuration = 60;

// Per-IP in-memory rate limit: 10 zips / minute. The route fetches and zips
// full galleries server-side, so it must be bounded like the /api/track sink.
const buckets = new Map<string, number[]>();

function rateLimit(ip: string, perMinute = 10): boolean {
  if (buckets.size > 1000) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= perMinute) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  return true;
}

// Run `fn` over items with at most `limit` in flight (flattens memory spikes
// when fetching many large images at once).
async function mapLimit<T>(
  items: T[],
  limit: number,
  fn: (item: T, i: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await fn(items[i], i);
    }
  });
  await Promise.all(workers);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down — try again in a minute" }, { status: 429 });
  }

  const { slug } = await params;

  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    sb = null;
  }
  if (!sb) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  const { data: project } = await sb
    .from("projects")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: images } = await sb
    .from("project_images")
    .select("image_url")
    .eq("project_id", project.id)
    .order("display_order", { ascending: true });
  const urls = (images ?? [])
    .map((r) => (r as { image_url: string }).image_url)
    .filter((u): u is string => Boolean(u));
  if (urls.length === 0) {
    return NextResponse.json({ error: "This project has no gallery images" }, { status: 404 });
  }

  const settings = await getSettings();
  const watermark = settings.download_watermark;

  const zip = new AdmZip();
  let ok = 0;
  // Watermark the zipped copies (same protection as single downloads) and cap
  // the width so the zip stays a reasonable size. fl_attachment is NOT applied
  // — we fetch bytes, we don't redirect a browser.
  await mapLimit(urls, 3, async (url, i) => {
    try {
      const target = cloudinaryWatermarkUrl(url, watermark, 2000);
      const res = await fetch(target, { signal: AbortSignal.timeout(45_000) });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const name = slugFileName(fileNameFromUrl(url, `image-${i + 1}`));
      zip.addFile(`${String(i + 1).padStart(2, "0")}-${name}`, buf);
      ok++;
    } catch {
      // Skip a single failed image — the rest of the gallery still downloads.
    }
  });
  if (ok === 0) {
    return NextResponse.json({ error: "Could not fetch the gallery images" }, { status: 502 });
  }

  const body = zip.toBuffer();
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${project.slug}.zip"`
    }
  });
}

import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/analytics";
import { getSettings } from "@/lib/data";
import { verifyDownloadToken } from "@/lib/download-tokens";
import { streamImageDownload } from "@/lib/image-download";
import {
  downloadsAllowed,
  fileNameFromUrl,
  fileSlug,
  slugFileName,
  watermarkFromSettings
} from "@/lib/images";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Per-IP in-memory rate limit: 30 file streams / minute (bounds bandwidth
// abuse on this public endpoint).
const buckets = new Map<string, number[]>();

function rateLimit(ip: string, perMinute = 30): boolean {
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

type ProjectRow = {
  id: string;
  slug: string;
  image_url: string | null;
  allow_downloads?: boolean | null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down — try again in a minute" }, { status: 429 });
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("image");
  const isCover = searchParams.get("cover") === "1";
  const token = searchParams.get("t") ?? "";

  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    sb = null;
  }
  if (!sb) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });

  // Graceful when the allow_downloads migration hasn't run yet.
  let project: ProjectRow | null = null;
  const first = await sb
    .from("projects")
    .select("id, slug, image_url, allow_downloads")
    .eq("slug", slug)
    .maybeSingle();
  if (first.error) {
    const retry = await sb
      .from("projects")
      .select("id, slug, image_url")
      .eq("slug", slug)
      .maybeSingle();
    if (!retry.error && retry.data) project = retry.data as ProjectRow;
  } else if (first.data) {
    project = first.data as ProjectRow;
  }
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const settings = await getSettings();
  const approved = token && verifyDownloadToken(token, project.slug);
  const allowed = downloadsAllowed(project, settings) || Boolean(approved);
  if (!allowed) {
    return NextResponse.json({ error: "Downloads are restricted for this project." }, { status: 403 });
  }

  // Identify the file to serve: a specific gallery image or the cover.
  let url: string | null = null;
  if (isCover) {
    url = project.image_url;
  } else if (imageId) {
    const { data: img } = await sb
      .from("project_images")
      .select("image_url")
      .eq("id", imageId)
      .eq("project_id", project.id)
      .maybeSingle();
    url = (img as { image_url?: string } | null)?.image_url ?? null;
  }
  if (!url) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const filename = isCover
    ? `${fileSlug(project.slug || "project")}-cover.jpg`
    : slugFileName(fileNameFromUrl(url, imageId ? `image-${imageId}` : "image"));

  // Server-side analytics — the single source of truth for project downloads
  // (the UI never ships a direct fl_attachment Cloudinary URL anymore).
  try {
    await recordEvent("download", { kind: "project", slug: project.slug });
  } catch {}

  return streamImageDownload(url, filename, watermarkFromSettings(settings));
}

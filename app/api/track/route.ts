import { NextResponse } from "next/server";
import { recordEvent, TRACKED_EVENTS } from "@/lib/analytics";

// Light per-IP in-memory rate limit: 30 events / minute. Enough for real
// traffic; bounds abuse (worst case is inflated counters, nothing sensitive).
const buckets = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  if (buckets.size > 2000) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= 30) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down" }, { status: 429 });
  }

  // Guard the public write endpoint: cap the payload and keep only primitive
  // values so nobody can stuff multi-megabyte blobs into jsonb.
  const raw = await request.text();
  if (raw.length > 8_000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: { name?: unknown; data?: Record<string, unknown> };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name : "";
  if (!TRACKED_EVENTS.includes(name as (typeof TRACKED_EVENTS)[number])) {
    return NextResponse.json({ error: "Unknown event" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    for (const [k, v] of Object.entries(body.data)) {
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
        data[k] = v;
      }
    }
  }
  const ok = await recordEvent(name, data);
  return ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: "Storage failed" }, { status: 500 });
}

// Server-only spam protection for the public write forms (contact + newsletter).
// Three layers, all cheap and dependency-free — no captcha service, no visitor
// friction:
//   1. Honeypot: a hidden field (e.g. "website") that humans never fill. Bots
//      that auto-fill every input get caught. We return a *silent success* so
//      the bot learns nothing, while nothing is stored or emailed.
//   2. Time trap: the form must have been rendered for >= MIN_FORM_MS before
//      submit. The client stamps a hidden `rendered_at` field with Date.now()
//      at first render; bots that skip JS never set it and are rejected.
//   3. Per-IP in-memory rate limit: the same pattern as /api/track and the
//      concierge route. Not a hard security boundary on serverless (each
//      instance has its own buckets) but it stops casual flooding.

const MIN_FORM_MS = 2500;

/** Hidden honeypot: any non-empty value means a bot auto-filled the form. */
export function isHoneypotFilled(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Time trap: true when the hidden `rendered_at` stamp is missing/invalid
 * (no JS) or the form was submitted before MIN_FORM_MS elapsed.
 */
export function isTooFast(renderedAt: FormDataEntryValue | null): boolean {
  const n = Number(renderedAt);
  if (!Number.isFinite(n) || n <= 0) return true;
  return Date.now() - n < MIN_FORM_MS;
}

const buckets = new Map<string, number[]>();

export function rateLimit(ip: string, max = 5, windowMs = 60_000): boolean {
  if (buckets.size > 5000) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  const now = Date.now();
  const recent = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  return true;
}

/**
 * Best-effort client IP for rate limiting. Server actions can't read the
 * Request, so we use the next/headers x-forwarded-for (set by the host). Falls
 * back to "unknown" locally, which still rate-limits as one bucket.
 */
export async function clientIp(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const hdrs = await headers();
    return hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  } catch {
    return "unknown";
  }
}

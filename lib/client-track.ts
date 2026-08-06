import { track } from "@vercel/analytics";

/**
 * Client-side analytics for the concierge funnel. Two sinks, both fire-and-forget:
 *
 * 1. SELF-HOSTED (primary) — POSTs to /api/track, which stores the event in the
 *    Supabase analytics_events table. Works on every Vercel plan.
 * 2. VERCEL (bonus) — the @vercel/analytics track() call. Custom events only
 *    surface in the Vercel dashboard on a Pro plan; harmless otherwise.
 */
export function trackEvent(
  name: string,
  data?: Record<string, string | number | boolean | null>
) {
  // Vercel bonus path (no-op in dev, and on Hobby it just isn't retained).
  try {
    track(name, data);
  } catch {}

  // Self-hosted primary path.
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, data: data ?? {} }),
      keepalive: true
    }).catch(() => {});
  } catch {}
}

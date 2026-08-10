// Server-only: self-hosted analytics backed by the analytics_events table.
// This is the PRIMARY source for the admin Concierge activity panel — it works
// on any Vercel plan (Vercel's custom-events API is the optional bonus path).

import { getServiceSupabase } from "@/lib/supabase/server";

// Shared analytics types live HERE (the primary source) so the optional Vercel
// fallback module imports from this one — never the other way around.
export type EventCount = { count: number; visitors: number };

export type ConciergeStats = {
  configured: boolean;
  error?: string;
  source?: "local" | "vercel";
  /** Optional setup guidance rendered in place of the default hint. */
  hint?: string;
  period: { since: string; until: string };
  events: Record<string, EventCount>;
  contactAfterChat: EventCount;
  contactNoChat: EventCount;
};

/** Whitelist of events the public /api/track endpoint will accept. */
export const TRACKED_EVENTS = [
  "concierge_opened",
  "concierge_message",
  "concierge_card_click",
  "contact_submit",
  "download",
  "page_view"
] as const;

export type TrackableEvent = (typeof TRACKED_EVENTS)[number];

export async function recordEvent(name: string, data: Record<string, unknown> = {}): Promise<boolean> {
  if (!TRACKED_EVENTS.includes(name as TrackableEvent)) return false;
  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return false;
  }
  const { error } = await sb.from("analytics_events").insert({
    event_name: name,
    event_data: data
  });
  return !error;
}

type Row = { event_name: string; event_data: { afterChat?: boolean } | null };

/**
 * Aggregate the last `days` of events into the same shape the admin panel
 * renders. `available` is false only when the analytics_events table doesn't
 * exist yet (migration not run) — the caller then falls back to Vercel.
 */
export type PageView = { kind: "project" | "post"; slug: string; count: number };

/**
 * Most-viewed projects + blog posts over the last `days`, aggregated from the
 * page_view events (data: { kind, slug }). Ties to the tables' titles happen
 * in the caller (it can join names from projects/blog_posts).
 */
export async function getPopularContent(days = 30): Promise<PageView[]> {
  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return [];
  }
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("analytics_events")
    .select("event_data")
    .eq("event_name", "page_view")
    .gte("created_at", since)
    .limit(5000);
  if (error || !data) return [];
  const counts = new Map<string, PageView>();
  for (const row of data as { event_data: { kind?: string; slug?: string } | null }[]) {
    const kind = row.event_data?.kind;
    const slug = row.event_data?.slug;
    if ((kind !== "project" && kind !== "post") || !slug) continue;
    const key = `${kind}:${slug}`;
    const cur = counts.get(key) ?? { kind, slug, count: 0 };
    cur.count++;
    counts.set(key, cur);
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export type DownloadCount = { kind: "project" | "post"; slug: string; count: number };

/**
 * Most-downloaded projects + blog posts over the last `days`, aggregated from
 * the "download" events (data: { kind, slug }). Title resolution happens in
 * the caller, mirroring getPopularContent.
 */
export async function getDownloadStats(days = 30): Promise<DownloadCount[]> {
  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return [];
  }
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await sb
    .from("analytics_events")
    .select("event_data")
    .eq("event_name", "download")
    .gte("created_at", since)
    .limit(5000);
  if (error || !data) return [];
  const counts = new Map<string, DownloadCount>();
  for (const row of data as { event_data: { kind?: string; slug?: string } | null }[]) {
    const kind = row.event_data?.kind;
    const slug = row.event_data?.slug;
    if ((kind !== "project" && kind !== "post") || !slug) continue;
    const key = `${kind}:${slug}`;
    const cur = counts.get(key) ?? { kind, slug, count: 0 };
    cur.count++;
    counts.set(key, cur);
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export async function getSelfHostedStats(days: 7 | 30 = 30): Promise<
  ConciergeStats & { available: boolean }
> {
  const until = new Date();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceS = since.toISOString().slice(0, 10);
  const untilS = until.toISOString().slice(0, 10);
  const empty: EventCount = { count: 0, visitors: 0 };

  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return { available: false, configured: false, period: { since: sinceS, until: untilS }, events: {}, contactAfterChat: empty, contactNoChat: empty };
  }

  const { data, error } = await sb
    .from("analytics_events")
    .select("event_name, event_data")
    .gte("created_at", since.toISOString());

  if (error) {
    // Table missing (migration not run) — tell the caller to fall back.
    // PostgREST reports missing tables as "Could not find the table ...",
    // while raw Postgres errors say "relation ... does not exist".
    const missing = /could not find the table|does not exist/i.test(error.message);
    if (missing) {
      return { available: false, configured: false, period: { since: sinceS, until: untilS }, events: {}, contactAfterChat: empty, contactNoChat: empty };
    }
    return {
      available: true,
      configured: true,
      source: "local",
      error: `Analytics read failed: ${error.message}`,
      period: { since: sinceS, until: untilS },
      events: {},
      contactAfterChat: empty,
      contactNoChat: empty
    };
  }

  const rows = (data ?? []) as Row[];
  const events: Record<string, EventCount> = {};

  let contactAfterChat = empty;
  let contactNoChat = empty;
  for (const row of rows) {
    const name = row.event_name;
    // Privacy-first: we don't store IPs, so "visitors" mirrors occurrences
    // (each event = one action). True unique visitors come from Vercel when
    // the Pro-tier bonus path is available.
    events[name] = {
      count: (events[name]?.count ?? 0) + 1,
      visitors: (events[name]?.visitors ?? 0) + 1
    };
    if (name === "contact_submit") {
      if (row.event_data?.afterChat === true) {
        contactAfterChat = { count: contactAfterChat.count + 1, visitors: contactAfterChat.visitors + 1 };
      } else {
        contactNoChat = { count: contactNoChat.count + 1, visitors: contactNoChat.visitors + 1 };
      }
    }
  }

  return {
    available: true,
    configured: true,
    source: "local",
    period: { since: sinceS, until: untilS },
    events,
    contactAfterChat,
    contactNoChat
  };
}

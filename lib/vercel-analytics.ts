// Server-only: reads Vercel Web Analytics custom events (the concierge + contact
// funnel events fired by @vercel/analytics track()). Requires a Vercel access
// token in VERCEL_ANALYTICS_TOKEN. On Vercel, VERCEL_PROJECT_ID and
// VERCEL_TEAM_ID / VERCEL_ORG_ID are injected automatically at runtime; locally
// or without a token the helper reports `configured: false` so the admin can
// show a setup hint instead of crashing.
//
// Docs: https://vercel.com/docs/analytics/web-analytics-api

const AGGREGATE_URL = "https://api.vercel.com/v1/query/web-analytics/events/aggregate";

export type EventCount = { count: number; visitors: number };

export type ConciergeStats = {
  configured: boolean;
  error?: string;
  period: { since: string; until: string };
  events: Record<string, EventCount>;
  contactAfterChat: EventCount;
  contactNoChat: EventCount;
};

type AggregateRow = {
  eventName?: string;
  eventData?: string;
  count?: number;
  visitors?: number;
};

async function aggregate(params: Record<string, string>): Promise<{ data?: AggregateRow[] } | null> {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  const query = new URLSearchParams({ projectId, limit: "100", ...params });
  const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID;
  if (teamId) query.set("teamId", teamId);
  const res = await fetch(`${AGGREGATE_URL}?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });
  if (!res.ok) {
    // Pull Vercel's own explanation out of the body when present.
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message || body?.message || "";
    } catch {}
    const hints: Record<number, string> = {
      401: "unauthorized — check the VERCEL_ANALYTICS_TOKEN",
      402: "payment/plan required — Vercel custom events need Web Analytics on a Pro plan (Hobby doesn't include them), or the account has a billing/usage block",
      403: "forbidden — the token lacks analytics access",
      404: "project not found — check the project/team IDs"
    };
    const hint = hints[res.status] ? ` — ${hints[res.status]}` : "";
    throw new Error(`Vercel Analytics API ${res.status}${detail ? `: ${detail}` : ""}${hint}`);
  }
  return res.json();
}

// Short in-memory cache so a force-dynamic dashboard doesn't hammer the Vercel
// API on every visit (mirrors the concierge knowledge-cache pattern). Keyed by
// the requested range so toggling 7/30 days always re-queries correctly.
let statsCache: { at: number; days: number; stats: ConciergeStats } | null = null;
const TTL_MS = 60_000;

export async function getConciergeStats(days: 7 | 30 = 30): Promise<ConciergeStats> {
  const until = new Date();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceS = since.toISOString().slice(0, 10);
  const untilS = until.toISOString().slice(0, 10);
  const empty: EventCount = { count: 0, visitors: 0 };

  if (statsCache && Date.now() - statsCache.at < TTL_MS && statsCache.days === days) {
    return statsCache.stats;
  }

  if (!process.env.VERCEL_ANALYTICS_TOKEN || !process.env.VERCEL_PROJECT_ID) {
    return {
      configured: false,
      period: { since: sinceS, until: untilS },
      events: {},
      contactAfterChat: empty,
      contactNoChat: empty
    };
  }

  try {
    const [byName, afterChat] = await Promise.all([
      aggregate({ by: "eventName", since: sinceS, until: untilS }),
      aggregate({
        by: "eventData/afterChat",
        since: sinceS,
        until: untilS,
        filter: "eventName eq 'contact_submit'"
      })
    ]);

    const events: Record<string, EventCount> = {};
    for (const row of byName?.data ?? []) {
      // Defensive: name groupings may come back as eventName or eventData.
      const name = row.eventName ?? row.eventData;
      if (!name) continue;
      events[name] = {
        count: row.count ?? 0,
        visitors: row.visitors ?? 0
      };
    }

    let contactAfterChat = empty;
    let contactNoChat = empty;
    for (const row of afterChat?.data ?? []) {
      if (row.eventData === "true") {
        contactAfterChat = { count: row.count ?? 0, visitors: row.visitors ?? 0 };
      } else if (row.eventData === "false") {
        contactNoChat = { count: row.count ?? 0, visitors: row.visitors ?? 0 };
      }
    }

    const stats: ConciergeStats = {
      configured: true,
      period: { since: sinceS, until: untilS },
      events,
      contactAfterChat,
      contactNoChat
    };
    statsCache = { at: Date.now(), days, stats };
    return stats;
  } catch (err) {
    return {
      configured: true,
      error: err instanceof Error ? err.message : "Failed to fetch analytics",
      period: { since: sinceS, until: untilS },
      events: {},
      contactAfterChat: empty,
      contactNoChat: empty
    };
  }
}

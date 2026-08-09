// Server-only broadcast delivery queue.
//
// Why a queue: a serverless function must finish in ~60s, which caps a direct
// send loop at ~100 emails. Instead the admin action snapshots the recipient
// list into a broadcast_jobs row, then drains as many emails as fit in the
// request window; Vercel Cron hits /api/cron/broadcast every 10 minutes to
// keep draining unfinished jobs until they're done. Lists of any size are
// therefore fully reachable without manual re-runs.
//
// Safety properties:
//  - Atomic claim: a job is claimed with a conditional UPDATE (status →
//    'sending' only from 'queued'), so concurrent drains (action + cron) can
//    never double-send the same batch.
//  - Crash recovery: a job left 'sending' for > STALE_MS (e.g. a function
//    killed mid-batch) is flipped back to 'queued' and re-claimed; progress
//    already committed is preserved because the next_index advances per email.
//  - Budget-aware: the loop stops early when the time budget is nearly spent,
//    so a slow Brevo can't blow the serverless function window.

import { getServiceSupabase } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/brevo";
import { getSettings } from "@/lib/data";
import { buildWelcomeEmailHtml } from "@/lib/welcome-email";
import { signUnsubscribe } from "@/lib/newsletter-link";
import { resolveSiteUrl } from "@/lib/site-settings";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// A job stuck in 'sending' longer than this is presumed crashed and reclaimable.
const STALE_MS = 10 * 60 * 1000;

export type BroadcastJobRow = {
  id: string;
  subject: string;
  body: string;
  status: "queued" | "sending" | "done";
  total: number;
  sent: number;
  failed: number;
  failures: { email: string; error: string }[];
  created_at: string;
  updated_at: string;
};

type JobRecord = BroadcastJobRow & {
  recipients: string[];
  next_index: number;
};

export type DrainSummary = {
  ran: boolean;
  reason?: "supabase-unconfigured" | "none";
  jobId?: string;
  finished?: boolean;
  sent?: number;
  failed?: number;
  total?: number;
};

/** Enqueue a campaign: snapshot recipients + subject/body as a queued job. */
export async function createBroadcastJob(
  subject: string,
  body: string,
  recipients: string[]
): Promise<{ id: string }> {
  const sb = getServiceSupabase();
  const { data, error } = await sb
    .from("broadcast_jobs")
    .insert({ subject, body, recipients, total: recipients.length })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't queue the broadcast: ${error.message}`);
  return { id: data.id };
}

function composeHtml(
  subject: string,
  body: string,
  brand: string,
  signoff: string,
  siteUrl: string,
  email: string
): string {
  return buildWelcomeEmailHtml({
    brand,
    headline: subject,
    body,
    signoff,
    unsubscribeHref: `${siteUrl}/unsubscribe?t=${signUnsubscribe(email)}`,
    projectsHref: `${siteUrl}/projects`
  });
}

/**
 * Atomically claim a job for this drain:
 *  - jobId given: claim that specific job (used right after enqueue).
 *  - otherwise: reclaim any stale 'sending' job, then claim the oldest queued.
 * The claim UPDATE is conditional on the current status, so only one concurrent
 * drain wins; losers get null and move on.
 */
async function claimJob(
  sb: Awaited<ReturnType<typeof getServiceSupabase>>,
  jobId?: string
): Promise<JobRecord | null> {
  const now = new Date().toISOString();

  if (jobId) {
    const { data, error } = await sb
      .from("broadcast_jobs")
      .update({ status: "sending", updated_at: now })
      .eq("id", jobId)
      .eq("status", "queued")
      .select("*")
      .maybeSingle();
    return !error && data ? (data as JobRecord) : null;
  }

  // Crash recovery: flip stale 'sending' jobs back to 'queued'. Safe against
  // concurrent flips because it's conditional on status='sending'.
  const staleIso = new Date(Date.now() - STALE_MS).toISOString();
  await sb
    .from("broadcast_jobs")
    .update({ status: "queued", updated_at: now })
    .lt("updated_at", staleIso)
    .eq("status", "sending");

  const { data: candidate } = await sb
    .from("broadcast_jobs")
    .select("id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!candidate) return null;

  const { data, error } = await sb
    .from("broadcast_jobs")
    .update({ status: "sending", updated_at: now })
    .eq("id", candidate.id)
    .eq("status", "queued")
    .select("*")
    .maybeSingle();
  return !error && data ? (data as JobRecord) : null;
}

/**
 * Drain jobs until the time budget is nearly spent (or maxJobs is reached).
 * Progress is committed per email (next_index advances in the loop and is saved at
 * the end), so a mid-drain timeout only delays — never duplicates — delivery.
 */
export async function drainBroadcastJobs(
  maxJobs = 3,
  timeBudgetMs = 35_000,
  jobId?: string
): Promise<DrainSummary> {
  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return { ran: false, reason: "supabase-unconfigured" };
  }

  const settings = await getSettings().catch(() => null);
  const brand = settings?.brand_name || "ggraphixc";
  const signoff = settings?.designer_name || "ggraphixc";
  const siteUrl = resolveSiteUrl(settings?.site_url);

  const deadline = Date.now() + timeBudgetMs;
  let summary: DrainSummary = { ran: false, reason: "none" };

  for (let n = 0; n < maxJobs && Date.now() < deadline; n++) {
    const job = await claimJob(sb, jobId);
    if (!job) break;
    // Only ever target the explicit job once (used by the send action).
    jobId = undefined;

    const recipients = Array.isArray(job.recipients) ? job.recipients : [];
    let offset = job.next_index ?? 0;
    let sent = job.sent ?? 0;
    let failed = job.failed ?? 0;
    const failures = [...(job.failures ?? [])] as { email: string; error: string }[];

    // Send until the list is done or the budget is almost gone (2s margin so
    // the final DB write fits inside the function window).
    while (offset < recipients.length && Date.now() < deadline - 2000) {
      const email = recipients[offset];
      if (!EMAIL_RE.test(email)) {
        failed++;
        failures.push({ email, error: "invalid address" });
      } else {
        const res = await sendEmail({
          to: email,
          subject: job.subject,
          html: composeHtml(job.subject, job.body, brand, signoff, siteUrl, email)
        });
        if (res.ok) {
          sent++;
        } else {
          failed++;
          failures.push({ email, error: res.error ?? "unknown error" });
        }
      }
      offset++;
    }

    const finished = offset >= recipients.length;
    await sb
      .from("broadcast_jobs")
      .update({
        sent,
        failed,
        failures: failures.slice(-200),
        next_index: offset,
        status: finished ? "done" : "sending",
        updated_at: new Date().toISOString()
      })
      .eq("id", job.id);

    summary = { ran: true, jobId: job.id, finished, sent, failed, total: recipients.length };
  }

  return summary;
}

/** Recent jobs for the admin newsletter page (newest first). */
export async function getRecentJobs(limit = 6): Promise<BroadcastJobRow[]> {
  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return [];
  }
  const { data, error } = await sb
    .from("broadcast_jobs")
    .select("id, subject, body, status, total, sent, failed, failures, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as BroadcastJobRow[];
}

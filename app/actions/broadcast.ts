"use server";

import { getNewsletterRecipients, sendEmail } from "@/lib/brevo";
import { getSettings } from "@/lib/data";
import { buildWelcomeEmailHtml } from "@/lib/welcome-email";
import { signUnsubscribe } from "@/lib/newsletter-link";
import { requireAdmin } from "@/lib/admin-auth";
import { getServiceSupabase } from "@/lib/supabase/server";
import { resolveSiteUrl } from "@/lib/site-settings";
import { createBroadcastJob, drainBroadcastJobs } from "@/lib/broadcast-queue";

export type BroadcastState = {
  ok: boolean;
  message: string;
  sent?: number;
  failed?: number;
  total?: number;
  queued?: boolean;
  remaining?: number;
  failures?: { email: string; error: string }[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Per-recipient email HTML — same layout as the welcome email, but each
 *  recipient gets their own signed unsubscribe token. */
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
 * Shared send loop: one transactional email per address, sequential (the list
 * is small and it respects the free plan's daily quota), with per-address
 * failure collection so a single bad address never hides the rest.
 */
async function sendTo(
  emails: string[],
  subject: string,
  body: string,
  brand: string,
  signoff: string,
  siteUrl: string
): Promise<BroadcastState> {
  const failures: { email: string; error: string }[] = [];
  let sent = 0;
  for (const email of emails) {
    if (!EMAIL_RE.test(email)) {
      failures.push({ email, error: "invalid address" });
      continue;
    }
    const result = await sendEmail({
      to: email,
      subject,
      html: composeHtml(subject, body, brand, signoff, siteUrl, email)
    });
    if (result.ok) {
      sent++;
      // messageId lets the owner trace each delivery in the Brevo dashboard.
      console.log(`[broadcast] sent to ${email} (messageId ${result.id})`);
    } else {
      failures.push({ email, error: result.error ?? "unknown error" });
      console.error(`[broadcast] failed for ${email}:`, result.error);
    }
  }
  return {
    ok: failures.length === 0,
    sent,
    failed: failures.length,
    total: emails.length,
    failures,
    message:
      failures.length === 0
        ? `Broadcast sent to ${sent} subscriber${sent === 1 ? "" : "s"}.`
        : `Sent ${sent} of ${emails.length}. ${failures.length} failed — details below.`
  };
}

function validate(subject: string, body: string): string | null {
  if (!subject) return "Add a subject line first.";
  if (!body) return "Write a message body first.";
  if (subject.length > 120) return "Keep the subject under 120 characters.";
  return null;
}

/** Send a broadcast to every address on the Brevo Newsletter list.
 *
 * The campaign is queued (snapshot of the list) and as many batches as fit in
 * the request window are drained immediately; Vercel Cron finishes the rest in
 * the background — so lists of any size are fully reached without re-runs. */
export async function sendBroadcast(subject: string, body: string): Promise<BroadcastState> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Unauthorized — sign in to the admin portal and try again." };
  }
  const s = subject.trim();
  const b = body.trim();
  const invalid = validate(s, b);
  if (invalid) return { ok: false, message: invalid };

  let recipients: string[];
  try {
    recipients = await getNewsletterRecipients();
  } catch (e) {
    console.error("[broadcast] could not fetch recipients:", e instanceof Error ? e.message : e);
    return {
      ok: false,
      message: "Couldn't reach Brevo to fetch the subscriber list — try again in a moment."
    };
  }
  if (recipients.length === 0) {
    return {
      ok: false,
      message: "The Newsletter list is empty — no one to send to."
    };
  }

  let jobId: string;
  try {
    jobId = (await createBroadcastJob(s, b, recipients)).id;
  } catch (e) {
    console.error("[broadcast] could not enqueue:", e instanceof Error ? e.message : e);
    return { ok: false, message: "Couldn't queue the broadcast — try again in a moment." };
  }

  // Drain this campaign for up to ~40s (the page's maxDuration is 60s); the
  // cron finishes whatever is left in the background.
  try {
    await drainBroadcastJobs(1, 40_000, jobId);
  } catch (e) {
    console.error("[broadcast] drain failed:", e instanceof Error ? e.message : e);
  }

  // Read the job back for an honest progress report.
  type JobProgress = { total: number; sent: number; failed: number; failures: unknown };
  let job: JobProgress | null = null;
  try {
    const sb = getServiceSupabase();
    const { data } = await sb
      .from("broadcast_jobs")
      .select("total, sent, failed, failures")
      .eq("id", jobId)
      .maybeSingle();
    job = (data as JobProgress | null);
  } catch {}

  const total = job?.total ?? recipients.length;
  const sent = job?.sent ?? 0;
  const failed = job?.failed ?? 0;
  const remaining = Math.max(0, total - sent - failed);
  const failures = (job?.failures ?? []) as { email: string; error: string }[];

  const message =
    remaining > 0
      ? `Queued for ${total} subscriber${total === 1 ? "" : "s"} — sent ${sent} so far. The remaining ${remaining} are delivering in the background (every 10 minutes).`
      : failed > 0
        ? `Broadcast sent to ${sent} of ${total}. ${failed} failed — details below.`
        : `Broadcast sent to ${sent} subscriber${sent === 1 ? "" : "s"}.`;

  return {
    ok: failed === 0,
    sent,
    failed,
    total,
    queued: remaining > 0,
    remaining,
    failures: failures.slice(0, 50),
    message
  };
}

/** Send the current draft only to the owner's address — a safe dry run. */
export async function sendTestBroadcast(subject: string, body: string): Promise<BroadcastState> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Unauthorized — sign in to the admin portal and try again." };
  }
  const s = subject.trim();
  const b = body.trim();
  const invalid = validate(s, b);
  if (invalid) return { ok: false, message: invalid };

  const settings = await getSettings();
  const target =
    process.env.BREVO_FROM_EMAIL ||
    settings.contact_email?.trim() ||
    "hello@ggraphixc.vercel.app";
  const siteUrl = resolveSiteUrl(settings.site_url);

  const res = await sendTo(
    [target],
    s,
    b,
    settings.brand_name || "ggraphixc",
    settings.designer_name || "ggraphixc",
    siteUrl
  );
  res.message = res.ok
    ? `Test email sent to ${target}. Check your inbox — then hit “Send to all”.`
    : `Test email to ${target} failed: ${res.failures?.[0]?.error ?? res.message}`;
  return res;
}

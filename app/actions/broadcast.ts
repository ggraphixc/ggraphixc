"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getNewsletterRecipients, sendEmail } from "@/lib/brevo";
import { getSettings } from "@/lib/data";
import { buildWelcomeEmailHtml } from "@/lib/welcome-email";
import { signUnsubscribe } from "@/lib/newsletter-link";

export type BroadcastState = {
  ok: boolean;
  message: string;
  sent?: number;
  failed?: number;
  total?: number;
  failures?: { email: string; error: string }[];
};

// Safety ceiling for one broadcast: sequential sends must finish inside the
// serverless function window (~60s). 100 × ~400ms ≈ 40s worst case. Larger
// lists are preserved in Brevo and can be reached with a follow-up run.
const MAX_BROADCAST_RECIPIENTS = 100;

// Site URL used in email links (matches the newsletter/contact conventions).
const SITE_URL = "https://ggraphixc.vercel.app";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Gate for privileged admin actions. Mirrors the API-route guard
 * (app/api/revalidate, upload, ai/draft): read the session cookie with
 * @supabase/ssr and validate the JWT server-side. Demo mode (no Supabase
 * env vars) is allowed, matching the upload route's local-only convention.
 */
async function requireAdmin(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // No auth configured: allow the flow only in development (demo mode). In
  // production this would leave an open endpoint that emails every subscriber
  // from the owner's Brevo account — mirror the upload route's refusal.
  if (!supabaseUrl || !anonKey) return process.env.NODE_ENV !== "production";
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    });
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

/** Per-recipient email HTML — same layout as the welcome email, but each
 *  recipient gets their own signed unsubscribe token. */
function composeHtml(
  subject: string,
  body: string,
  brand: string,
  signoff: string,
  email: string
): string {
  return buildWelcomeEmailHtml({
    brand,
    headline: subject,
    body,
    signoff,
    unsubscribeHref: `${SITE_URL}/unsubscribe?t=${signUnsubscribe(email)}`
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
  signoff: string
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
      html: composeHtml(subject, body, brand, signoff, email)
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

/** Send a broadcast to every address on the Brevo Newsletter list. */
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

  // Cap the batch so the send loop finishes inside the serverless window.
  const batch = recipients.slice(0, MAX_BROADCAST_RECIPIENTS);
  const skipped = recipients.length - batch.length;

  const settings = await getSettings();
  const res = await sendTo(
    batch,
    s,
    b,
    settings.brand_name || "ggraphixc",
    settings.designer_name || "ggraphixc"
  );
  if (skipped > 0) {
    res.total = batch.length;
    res.message += ` ${skipped} more subscriber${skipped === 1 ? " is" : "s are"} still on the list — run the broadcast again to reach them.`;
  }
  return res;
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
    settings.contact_email?.trim() ||
    process.env.BREVO_FROM_EMAIL ||
    "hello@ggraphixc.vercel.app";

  const res = await sendTo(
    [target],
    s,
    b,
    settings.brand_name || "ggraphixc",
    settings.designer_name || "ggraphixc"
  );
  res.message = res.ok
    ? `Test email sent to ${target}. Check your inbox — then hit “Send to all”.`
    : `Test email to ${target} failed: ${res.failures?.[0]?.error ?? res.message}`;
  return res;
}

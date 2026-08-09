"use server";

import { getServiceSupabase } from "@/lib/supabase/server";
import { subscribeNewsletter } from "@/lib/brevo";
import { sendWelcomeEmail } from "@/lib/newsletter-email";
import { getSettings } from "@/lib/data";
import { isHoneypotFilled, isTooFast, rateLimit, clientIp } from "@/lib/spam-guard";

export type NewsletterState = {
  status: "idle" | "success" | "error";
  message: string;
};

/**
 * Backup sink: store the address in the newsletter_subscribers table so no
 * signup is ever lost — even if Brevo is down or not configured on this
 * deployment. Deduped on email (PK). Best-effort: if the table doesn't exist
 * yet (migration not run) or Supabase env is missing, returns false and the
 * caller falls back to Brevo alone rather than failing the visitor.
 */
// The pre-migration missing-table message is the *expected* state until the
// owner runs the migration — it must not spam logs. Anything else is a real
// failure worth surfacing.
const MISSING_TABLE = /could not find the table|does not exist|42p01/i;

/**
 * Send a short branded welcome email after a brand-new signup. Best-effort:
 * a failed welcome must never fail the subscription itself — failures are
 * logged so the owner can see them. Returns early when there's no email
 * engine configured (the backup-only mode).
 */
async function backupSubscribe(email: string): Promise<boolean> {
  try {
    const sb = getServiceSupabase();
    const { error } = await sb.from("newsletter_subscribers").upsert(
      { email, source: "footer", updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error && !MISSING_TABLE.test(error.message ?? "")) {
      console.error("[newsletter] Supabase backup subscribe failed:", error.message);
    }
    return !error;
  } catch (e) {
    console.error("[newsletter] Supabase backup subscribe threw:", e instanceof Error ? e.message : e);
    return false;
  }
}

export async function subscribe(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  // --- Spam guard: honeypot, time trap, per-IP rate limit ---
  // The honeypot gets a *silent success* so bots learn nothing. The time trap
  // returns an honest error — a fast-but-legit signup must not be silently
  // dropped while looking successful.
  if (isHoneypotFilled(formData.get("website"))) {
    return { status: "success", message: "You're in! Expect occasional design notes — no spam, ever." };
  }
  if (isTooFast(formData.get("rendered_at"))) {
    return { status: "error", message: "Signup didn't go through — please wait a second and try again." };
  }
  if (!rateLimit(await clientIp())) {
    return { status: "error", message: "Too many signups — please wait a minute and try again." };
  }

  const email = String(formData.get("email") ?? "").trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const brevoConfigured = Boolean(process.env.BREVO_API_KEY);
  const saved = await backupSubscribe(email);

  // Honest failure: only when BOTH sinks are unavailable. Previously this
  // claimed the visitor was subscribed when nothing was stored anywhere.
  if (!brevoConfigured && !saved) {
    return {
      status: "error",
      message: "Signups aren't active yet — the email service isn't connected."
    };
  }

  if (brevoConfigured) {
    const result = await subscribeNewsletter(email);
    if (!result.ok) {
      // Surface the failure (server console) instead of pretending success.
      console.error("[newsletter] Brevo subscribe failed:", result.error);
      // The signup is preserved in the Supabase backup sink, so the visitor
      // is still on the list — succeed softly rather than losing them.
      if (saved) {
        console.warn(
          "[newsletter] stored in Supabase backup only (Brevo down) — welcome email not sent"
        );
        return {
          status: "success",
          message: "You're in! Expect occasional design notes — no spam, ever."
        };
      }
      const settings = await getSettings().catch(() => null);
      const supportEmail = settings?.contact_email || "hello@ggraphixc.vercel.app";
      return {
        status: "error",
        message: `Couldn't subscribe you just now — try again, or email ${supportEmail} instead.`
      };
    }

    // Brevo is healthy — welcome only genuinely new subscribers. A returning
    // address (updated, not created) already got its welcome on first signup.
    if (result.created) {
      await sendWelcomeEmail(email);
    }
  } else if (saved) {
    // Backup-only mode: subscribed in Supabase, but there's no email engine to
    // send a welcome with. Surface it so the owner knows the signup path works
    // but delivery is waiting on BREVO_API_KEY.
    console.warn("[newsletter] subscribed via Supabase backup only — welcome email not sent (no BREVO_API_KEY)");
  }

  return {
    status: "success",
    message: "You're in! Expect occasional design notes — no spam, ever."
  };
}

"use server";

import { getServiceSupabase } from "@/lib/supabase/server";
import { subscribeNewsletter, sendEmail } from "@/lib/brevo";
import { getSettings } from "@/lib/data";
import { buildWelcomeEmailHtml, DEFAULT_WELCOME } from "@/lib/welcome-email";
import { signUnsubscribe } from "@/lib/newsletter-link";

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
// Site URL used in email links (matches the contact form's convention).
const SITE_URL = "https://ggraphixc.com";

/**
 * Send a short branded welcome email after a brand-new signup. The subject,
 * headline, and body are editable from Admin → Settings (welcome_email_*);
 * the sign-off, projects CTA, and a signed unsubscribe link are added
 * automatically. Best-effort: a failed welcome must never fail the
 * subscription itself — failures are logged so the owner can see them.
 * Returns early when there's no email engine configured (backup-only mode).
 */
async function sendWelcomeEmail(email: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) return; // nothing configured to send with
  try {
    const s = await getSettings();
    const brand = s.brand_name || "ggraphixc";
    const signoff = s.designer_name || "ggraphixc";
    const replyTo = s.contact_email || undefined;
    const subject = s.welcome_email_subject?.trim() || DEFAULT_WELCOME.subject;
    const headline = s.welcome_email_headline?.trim() || DEFAULT_WELCOME.headline;
    const body = s.welcome_email_body?.trim() || DEFAULT_WELCOME.body;

    const html = buildWelcomeEmailHtml({
      brand,
      headline,
      body,
      signoff,
      // Per-subscriber signed token: only this email's holder can unsubscribe.
      unsubscribeHref: `${SITE_URL}/unsubscribe?t=${signUnsubscribe(email)}`
    });

    const result = await sendEmail({
      to: email,
      replyTo,
      subject,
      html
    });
    if (!result.ok) {
      console.error("[newsletter] welcome email failed:", result.error);
    } else {
      // messageId lets the owner trace delivery in the Brevo dashboard.
      console.log(`[newsletter] welcome email sent to ${email} (messageId ${result.id})`);
    }
  } catch (e) {
    console.error("[newsletter] welcome email threw:", e instanceof Error ? e.message : e);
  }
}

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
      return {
        status: "error",
        message: "Couldn't subscribe you just now — try again, or email hello@ggraphixc.com instead."
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

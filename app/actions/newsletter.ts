"use server";

import { getServiceSupabase } from "@/lib/supabase/server";
import { subscribeNewsletter, sendEmail, escHtml } from "@/lib/brevo";
import { getSettings } from "@/lib/data";

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
async function sendWelcomeEmail(email: string): Promise<void> {
  if (!process.env.BREVO_API_KEY) return; // nothing configured to send with
  try {
    const s = await getSettings();
    const brand = s.brand_name || "ggraphixc";
    const signoff = s.designer_name || "ggraphixc";
    const replyTo = s.contact_email || undefined;

    const result = await sendEmail({
      to: email,
      replyTo,
      subject: `Welcome to ${brand} — you're in! 🎉`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
          <div style="padding:28px 0 8px">
            <span style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7c5cff">${escHtml(brand)}</span>
          </div>
          <h2 style="margin:8px 0 14px;font-size:24px">You're in — welcome to the design notes 👋</h2>
          <p style="font-size:15px;line-height:1.7;color:#333">
            Thanks for subscribing. Once a month you'll get one short email — brand
            systems, design craft, and the kind of before/after breakdowns that
            usually stay behind the scenes. No spam, ever.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#333">
            While you wait for the first issue, you can see how these ideas show up
            in real work over on the <a href="https://ggraphixc.com/projects" style="color:#7c5cff">projects page</a>.
          </p>
          <p style="font-size:13px;color:#999;margin-top:24px">
            — ${escHtml(signoff)}<br/>
            <span style="font-size:12px">You're receiving this because you subscribed at ggraphixc.com.</span>
          </p>
        </div>`
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

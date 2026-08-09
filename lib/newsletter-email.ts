// Server-only: sends the welcome ("new") and welcome-back ("back") emails.
// Used by the subscribe action and the resubscribe route so both stay on the
// exact same markup (built by lib/welcome-email.ts).

import { sendEmail } from "@/lib/brevo";
import { getSettings } from "@/lib/data";
import {
  buildWelcomeEmailHtml,
  DEFAULT_WELCOME,
  DEFAULT_WELCOME_BACK
} from "@/lib/welcome-email";
import { signUnsubscribe } from "@/lib/newsletter-link";
import { resolveSiteUrl } from "@/lib/site-settings";



/**
 * Send a short branded welcome (or welcome-back) email. The welcome subject,
 * headline, and body are editable from Admin → Settings (welcome_email_*);
 * the welcome-back copy uses built-in defaults. The sign-off, projects CTA,
 * and a signed unsubscribe link are added automatically. Best-effort: a failed
 * send must never fail the subscription itself — failures are logged.
 * Returns early when there's no email engine configured (backup-only mode).
 */
export async function sendWelcomeEmail(
  email: string,
  variant: "new" | "back" = "new"
): Promise<void> {
  if (!process.env.BREVO_API_KEY) return; // nothing configured to send with
  try {
    const s = await getSettings();
    const brand = s.brand_name || "ggraphixc";
    const signoff = s.designer_name || "ggraphixc";
    const replyTo = s.contact_email || undefined;
    const siteUrl = resolveSiteUrl(s.site_url);

    // Welcome copy is editable; welcome-back uses defaults.
    const subject =
      variant === "back"
        ? DEFAULT_WELCOME_BACK.subject
        : s.welcome_email_subject?.trim() || DEFAULT_WELCOME.subject;
    const headline =
      variant === "back"
        ? DEFAULT_WELCOME_BACK.headline
        : s.welcome_email_headline?.trim() || DEFAULT_WELCOME.headline;
    const body =
      variant === "back"
        ? DEFAULT_WELCOME_BACK.body
        : s.welcome_email_body?.trim() || DEFAULT_WELCOME.body;

    const html = buildWelcomeEmailHtml({
      brand,
      headline,
      body,
      signoff,
      // Per-subscriber signed token: only this email's holder can unsubscribe.
      unsubscribeHref: `${siteUrl}/unsubscribe?t=${signUnsubscribe(email)}`,
      projectsHref: `${siteUrl}/projects`
    });

    const result = await sendEmail({
      to: email,
      replyTo,
      subject,
      html
    });
    if (!result.ok) {
      console.error(
        `[newsletter] ${variant === "back" ? "welcome-back" : "welcome"} email failed:`,
        result.error
      );
    } else {
      // messageId lets the owner trace delivery in the Brevo dashboard.
      console.log(
        `[newsletter] ${variant === "back" ? "welcome-back" : "welcome"} email sent to ${email} (messageId ${result.id})`
      );
    }
  } catch (e) {
    console.error(
      `[newsletter] ${variant === "back" ? "welcome-back" : "welcome"} email threw:`,
      e instanceof Error ? e.message : e
    );
  }
}

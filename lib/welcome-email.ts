// Shared, dependency-free welcome-email module. Imported by the server action
// (app/actions/newsletter.ts) AND the client settings page (for the live
// preview), so it must not pull in any server-only code.

/** Escape text for use inside HTML email bodies. */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Fallback copy when the owner hasn't customized the settings yet.
export const DEFAULT_WELCOME = {
  subject: "Welcome to ggraphixc — you're in! 🎉",
  headline: "You're in — welcome to the design notes 👋",
  body:
    "Thanks for subscribing. Once a month you'll get one short email — brand systems, design craft, and the kind of before/after breakdowns that usually stay behind the scenes. No spam, ever."
};

// Copy for the "welcome back" email sent when someone resubscribes after
// having unsubscribed. Not settings-editable (defaults only).
export const DEFAULT_WELCOME_BACK = {
  subject: "Welcome back to ggraphixc 🎉",
  headline: "You're back — welcome home 👋",
  body: "Great to see you again. You're on the list, so the next design note will land right in this inbox — no action needed from you."
};

export type WelcomeEmailParts = {
  brand: string;
  headline: string;
  body: string;
  signoff: string;
  /** Fully-formed unsubscribe URL (signed per-subscriber by the server). */
  unsubscribeHref: string;
  projectsHref?: string;
};

/**
 * Build the welcome email's HTML. The sign-off, projects CTA, and unsubscribe
 * link are always appended automatically — they can't be lost by editing copy.
 */
export function buildWelcomeEmailHtml({
  brand,
  headline,
  body,
  signoff,
  unsubscribeHref,
  projectsHref = `${process.env.NEXT_PUBLIC_SITE_URL || "https://ggraphixc.vercel.app"}/projects`
}: WelcomeEmailParts): string {
  // A line that is exactly `[image: https://...]` renders as a centered,
  // responsive photo instead of a paragraph (URL is http(s)-only by regex, so
  // no script: or other schemes can sneak in).
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // The URL charset excludes quotes/angle brackets so it can never break
      // out of the src attribute into extra markup.
      const img = p.match(/^\[image:\s*(https?:\/\/[^\s"'<>\[\]]+)\s*\]$/i);
      if (img) {
        return (
          `<p style="margin:0 0 16px;text-align:center">` +
          `<img src="${img[1]}" alt="${escHtml(brand)}" style="max-width:100%;height:auto;border-radius:12px;display:inline-block" />` +
          `</p>`
        );
      }
      return `<p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 14px">${escHtml(p)}</p>`;
    })
    .join("\n");

  return `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
      <div style="padding:28px 0 8px">
        <span style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#7c5cff">${escHtml(brand)}</span>
      </div>
      <h2 style="margin:8px 0 16px;font-size:24px">${escHtml(headline)}</h2>
      ${paragraphs}
      <p style="margin:18px 0 0">
        <a href="${projectsHref}" style="display:inline-block;background:#7c5cff;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:999px">See the work →</a>
      </p>
      <p style="font-size:13px;color:#999;margin-top:26px">
        — ${escHtml(signoff)}<br/>
        <span style="font-size:12px">You're receiving this because you subscribed at ${escHtml(brand)}.</span><br/>
        <a href="${unsubscribeHref}" style="font-size:12px;color:#999">Unsubscribe from design notes</a>
      </p>
    </div>`;
}

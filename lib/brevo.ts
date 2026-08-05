// Server-only Brevo (Sendinblue) integration — transactional email + contacts.
// Docs: https://developers.brevo.com/reference

const API = "https://api.brevo.com/v3";

function headers(): Record<string, string> {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("Missing BREVO_API_KEY");
  return {
    "api-key": key,
    "Content-Type": "application/json",
    Accept: "application/json"
  };
}

function from() {
  return {
    email: process.env.BREVO_FROM_EMAIL || "hello@ggraphixc.com",
    name: process.env.BREVO_FROM_NAME || "ggraphixc"
  };
}

export type BrevoSendResult = { ok: boolean; id?: string; error?: string };

/**
 * Send a transactional email via Brevo SMTP API.
 * Returns { ok: false, error } on failure instead of throwing, so callers
 * (e.g. the contact form) can still succeed even if email delivery fails.
 */
export async function sendEmail(opts: {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<BrevoSendResult> {
  if (!process.env.BREVO_API_KEY) return { ok: false, error: "BREVO_API_KEY not set" };
  try {
    const res = await fetch(`${API}/smtp/email`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        sender: from(),
        to: [{ email: opts.to, name: opts.toName }],
        replyTo: opts.replyTo ? { email: opts.replyTo } : undefined,
        subject: opts.subject,
        htmlContent: opts.html
      })
    });
    const json = (await res.json().catch(() => ({}))) as { messageId?: string; code?: string };
    if (!res.ok) {
      return { ok: false, error: `Brevo ${res.status}: ${json.code ?? ""}`.trim() };
    }
    return { ok: true, id: json.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

/**
 * Find (or create) the "Newsletter" contact list, then add the address.
 */
let newsletterListId: number | null = null;

export async function subscribeNewsletter(email: string): Promise<BrevoSendResult> {
  if (!process.env.BREVO_API_KEY) return { ok: false, error: "BREVO_API_KEY not set" };
  try {
    // 1) locate or create the list once
    if (newsletterListId === null) {
      const listsRes = await fetch(`${API}/contacts/lists?limit=50&offset=0`, {
        headers: headers()
      });
      const listsJson = (await listsRes.json().catch(() => ({}))) as {
        lists?: { id: number; name: string }[];
      };
      const existing = listsJson.lists?.find((l) => l.name === "Newsletter");
      if (existing) {
        newsletterListId = existing.id;
      } else {
        const createRes = await fetch(`${API}/contacts/lists`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ name: "Newsletter", folderId: 1 })
        });
        const createJson = (await createRes.json().catch(() => ({}))) as { id?: number };
        if (!createRes.ok || !createJson.id) {
          return { ok: false, error: `Could not create list (${createRes.status})` };
        }
        newsletterListId = createJson.id;
      }
    }

    // 2) add / update the contact
    const res = await fetch(`${API}/contacts`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        email,
        listIds: [newsletterListId],
        updateEnabled: true
      })
    });
    if (!res.ok && res.status !== 201) {
      const json = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      return { ok: false, error: `Brevo ${res.status}: ${json.message ?? json.code ?? ""}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

/** Escape text for use inside HTML email bodies. */
export function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

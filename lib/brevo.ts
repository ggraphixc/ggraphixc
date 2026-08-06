// Server-only Brevo (Sendinblue) integration — transactional email + contacts.
// Docs: https://developers.brevo.com/reference

// escHtml lives in the shared email module (also used by the admin preview).
export { escHtml } from "@/lib/welcome-email";

const API = "https://api.brevo.com/v3";

// Every Brevo call must finish quickly or fail fast — a hanging fetch would
// leave a visitor waiting on the newsletter/contact form for many seconds.
const TIMEOUT_MS = 10_000;

function fetchOpts(opts: RequestInit): RequestInit {
  return { ...opts, signal: AbortSignal.timeout(TIMEOUT_MS) };
}

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

export type BrevoSendResult = { ok: boolean; id?: string; error?: string; created?: boolean };

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
    const res = await fetch(
      `${API}/smtp/email`,
      fetchOpts({
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          sender: from(),
          to: [{ email: opts.to, name: opts.toName }],
          replyTo: opts.replyTo ? { email: opts.replyTo } : undefined,
          subject: opts.subject,
          htmlContent: opts.html
        })
      })
    );
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
 * Find (or create) the "Newsletter" contact list, cached for the process.
 * Returns null when the key is missing or the list can't be resolved.
 */
let newsletterListId: number | null = null;

async function getNewsletterListId(): Promise<number | null> {
  if (newsletterListId !== null) return newsletterListId;
  if (!process.env.BREVO_API_KEY) return null;
  try {
    const listsRes = await fetch(`${API}/contacts/lists?limit=50&offset=0`, fetchOpts({ headers: headers() }));
    const listsJson = (await listsRes.json().catch(() => ({}))) as {
      lists?: { id: number; name: string }[];
    };
    const existing = listsJson.lists?.find((l) => l.name === "Newsletter");
    if (existing) {
      newsletterListId = existing.id;
      return newsletterListId;
    }
    const createRes = await fetch(
      `${API}/contacts/lists`,
      fetchOpts({
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ name: "Newsletter", folderId: 1 })
      })
    );
    const createJson = (await createRes.json().catch(() => ({}))) as { id?: number };
    if (createRes.ok && createJson.id) {
      newsletterListId = createJson.id;
    }
    return newsletterListId;
  } catch (e) {
    console.error("[brevo] could not resolve newsletter list id:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function subscribeNewsletter(email: string): Promise<BrevoSendResult> {
  if (!process.env.BREVO_API_KEY) return { ok: false, error: "BREVO_API_KEY not set" };
  try {
    // 1) locate or create the list once
    if (newsletterListId === null) {
      newsletterListId = await getNewsletterListId();
      if (newsletterListId === null) {
        return { ok: false, error: "Could not resolve the Newsletter list" };
      }
    }

    // 2) add / update the contact
    const res = await fetch(
      `${API}/contacts`,
      fetchOpts({
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          email,
          listIds: [newsletterListId],
          updateEnabled: true
        })
      })
    );
    if (!res.ok && res.status !== 201) {
      const json = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
      return { ok: false, error: `Brevo ${res.status}: ${json.message ?? json.code ?? ""}` };
    }
    // 201 = contact created (new subscriber), 204 = contact updated (returning).
    return { ok: true, created: res.status === 201 };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

/**
 * Fetch every email on the Newsletter list (paginated, capped). Returns []
 * when Brevo isn't configured or the list can't be resolved. Throws on a hard
 * fetch failure so callers can surface "couldn't reach Brevo" honestly
 * instead of silently showing an empty list (which looks like no subscribers).
 * Used by the admin broadcast composer and the broadcast action.
 */
export async function getNewsletterRecipients(limit = 1000): Promise<string[]> {
  if (!process.env.BREVO_API_KEY) return [];
  const id = await getNewsletterListId();
  if (id === null) return [];
  const emails: string[] = [];
  for (let offset = 0; offset < limit; offset += 500) {
    const res = await fetch(
      `${API}/contacts/lists/${id}/contacts?limit=500&offset=${offset}`,
      fetchOpts({ headers: headers() })
    );
    if (!res.ok) {
      throw new Error(`Brevo ${res.status} fetching newsletter recipients`);
    }
    const json = (await res.json().catch(() => ({}))) as {
      contacts?: { email?: string }[];
    };
    const page = (json.contacts ?? [])
      .map((c) => c.email ?? "")
      .filter(Boolean);
    emails.push(...page);
    if (page.length < 500) break;
  }
  return emails;
}

/**
 * Remove an address from Brevo entirely (the dependable unsubscribe).
 *
 * Note: Brevo's "remove from one list" endpoints don't work reliably on all
 * plans — PUT /contacts is additive-only and `unlinkAllLists` silently no-ops
 * (verified against the live API). Footer signups only ever belong to the
 * Newsletter list, so a full contact deletion is the correct, honest
 * unsubscribe. The Supabase backup row is removed by the caller.
 */
export async function unsubscribeNewsletter(email: string): Promise<BrevoSendResult> {
  if (!process.env.BREVO_API_KEY) return { ok: false, error: "BREVO_API_KEY not set" };
  try {
    const res = await fetch(
      `${API}/contacts/${encodeURIComponent(email)}`,
      fetchOpts({ method: "DELETE", headers: headers() })
    );
    // 204 = deleted, 404 = wasn't a contact — both are a successful unsubscribe.
    if (res.ok || res.status === 204 || res.status === 404) return { ok: true };
    return { ok: false, error: `Brevo ${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}


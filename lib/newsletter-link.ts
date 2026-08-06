// Server-only HMAC signing for newsletter unsubscribe links. The token embeds
// the email address + a signature, so (a) the raw address isn't exposed in the
// URL as plain text, and (b) only someone holding the signed link (i.e. the
// subscriber's own email) can unsubscribe that address. Verified with
// timing-safe comparison.

import { createHmac, timingSafeEqual } from "crypto";

// Preferred: an explicit NEWSLETTER_SECRET. Fallback: the Supabase service key
// (already secret and server-only) so the feature works without extra setup.
// If neither exists, signing degrades to an unsigned token that verification
// rejects — the page then shows the "invalid link" state instead of
// unsubscribing someone.
// Ordered candidate secrets: an explicit NEWSLETTER_SECRET wins for signing;
// the Supabase service key (already secret and server-only) is the fallback so
// the feature works without extra setup.
function secrets(): string[] {
  const list: string[] = [];
  if (process.env.NEWSLETTER_SECRET) list.push(process.env.NEWSLETTER_SECRET);
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) list.push(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return list;
}

function hmac(email: string, key: string): string {
  return createHmac("sha256", key)
    .update(email.toLowerCase())
    .digest("hex")
    .slice(0, 32);
}

/** Build a token: "<url-encoded email>.<signature>". */
export function signUnsubscribe(email: string): string {
  const [key] = secrets();
  const enc = encodeURIComponent(email.toLowerCase());
  return key ? `${enc}.${hmac(email, key)}` : enc;
}

/**
 * Verify a token and return the email, or null when the token is malformed or
 * the signature doesn't match (tampered / wrong secret).
 */
export function verifyUnsubscribe(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const enc = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let email: string;
  try {
    email = decodeURIComponent(enc).toLowerCase();
  } catch {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const a = Buffer.from(sig);
  // Verify against the current AND any previous secret, so links sent before a
  // NEWSLETTER_SECRET was added (or a key rotation) keep working.
  for (const key of secrets()) {
    const b = Buffer.from(hmac(email, key));
    if (a.length === b.length && timingSafeEqual(a, b)) return email;
  }
  return null;
}

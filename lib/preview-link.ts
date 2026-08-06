// Server-only HMAC signing for draft preview links. The token embeds the
// lookup key ("blog:<slug>" or "project:<slug>") + a signature, so only the
// admin (who can mint tokens through the admin-guarded API) can open an
// unpublished page. Verified with timing-safe comparison.

import { createHmac, timingSafeEqual } from "crypto";

// Same secret hierarchy as the newsletter links: an explicit PREVIEW_SECRET
// wins; the Supabase service key is the zero-setup fallback.
function secrets(): string[] {
  const list: string[] = [];
  if (process.env.PREVIEW_SECRET) list.push(process.env.PREVIEW_SECRET);
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) list.push(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return list;
}

function hmac(payload: string, key: string): string {
  return createHmac("sha256", key)
    .update(payload)
    .digest("hex")
    .slice(0, 32);
}

/** Build a token: "<url-encoded payload>.<signature>". */
export function signPreview(payload: string): string {
  const [key] = secrets();
  const enc = encodeURIComponent(payload);
  return key ? `${enc}.${hmac(payload, key)}` : enc;
}

/** Verify a token and return the payload (e.g. "blog:my-post"), or null. */
export function verifyPreview(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const enc = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  let payload: string;
  try {
    payload = decodeURIComponent(enc);
  } catch {
    return null;
  }
  if (!/^[a-z]+:[a-z0-9-_.]+$/i.test(payload)) return null;
  const a = Buffer.from(sig);
  for (const key of secrets()) {
    const b = Buffer.from(hmac(payload, key));
    if (a.length === b.length && timingSafeEqual(a, b)) return payload;
  }
  return null;
}

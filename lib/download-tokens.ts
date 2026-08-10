// Server-only: stateless HMAC download-access tokens. A token proves the admin
// approved a specific person's request to download a restricted project's
// images. Nothing is stored — the HMAC signature carries the payload, so any
// server that knows the secret can verify it.
import { createHmac, timingSafeEqual } from "crypto";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret(): string {
  return (
    process.env.DOWNLOAD_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "ggraphixc-dev-download-secret"
  );
}

/** Mint a download-access token for a project (binds to one inquiry). */
export function mintDownloadToken(projectSlug: string, inquiryId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ project: projectSlug, inquiry: inquiryId, exp: Date.now() + TTL_MS })
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

/** Verify a token against a project slug and expiry. Constant-time compare. */
export function verifyDownloadToken(token: string, projectSlug: string): boolean {
  try {
    const dot = token.indexOf(".");
    if (dot <= 0) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      project?: string;
      exp?: number;
    };
    if (data.project !== projectSlug) return false;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

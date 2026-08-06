import { getNewsletterSubscribers } from "@/lib/brevo";
import { getServiceSupabase } from "@/lib/supabase/server";
import SubscribersClient from "./SubscribersClient";

export const dynamic = "force-dynamic";

export type SubscriberRow = {
  email: string;
  source: string | null; // "footer" | "admin" | null (Brevo-only)
  createdAt: string | null;
  inBrevo: boolean;
  inBackup: boolean;
};

export default async function AdminSubscribers() {
  const brevoConfigured = Boolean(process.env.BREVO_API_KEY);

  // 1) Brevo list (the sending source of truth)
  let brevo: { email: string; createdAt: string | null }[] = [];
  let brevoError: string | null = null;
  if (brevoConfigured) {
    try {
      brevo = await getNewsletterSubscribers();
    } catch (e) {
      brevoError = e instanceof Error ? e.message : "Unknown error";
    }
  }

  // 2) Supabase backup (source + dates; also catches signups stored while
  //    Brevo was down — shown as backup-only rows so nothing is lost).
  const backup = new Map<string, { source: string | null; createdAt: string | null }>();
  try {
    const sb = getServiceSupabase();
    const { data, error } = await sb
      .from("newsletter_subscribers")
      .select("email, source, created_at");
    if (!error && data) {
      (data as { email: string; source: string | null; created_at: string | null }[]).forEach(
        (r) => backup.set(r.email.toLowerCase(), { source: r.source, createdAt: r.created_at })
      );
    }
  } catch {
    // table missing or Supabase unconfigured — Brevo alone is fine
  }

  // 3) Merge: every Brevo contact, plus backup-only addresses.
  const rows: SubscriberRow[] = [];
  const seen = new Set<string>();
  for (const c of brevo) {
    const b = backup.get(c.email);
    rows.push({
      email: c.email,
      source: b?.source ?? null,
      createdAt: b?.createdAt ?? c.createdAt,
      inBrevo: true,
      inBackup: Boolean(b)
    });
    seen.add(c.email);
  }
  for (const [email, b] of backup) {
    if (!seen.has(email)) {
      rows.push({
        email,
        source: b.source,
        createdAt: b.createdAt,
        inBrevo: false,
        inBackup: true
      });
    }
  }
  rows.sort((a, b2) => (b2.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <SubscribersClient
      initialRows={rows}
      brevoConfigured={brevoConfigured}
      brevoError={brevoError}
    />
  );
}

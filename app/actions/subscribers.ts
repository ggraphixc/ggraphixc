"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { subscribeNewsletter, unsubscribeNewsletter } from "@/lib/brevo";
import { getServiceSupabase } from "@/lib/supabase/server";

export type SubscriberActionResult = { ok: boolean; message: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MISSING_TABLE = /could not find the table|does not exist|42p01/i;

/** Backup sink write — same convention as the footer subscribe action. */
async function backupAdd(email: string, source: string): Promise<boolean> {
  try {
    const sb = getServiceSupabase();
    const { error } = await sb.from("newsletter_subscribers").upsert(
      { email, source, updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error && !MISSING_TABLE.test(error.message ?? "")) {
      console.error("[subscribers] backup add failed:", error.message);
    }
    return !error;
  } catch {
    return false;
  }
}

async function backupRemove(email: string): Promise<boolean> {
  try {
    const sb = getServiceSupabase();
    const { error } = await sb.from("newsletter_subscribers").delete().eq("email", email);
    return !error;
  } catch {
    return false;
  }
}

/** Manually add a subscriber to the Newsletter list (Brevo + backup). */
export async function addSubscriber(email: string): Promise<SubscriberActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Unauthorized — sign in to the admin portal and try again." };
  }
  const e = email.trim().toLowerCase();
  if (!EMAIL_RE.test(e)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (!process.env.BREVO_API_KEY) {
    return { ok: false, message: "Brevo isn't connected — add BREVO_API_KEY to your environment first." };
  }
  const result = await subscribeNewsletter(e);
  if (!result.ok) {
    return { ok: false, message: `Couldn't add to Brevo: ${result.error}` };
  }
  await backupAdd(e, "admin");
  return {
    ok: true,
    message: result.created === false ? `${e} was already subscribed.` : `${e} added to the newsletter.`
  };
}

/** Remove a subscriber from Brevo and the backup. */
export async function removeSubscriber(email: string): Promise<SubscriberActionResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Unauthorized — sign in to the admin portal and try again." };
  }
  const e = email.trim().toLowerCase();
  if (!e) return { ok: false, message: "Enter a valid email address." };
  const result = await unsubscribeNewsletter(e);
  if (!result.ok) {
    // Honest failure: if Brevo is unreachable, the address stays subscribed —
    // claiming removal would be the same fake-success bug fixed earlier.
    return { ok: false, message: `Couldn't remove from Brevo: ${result.error}` };
  }
  await backupRemove(e);
  return { ok: true, message: `${e} removed from the newsletter.` };
}

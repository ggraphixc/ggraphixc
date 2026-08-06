import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { subscribeNewsletter } from "@/lib/brevo";
import { verifyUnsubscribe } from "@/lib/newsletter-link";
import { sendWelcomeEmail } from "@/lib/newsletter-email";

// Public endpoint — the "changed your mind?" flow on the unsubscribe done
// page. Requires the same signed token the unsubscribe link carried, so only
// the person who received the link can resubscribe that address.
export async function POST(req: NextRequest) {
  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const token = typeof body?.token === "string" ? body.token : "";
  const email = verifyUnsubscribe(token);
  if (!email) {
    return NextResponse.json({ error: "This link is invalid." }, { status: 400 });
  }

  // 1) Brevo list (primary).
  const brevo = await subscribeNewsletter(email);
  if (!brevo.ok) {
    console.error("[newsletter] resubscribe (Brevo) failed:", brevo.error);
    return NextResponse.json(
      { error: "Couldn't resubscribe you just now — please try again in a minute." },
      { status: 500 }
    );
  }

  // A genuinely new contact (unsubscribed earlier = deleted) gets a
  // "welcome back" email; an already-present address is left alone.
  if (brevo.created) {
    await sendWelcomeEmail(email, "back");
  }

  // 2) Supabase backup — best-effort upsert (deduped on email PK).
  try {
    const sb = getServiceSupabase();
    const { error } = await sb.from("newsletter_subscribers").upsert(
      { email, source: "footer", updated_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (error) {
      // Missing table (pre-migration) is expected; real errors are worth logging.
      if (!/could not find the table|does not exist|42p01/i.test(error.message ?? "")) {
        console.error("[newsletter] resubscribe (Supabase) failed:", error.message);
      }
    }
  } catch (e) {
    console.error("[newsletter] resubscribe (Supabase) threw:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}

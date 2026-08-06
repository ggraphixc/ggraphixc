import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { unsubscribeNewsletter } from "@/lib/brevo";

// Public endpoint — the /unsubscribe page calls this when a visitor confirms.
export async function POST(req: NextRequest) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  }

  // 1) Brevo — remove the contact (the source of truth for delivery).
  const brevo = await unsubscribeNewsletter(email);
  if (!brevo.ok) {
    // Honest failure: claiming "you're unsubscribed" while the Brevo contact
    // still exists would repeat the fake-success bug we fixed in subscribe.
    console.error("[newsletter] unsubscribe (Brevo) failed:", brevo.error);

    // The backup removal can still run — it does no harm.
    try {
      const sb = getServiceSupabase();
      const { error } = await sb.from("newsletter_subscribers").delete().eq("email", email);
      if (error) console.error("[newsletter] unsubscribe (Supabase) failed:", error.message);
    } catch (e) {
      console.error("[newsletter] unsubscribe (Supabase) threw:", e instanceof Error ? e.message : e);
    }

    return NextResponse.json(
      {
        error:
          "Couldn't unsubscribe you just now — the email service didn't respond. Please try again in a minute."
      },
      { status: 500 }
    );
  }

  // 2) Supabase backup — best-effort delete (table may not exist pre-migration).
  try {
    const sb = getServiceSupabase();
    const { error } = await sb.from("newsletter_subscribers").delete().eq("email", email);
    if (error) console.error("[newsletter] unsubscribe (Supabase) failed:", error.message);
  } catch (e) {
    console.error("[newsletter] unsubscribe (Supabase) threw:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true });
}

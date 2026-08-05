"use server";

import { getServiceSupabase } from "@/lib/supabase/server";
import { sendEmail, escHtml } from "@/lib/brevo";

export type ContactState = {
  status: "idle" | "success" | "error";
  message: string;
  demo?: boolean;
};

export async function submitInquiry(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const investment_range = String(formData.get("investment_range") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", message: "Name, email and message are required." };
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return { status: "error", message: "Please provide a valid email." };
  }

  let sb: ReturnType<typeof getServiceSupabase> | null = null;
  try {
    sb = getServiceSupabase();
  } catch {
    sb = null;
  }

  // Demo mode: Supabase not configured yet. Acknowledge without persisting.
  if (!sb) {
    return {
      status: "success",
      demo: true,
      message: "Thanks! (Demo mode — connect Supabase to store inquiries.)"
    };
  }

  const { error } = await sb.from("inquiries").insert({
    name,
    email,
    phone,
    investment_range,
    message
  });

  if (error) {
    return { status: "error", message: "Could not save your message. Please try again." };
  }

  // --- Email notifications (best-effort; never fail the form on email errors) ---
  const adminEmail = process.env.BREVO_FROM_EMAIL || "hello@ggraphixc.com";

  // 1) Alert the site owner.
  await sendEmail({
    to: adminEmail,
    toName: "ggraphixc",
    subject: `New project brief from ${name}`,
    replyTo: email,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="margin:0 0 16px">New project brief 🚀</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#666;width:120px">Name</td><td style="padding:8px 0;font-weight:600">${escHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">Phone</td><td style="padding:8px 0">${escHtml(phone ?? "—")}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Budget</td><td style="padding:8px 0">${escHtml(investment_range ?? "—")}</td></tr>
        </table>
        <p style="font-size:14px;color:#333;line-height:1.7;margin:16px 0 0;padding:16px;background:#f6f7f9;border-radius:10px">${escHtml(message)}</p>
        <p style="font-size:13px;color:#999;margin-top:20px">Manage this brief in the admin dashboard → /admin/messages</p>
      </div>`
  });

  // 2) Auto-reply to the client so they know it landed.
  await sendEmail({
    to: email,
    toName: name,
    subject: "Thanks — your brief is with ggraphixc",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="margin:0 0 12px">Thanks, ${escHtml(name)} 👋</h2>
        <p style="font-size:15px;line-height:1.7;color:#333">Your project brief just landed safely. I usually reply within <strong>24 hours</strong> with a clear plan and a quote.</p>
        <p style="font-size:15px;line-height:1.7;color:#333">While you wait, you can browse a few <a href="https://ggraphixc.com/projects">case studies</a> to see how we might work together.</p>
        <p style="font-size:13px;color:#999;margin-top:24px">— Godson Otobo, ggraphixc</p>
      </div>`
  });

  return { status: "success", message: "Thanks! Your message is on its way — expect a reply within 24 hours." };
}

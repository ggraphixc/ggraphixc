"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { sendEmail, escHtml } from "@/lib/brevo";
import { getProjects, getSettings } from "@/lib/data";
import { mintDownloadToken } from "@/lib/download-tokens";
import { resolveSiteUrl } from "@/lib/site-settings";
import { getServiceSupabase } from "@/lib/supabase/server";

export type ApproveState = { ok: boolean; message: string };

/**
 * Approve a "request access" inquiry: finds the project named in the request
 * message, mints a 7-day download-access token, emails the download links to
 * the inquirer, and marks the inquiry as replied.
 */
export async function approveDownloadAccess({
  inquiryId
}: {
  inquiryId: string;
}): Promise<ApproveState> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Not authorized." };
  }
  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return { ok: false, message: "Storage unavailable." };
  }
  const { data: inquiry, error } = await sb
    .from("inquiries")
    .select("id, name, email, message, status")
    .eq("id", inquiryId)
    .maybeSingle();
  if (error || !inquiry) return { ok: false, message: "Inquiry not found." };
  if (!inquiry.email) return { ok: false, message: "This inquiry has no email to send to." };
  if (inquiry.status === "replied") {
    return {
      ok: false,
      message: "This request was already approved — the previous link is still valid for 7 days."
    };
  }

  // Match the project named in the request (we generate those messages, e.g.
  // "Request access to the full-resolution images of <title>").
  const projects = await getProjects();
  const subject = inquiry.message || "";
  const project = projects.find((p) => p.title && subject.includes(p.title));
  if (!project) {
    return {
      ok: false,
      message: "Couldn't match a project in this request — reply manually from the message."
    };
  }

  const settings = await getSettings();
  const brand = settings.brand_name || "ggraphixc";
  const designer = settings.designer_name || "Godson Otobo";
  const siteUrl = resolveSiteUrl(settings.site_url);
  const token = mintDownloadToken(project.slug, inquiryId);
  const accessUrl = `${siteUrl}/projects/${project.slug}?access=${token}`;
  const zipUrl = `${siteUrl}/api/projects/${project.slug}/download-all?t=${token}`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto">
      <h2 style="margin:0 0 12px">Your download access is approved 🎉</h2>
      <p style="font-size:15px;line-height:1.7;color:#333">
        Hi ${escHtml(inquiry.name || "there")}, your request for the full-resolution images of
        <strong>${escHtml(project.title)}</strong> was approved. Open the project below to download
        the gallery — the link works for <strong>7 days</strong>.
      </p>
      <p style="margin:18px 0">
        <a href="${accessUrl}" style="display:inline-block;background:#7c5cff;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:999px">Open ${escHtml(brand)} project</a>
      </p>
      <p style="font-size:13px;color:#666;line-height:1.7">
        Prefer everything at once? <a href="${zipUrl}">Download the full gallery as a ZIP</a>.
      </p>
      <p style="font-size:13px;color:#999;margin-top:24px">— ${escHtml(designer)}, ${escHtml(brand)}</p>
    </div>`;

  const sent = await sendEmail({
    to: inquiry.email,
    toName: inquiry.name || undefined,
    subject: `Your download access for ${project.title} is ready`,
    html
  });

  if (!sent.ok) {
    // Keep the status pending so the admin can retry — the token is already
    // valid, so the failure message offers the link for a manual send.
    return {
      ok: false,
      message: `The download link is ready but the email failed (${sent.error}). Copy ${accessUrl} to send manually, then try again.`
    };
  }

  await sb.from("inquiries").update({ status: "replied" }).eq("id", inquiryId);
  return { ok: true, message: `Approved — download links sent to ${inquiry.email}.` };
}

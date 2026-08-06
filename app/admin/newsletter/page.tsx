import { getNewsletterRecipients } from "@/lib/brevo";
import { getProjects, getSettings } from "@/lib/data";
import BroadcastClient from "./BroadcastClient";

// The recipient list and settings change with every Brevo/DB mutation.
export const dynamic = "force-dynamic";

// Allow the broadcast send loop (up to the 100-recipient cap) to finish inside
// the serverless function window instead of timing out mid-send.
export const maxDuration = 60;

export default async function AdminNewsletter() {
  const brevoConfigured = Boolean(process.env.BREVO_API_KEY);
  let recipients: string[] = [];
  let recipientsError: string | null = null;
  try {
    recipients = await getNewsletterRecipients();
  } catch (e) {
    // Don't pretend the list is empty when Brevo is unreachable — show the
    // owner why the composer can't load recipients.
    recipientsError = e instanceof Error ? e.message : "Unknown error";
  }
  const [settings, projects] = await Promise.all([
    getSettings().catch(() => null),
    getProjects().catch(() => [])
  ]);
  return (
    <BroadcastClient
      recipients={recipients}
      brevoConfigured={brevoConfigured}
      recipientsError={recipientsError}
      ownerEmail={
        settings?.contact_email?.trim() ||
        process.env.BREVO_FROM_EMAIL ||
        "hello@ggraphixc.vercel.app"
      }
      brand={settings?.brand_name || "ggraphixc"}
      signoff={settings?.designer_name || "ggraphixc"}
      projects={projects.map((p) => ({
        slug: p.slug,
        title: p.title,
        category: p.category ?? "",
        result: p.result ?? "",
        description: p.description ?? ""
      }))}
    />
  );
}

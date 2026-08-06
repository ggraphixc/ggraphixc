import { getServiceSupabase } from "@/lib/supabase/server";
import BackupClient from "./BackupClient";

export const dynamic = "force-dynamic";

const CONTENT_TABLES = [
  "projects",
  "project_images",
  "blog_posts",
  "testimonials",
  "clients",
  "faqs",
  "inquiries",
  "site_settings"
] as const;

const LABELS: Record<string, string> = {
  projects: "Projects",
  project_images: "Project images",
  blog_posts: "Blog posts",
  testimonials: "Testimonials",
  clients: "Clients",
  faqs: "FAQs",
  inquiries: "Messages",
  site_settings: "Settings"
};

export default async function AdminBackup() {
  const counts: Record<string, number> = {};
  try {
    const sb = getServiceSupabase();
    await Promise.all(
      CONTENT_TABLES.map(async (t) => {
        const { data } = await sb.from(t).select("id");
        counts[t] = data?.length ?? 0;
      })
    );
  } catch {
    // counts stay empty — the client still offers export/restore
  }

  return <BackupClient initialCounts={counts} labels={LABELS} />;
}

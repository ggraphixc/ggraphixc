import { getNewsletterRecipients } from "@/lib/brevo";
import { getProjects, getSettings } from "@/lib/data";
import { getRecentJobs } from "@/lib/broadcast-queue";
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
  const [settings, projects, recentJobs] = await Promise.all([
    getSettings().catch(() => null),
    getProjects().catch(() => []),
    getRecentJobs(6)
  ]);
  return (
    <>
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
      <DeliveryJobs jobs={recentJobs} />
    </>
  );
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  done: { color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  sending: { color: "var(--accent)", bg: "rgba(0,210,255,0.12)" },
  queued: { color: "#ffb454", bg: "rgba(255,180,84,0.1)" }
};

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function DeliveryJobs({ jobs }: { jobs: Awaited<ReturnType<typeof getRecentJobs>> }) {
  if (jobs.length === 0) return null;
  return (
    <div className="admin-card">
      <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>Recent deliveries</h3>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 12 }}>
        Campaigns finish in the background — refresh this page to see progress.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {jobs.map((j) => {
          const st = STATUS_STYLE[j.status] ?? STATUS_STYLE.queued;
          const progress = j.total > 0 ? Math.round(((j.sent + j.failed) / j.total) * 100) : 0;
          return (
            <div
              key={j.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.015)"
              }}
            >
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: st.color,
                  background: st.bg
                }}
              >
                {j.status}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14, flex: "1 1 200px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {j.subject}
              </span>
              <span style={{ fontSize: 13, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {j.sent} sent{j.failed > 0 ? ` · ${j.failed} failed` : ""} · {j.total} total
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap", minWidth: 110, textAlign: "right" }}>
                {progress}% · {fmtWhen(j.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

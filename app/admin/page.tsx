import { getServiceSupabase } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { getConciergeStats, type EventCount } from "@/lib/vercel-analytics";

// The dashboard shows live counts per request — render dynamically.
export const dynamic = "force-dynamic";

function CStat({
  label,
  icon,
  value
}: {
  label: string;
  icon: string;
  value?: EventCount;
}) {
  return (
    <div className="cstat">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <i className={`fa-solid ${icon}`} style={{ color: "var(--accent)", fontSize: 14 }} />
        <span className="lbl">{label}</span>
      </div>
      <div className="num">{value?.count ?? 0}</div>
      <div className="vis">{value?.visitors ?? 0} visitors</div>
    </div>
  );
}

async function counts() {
  const sb = (() => {
    try {
      return getServiceSupabase();
    } catch {
      return null;
    }
  })();
  if (!sb) return { projects: 0, testimonials: 0, messages: 0, blog: 0 };
  const [p, t, m, b] = await Promise.all([
    sb.from("projects").select("*", { count: "exact", head: true }),
    sb.from("testimonials").select("*", { count: "exact", head: true }),
    sb.from("inquiries").select("*", { count: "exact", head: true }),
    sb.from("blog_posts").select("*", { count: "exact", head: true })
  ]);
  return {
    projects: p.count ?? 0,
    testimonials: t.count ?? 0,
    messages: m.count ?? 0,
    blog: b.count ?? 0
  };
}

export default async function AdminDashboard() {
  const c = await counts();
  const s = await getSettings();
  const stats = await getConciergeStats();
  const opened = stats.events.concierge_opened?.count ?? 0;
  const afterChat = stats.contactAfterChat.count;
  const chatRate = opened > 0 ? Math.round((afterChat / opened) * 100) : 0;
  const cards = [
    { label: "Projects", value: c.projects, href: "/admin/projects", icon: "fa-images" },
    { label: "Blog Posts", value: c.blog, href: "/admin/blog", icon: "fa-pen-nib" },
    { label: "Testimonials", value: c.testimonials, href: "/admin/testimonials", icon: "fa-comment-dots" },
    { label: "Messages", value: c.messages, href: "/admin/messages", icon: "fa-envelope" }
  ];
  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Dashboard</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28 }}>
        Welcome back. Manage your portfolio content from here.
      </p>
      <div className="admin-grid">
        {cards.map((card) => (
          <a key={card.href} href={card.href} className="admin-stat" style={{ display: "block" }}>
            <div style={{ color: "var(--accent)", marginBottom: 10 }}>
              <i className={`fa-solid ${card.icon}`} />
            </div>
            <div className="num">{card.value}</div>
            <div style={{ color: "var(--muted)", fontWeight: 600 }}>{card.label}</div>
          </a>
        ))}
      </div>

      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Concierge activity</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              {stats.configured
                ? "Chat + contact funnel from Vercel Analytics — last 30 days."
                : "Live chat & contact funnel from Vercel Analytics."}
            </p>
          </div>
          {stats.configured && <span className="badge-soft">{stats.period.since} → {stats.period.until}</span>}
        </div>

        {!stats.configured ? (
          <div className="analytics-hint">
            <i className="fa-solid fa-chart-line" aria-hidden="true" />
            <div>
              Events are already being collected, but the dashboard needs a one-time setup to read them: create a{" "}
              <strong>Vercel access token</strong> (vercel.com → Account → Settings → Tokens) and add it as the{" "}
              <code>VERCEL_ANALYTICS_TOKEN</code> environment variable in your Vercel project settings, then redeploy.
            </div>
          </div>
        ) : stats.error ? (
          <p style={{ color: "#ff9b9b", fontSize: 13.5 }}>
            Couldn&apos;t reach Vercel Analytics: {stats.error}
          </p>
        ) : (
          <>
            <div className="cstats-grid">
              <CStat label="Chats opened" icon="fa-comment-dots" value={stats.events.concierge_opened} />
              <CStat label="Messages sent" icon="fa-paper-plane" value={stats.events.concierge_message} />
              <CStat label="Card clicks" icon="fa-mouse-pointer" value={stats.events.concierge_card_click} />
              <CStat label="Contact submits" icon="fa-envelope" value={stats.events.contact_submit} />
            </div>
            <div className="cstats-funnel">
              <span>
                <i className="fa-solid fa-check" style={{ color: "var(--accent)", marginRight: 6 }} />
                Contact after chat: <strong>{afterChat}</strong> ({stats.contactAfterChat.visitors} visitors)
              </span>
              <span>
                Contact without chat: <strong>{stats.contactNoChat.count}</strong>
              </span>
              <span>
                Chat → contact rate: <strong>{chatRate}%</strong>
              </span>
            </div>
          </>
        )}
      </div>

      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800 }}>Site info</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              What the public site shows from Admin → Settings. Marked fields are empty.
            </p>
          </div>
          <a href="/admin/settings" className="btn btn-ghost btn-sm">
            <i className="fa-solid fa-gear" /> Edit in Settings
          </a>
        </div>
        <div className="site-info-grid">
          {[
            { k: "Brand name", v: s.brand_name },
            { k: "Designer", v: s.designer_name },
            { k: "Role", v: s.role_title },
            { k: "Email", v: s.contact_email },
            { k: "Phone / WhatsApp", v: s.whatsapp_number || s.contact_phone },
            { k: "Location", v: s.location }
          ].map((row) => (
            <div key={row.k} className="site-info-item">
              <div className="k">{row.k}</div>
              <div className={row.v ? "v" : "v empty"}>{row.v || "Not set"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Quick links</h3>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 14 }}>
          Add new work, review client messages, or update testimonials. Changes appear live on the public site.
        </p>
        <div className="row-actions">
          <a href="/admin/projects" className="btn btn-outline btn-sm">
            <i className="fa-solid fa-plus" /> New Project
          </a>
          <a href="/" className="btn btn-ghost btn-sm" target="_blank">
            <i className="fa-solid fa-up-right-from-square" /> View Site
          </a>
        </div>
      </div>
    </>
  );
}

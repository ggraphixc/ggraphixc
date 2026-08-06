"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addSubscriber, removeSubscriber } from "@/app/actions/subscribers";
import type { SubscriberRow } from "./page";

type Props = {
  initialRows: SubscriberRow[];
  brevoConfigured: boolean;
  brevoError: string | null;
};

const SOURCE_LABEL: Record<string, string> = {
  footer: "Footer signup",
  admin: "Added manually",
  resubscribe: "Resubscribed"
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function SubscribersClient({ initialRows, brevoConfigured, brevoError }: Props) {
  const router = useRouter();
  // Rows come from the server page; after add/remove we call router.refresh()
  // and the parent re-renders with fresh data, so props are the source of truth.
  const rows = initialRows;
  const [query, setQuery] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Addresses removed this session are hidden immediately — Brevo's list
  // endpoint can lag ~1s behind a delete, and the server refresh reconciles.
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const downloadRef = useRef<HTMLAnchorElement | null>(null);

  const filtered = useMemo(() => {
    const visible = rows.filter((r) => !hidden.has(r.email));
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    return visible.filter((r) => r.email.toLowerCase().includes(q));
  }, [rows, query, hidden]);

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;
    setBusy(true);
    setMsg(null);
    const res = await addSubscriber(email);
    setMsg({ type: res.ok ? "ok" : "err", text: res.message });
    setBusy(false);
    if (res.ok) {
      setNewEmail("");
      refresh();
    }
  }

  function onRemove(row: SubscriberRow) {
    if (!confirm(`Remove ${row.email} from the newsletter? They'll stop receiving broadcasts.`)) return;
    setBusy(true);
    setMsg(null);
    void removeSubscriber(row.email).then((res) => {
      setMsg({ type: res.ok ? "ok" : "err", text: res.message });
      setBusy(false);
      if (res.ok) {
        setHidden((prev) => new Set(prev).add(row.email));
        refresh();
      }
    });
  }

  function exportCsv() {
    // Guard against spreadsheet formula injection: a value starting with
    // = + - @ would otherwise execute as a formula when opened in Excel/Sheets.
    const esc = (v: string) => {
      const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const lines = [
      ["email", "source", "subscribed"].join(","),
      ...rows.map((r) =>
        [esc(r.email), esc(SOURCE_LABEL[r.source ?? ""] ?? (r.inBackup ? "Backup" : "Brevo")), esc(fmtDate(r.createdAt))].join(",")
      )
    ];
    // UTF-8 BOM so Excel detects the encoding and keeps non-ASCII characters.
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = url;
      downloadRef.current.download = "newsletter-subscribers.csv";
      downloadRef.current.click();
    }
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Subscribers</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Everyone on the Brevo Newsletter list — add, remove, search, and export.
          </p>
        </div>
        <span className="badge-dot" style={{ fontSize: 13, fontWeight: 700 }}>
          {!brevoConfigured ? (
            "Brevo not connected"
          ) : brevoError ? (
            "List unavailable"
          ) : (
            <>
              <i className="fa-solid fa-users" style={{ marginRight: 6 }} />
              {rows.length} subscriber{rows.length === 1 ? "" : "s"}
            </>
          )}
        </span>
      </div>

      {/* Add form */}
      <form className="admin-card" onSubmit={onAdd} style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Add a subscriber</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="field" style={{ flex: "2 1 260px", marginBottom: 0 }}>
            <label htmlFor="sub-email">Email</label>
            <input
              id="sub-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !brevoConfigured}>
            <i className="fa-solid fa-user-plus" style={{ marginRight: 6 }} />
            {busy ? "Adding…" : "Add subscriber"}
          </button>
        </div>
      </form>

      {!brevoConfigured && (
        <div className="admin-card" style={{ borderColor: "#7c5cff66" }}>
          <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 8 }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: 6, color: "var(--accent)" }} />
            <strong>Brevo isn&apos;t connected on this deployment.</strong> Add{" "}
            <code style={{ background: "var(--surface)", padding: "2px 6px", borderRadius: 6 }}>BREVO_API_KEY</code>{" "}
            to your environment to manage the Newsletter list.
          </p>
        </div>
      )}

      {brevoError && (
        <div className="admin-card" style={{ borderColor: "#ff8080", borderWidth: 1.5 }}>
          <p style={{ fontSize: 14, color: "var(--muted)" }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6, color: "#ff8080" }} />
            Couldn&apos;t load the subscriber list from Brevo ({brevoError}). Reload the page to try again.
          </p>
        </div>
      )}

      {/* List */}
      <div className="admin-card admin-table-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <div className="field" style={{ flex: "1 1 220px", marginBottom: 0 }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email…"
              aria-label="Search subscribers"
            />
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv} disabled={rows.length === 0}>
            <i className="fa-solid fa-file-csv" style={{ marginRight: 6 }} />
            Export CSV
          </button>
        </div>

        {isPending ? (
          <p style={{ color: "var(--muted)" }}>Refreshing…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--muted)", padding: "16px 0" }}>
            {query ? "No subscribers match your search." : "No subscribers yet — share the footer signup form or add one above."}
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Source</th>
                <th>Subscribed</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.email}>
                  <td data-label="Email" style={{ fontWeight: 600 }}>
                    {row.email}
                    {!row.inBrevo && (
                      <span
                        title="Only in the Supabase backup — Brevo wasn't reachable at signup"
                        style={{ marginLeft: 8, fontSize: 11, color: "#ffb454", whiteSpace: "nowrap" }}
                      >
                        <i className="fa-solid fa-database" /> backup only
                      </span>
                    )}
                  </td>
                  <td data-label="Source" style={{ color: "var(--muted)" }}>
                    {SOURCE_LABEL[row.source ?? ""] ?? (row.inBackup ? "Backup" : "Brevo")}
                  </td>
                  <td data-label="Subscribed" style={{ color: "var(--muted)" }}>
                    {fmtDate(row.createdAt)}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => onRemove(row)}
                        disabled={busy}
                        aria-label={`Remove ${row.email}`}
                        title="Remove from newsletter"
                      >
                        <i className="fa-solid fa-user-minus" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {msg && (
        <p style={{ marginTop: 12, fontSize: 13.5, color: msg.type === "ok" ? "var(--accent)" : "#ff8080" }}>
          {msg.text}
        </p>
      )}

      <a ref={downloadRef} style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />
    </>
  );
}

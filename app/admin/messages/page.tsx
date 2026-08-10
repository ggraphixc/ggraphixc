"use client";

import { useEffect, useState } from "react";
import { approveDownloadAccess } from "@/app/actions/approve-downloads";
import { supabase } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";

export default function AdminMessages() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  /** Approve a download request: mints a token, emails the links, marks replied. */
  async function approve(m: Inquiry) {
    setBusyId(m.id);
    setNotice(null);
    const res = await approveDownloadAccess({ inquiryId: m.id });
    setBusyId(null);
    setNotice({ type: res.ok ? "ok" : "err", text: res.message });
    if (res.ok) load();
  }

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data as Inquiry[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (mounted && !error && data) setItems(data as Inquiry[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (!error) load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("inquiries").delete().eq("id", id);
    if (!error) load();
  }

  return (
    <>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>Messages</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
        Inquiries submitted through your contact form.
      </p>
      {notice && (
        <p
          role="status"
          style={{
            marginBottom: 18,
            padding: "12px 16px",
            borderRadius: 10,
            border: `1px solid ${notice.type === "ok" ? "var(--accent)" : "#ff8080"}`,
            background: notice.type === "ok" ? "rgba(0,210,255,0.06)" : "rgba(255,128,128,0.06)",
            color: notice.type === "ok" ? "var(--accent)" : "#ff9b9b",
            fontSize: 13.5
          }}
        >
          <i
            className={`fa-solid ${notice.type === "ok" ? "fa-circle-check" : "fa-triangle-exclamation"}`}
            style={{ marginRight: 8 }}
          />
          {notice.text}
        </p>
      )}

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Contact</th>
                <th>Message</th>
                <th>Range</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m.id}>
                  <td data-label="From" style={{ fontWeight: 600 }}>{m.name}</td>
                  <td data-label="Contact" style={{ color: "var(--muted)", fontSize: 13 }}>
                    {m.email}
                    {m.phone && <div>{m.phone}</div>}
                  </td>
                  <td data-label="Message" style={{ maxWidth: 320, color: "var(--muted)" }}>{m.message}</td>
                  <td data-label="Budget range" style={{ color: "var(--muted)" }}>{m.investment_range ?? "—"}</td>
                  <td data-label="Status">
                    <select
                      value={m.status}
                      onChange={(e) => setStatus(m.id, e.target.value)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: "6px 10px" }}
                    >
                      <option value="new">new</option>
                      <option value="read">read</option>
                      <option value="replied">replied</option>
                      <option value="archived">archived</option>
                    </select>
                  </td>
                  <td>
                    <div className="row-actions">
                      {m.message.toLowerCase().includes("request access") ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => approve(m)}
                          disabled={busyId === m.id || m.status === "archived"}
                          title="Finds the project in this request, mints a 7-day access token, and emails the download links"
                        >
                          <i className={`fa-solid ${busyId === m.id ? "fa-spinner fa-spin" : "fa-download"}`} />
                          {busyId === m.id ? " Approving…" : " Approve & send"}
                        </button>
                      ) : null}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>No messages yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

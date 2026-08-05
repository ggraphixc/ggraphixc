"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Inquiry } from "@/lib/types";

export default function AdminMessages() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

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

      <div className="admin-card" style={{ overflowX: "auto" }}>
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
                  <td style={{ fontWeight: 600 }}>{m.name}</td>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>
                    {m.email}
                    {m.phone && <div>{m.phone}</div>}
                  </td>
                  <td style={{ maxWidth: 320, color: "var(--muted)" }}>{m.message}</td>
                  <td style={{ color: "var(--muted)" }}>{m.investment_range ?? "—"}</td>
                  <td>
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
                    <button className="btn btn-danger btn-sm" onClick={() => remove(m.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
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

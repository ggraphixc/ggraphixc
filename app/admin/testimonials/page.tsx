"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Testimonial } from "@/lib/types";
import { bumpContentCache } from "@/components/admin/cacheBump";

type FormState = Omit<Testimonial, "id" | "created_at">;

const EMPTY: FormState = {
  name: "",
  role: "",
  avatar_url: null,
  quote: "",
  display_order: 0
};

export default function AdminTestimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setItems(data as Testimonial[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("display_order", { ascending: true });
      if (mounted && !error && data) setItems(data as Testimonial[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function startEdit(t: Testimonial) {
    setEditing(t.id);
    setForm({ name: t.name, role: t.role ?? "", avatar_url: t.avatar_url, quote: t.quote, display_order: t.display_order });
    setMsg("");
  }

  function reset() {
    setEditing(null);
    setForm(EMPTY);
    setMsg("");
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim()) {
      setMsg("Name and quote are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    const payload = {
      name: form.name.trim(),
      role: form.role?.trim() || null,
      avatar_url: form.avatar_url?.trim() || null,
      quote: form.quote.trim(),
      display_order: form.display_order
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("testimonials").update(payload).eq("id", editing));
    } else {
      ({ error } = await supabase.from("testimonials").insert(payload));
    }
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    reset();
    await load();
    bumpContentCache();
  }

  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (!error) {
      await load();
      bumpContentCache();
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Testimonials</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Client reviews shown on your portfolio.</p>
        </div>
        {editing && (
          <button className="btn btn-ghost btn-sm" onClick={reset}>
            <i className="fa-solid fa-xmark" /> Cancel
          </button>
        )}
      </div>

      <form className="admin-card" onSubmit={save}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>
          {editing ? "Edit testimonial" : "Add testimonial"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Role / Company</label>
            <input value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="CEO, Brand" />
          </div>
        </div>
        <div className="field">
          <label>Avatar URL (optional)</label>
          <input value={form.avatar_url ?? ""} onChange={(e) => set("avatar_url", e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Quote</label>
          <textarea value={form.quote} onChange={(e) => set("quote", e.target.value)} style={{ minHeight: 90 }} />
        </div>
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Display order</label>
          <input type="number" value={form.display_order} onChange={(e) => set("display_order", Number(e.target.value))} />
        </div>
        {msg && <p style={{ color: "#ff8080", fontSize: 13, marginBottom: 10 }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Saving..." : editing ? "Update" : "Add Testimonial"}
        </button>
      </form>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td style={{ color: "var(--muted)" }}>{t.role}</td>
                  <td style={{ color: "var(--muted)" }}>{t.display_order}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(t.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>No testimonials yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

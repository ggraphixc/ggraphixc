"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Testimonial } from "@/lib/types";
import InlineEdit from "@/components/admin/InlineEdit";
import AdminToast from "@/components/admin/AdminToast";
import { useDragSort } from "@/components/admin/useDragSort";
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
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

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

  /** Drag-reorder: renumber display_order 1..n and persist. */
  async function reorder(next: Testimonial[]) {
    const reordered = next.map((t, i) => ({ ...t, display_order: i + 1 }));
    setItems(reordered);
    const { error } = await supabase
      .from("testimonials")
      .upsert(
        reordered.map((t) => ({ id: t.id, display_order: t.display_order })),
        { onConflict: "id" }
      );
    if (error) {
      setToast({ text: "Reorder failed: " + error.message, type: "err" });
      await load();
    } else {
      setToast({ text: "Order saved", type: "ok" });
      bumpContentCache();
    }
  }

  const { rowProps, handleProps, dragIndex, overIndex } = useDragSort(items, reorder);

  /** Inline field save on a row. */
  async function quickSave(id: string, patch: Partial<Testimonial>) {
    const { error } = await supabase.from("testimonials").update(patch).eq("id", id);
    if (error) {
      setToast({ text: error.message, type: "err" });
      return;
    }
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    setToast({ text: "Saved", type: "ok" });
    bumpContentCache();
  }

  /** Keyboard / touch fallback: swap a row with its neighbour. */
  async function nudge(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    await reorder(next);
  }

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
    setToast({ text: editing ? "Testimonial updated" : "Testimonial added", type: "ok" });
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
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Client reviews shown on your portfolio. Drag rows to reorder.
          </p>
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

      <div className="admin-card admin-table-wrap">
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 30 }} aria-label="Drag to reorder" />
                <th>Name</th>
                <th>Role</th>
                <th>Quote</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((t, i) => (
                <tr
                  key={t.id}
                  {...rowProps(i)}
                  className={`${dragIndex === i ? "dragging" : ""} ${overIndex === i ? "drop-target" : ""}`}
                >
                  <td>
                    <span {...handleProps(i)} className="drag-handle" aria-label="Drag to reorder" title="Drag to reorder" role="button" tabIndex={0} onKeyDown={(e) => {
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        nudge(i, -1);
                      }
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        nudge(i, 1);
                      }
                    }}>
                      <i className="fa-solid fa-grip-vertical" />
                    </span>
                    <span className="row-actions" style={{ marginTop: 6, gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => nudge(i, -1)} aria-label="Move up" title="Move up">
                        <i className="fa-solid fa-arrow-up" />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => nudge(i, 1)} aria-label="Move down" title="Move down">
                        <i className="fa-solid fa-arrow-down" />
                      </button>
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <InlineEdit value={t.name} onSave={(v) => quickSave(t.id, { name: v })} />
                  </td>
                  <td style={{ color: "var(--muted)" }}>
                    <InlineEdit value={t.role ?? ""} onSave={(v) => quickSave(t.id, { role: v })} />
                  </td>
                  <td style={{ color: "var(--muted)", maxWidth: 340 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>
                      “{t.quote}”
                    </div>
                  </td>
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
                  <td colSpan={5} style={{ color: "var(--muted)" }}>No testimonials yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AdminToast message={toast?.text ?? ""} type={toast?.type ?? "ok"} onClear={() => setToast(null)} />
    </>
  );
}

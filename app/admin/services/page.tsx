"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Service } from "@/lib/types";
import InlineEdit from "@/components/admin/InlineEdit";
import AdminToast from "@/components/admin/AdminToast";
import { useDragSort } from "@/components/admin/useDragSort";
import { bumpContentCache } from "@/components/admin/cacheBump";

const ICON_OPTIONS = [
  "fa-palette",
  "fa-layer-group",
  "fa-object-group",
  "fa-bullhorn",
  "fa-wand-magic-sparkles",
  "fa-compass-drafting",
  "fa-globe",
  "fa-brush",
  "fa-pen-nib",
  "fa-camera-retro",
  "fa-chart-line",
  "fa-heart"
];

export default function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [icon, setIcon] = useState(ICON_OPTIONS[0]);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setItems(data as Service[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });
      if (mounted && !error && data) setItems(data as Service[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function reorder(next: Service[]) {
    const reordered = next.map((s, i) => ({ ...s, display_order: i + 1 }));
    setItems(reordered);
    const { error } = await supabase
      .from("services")
      .upsert(
        reordered.map((s) => ({ id: s.id, display_order: s.display_order })),
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

  async function nudge(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    await reorder(next);
  }

  async function quickSave(id: string, patch: Partial<Service>) {
    const { error } = await supabase.from("services").update(patch).eq("id", id);
    if (error) {
      setToast({ text: error.message, type: "err" });
      return;
    }
    setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setToast({ text: "Saved", type: "ok" });
    bumpContentCache();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setMsg("Title and description are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("services").insert({
      icon,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      description: description.trim(),
      features: features.trim() || null,
      display_order: items.length + 1
    });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setTitle("");
    setSubtitle("");
    setDescription("");
    setFeatures("");
    setToast({ text: "Service added", type: "ok" });
    await load();
    bumpContentCache();
  }

  async function remove(id: string) {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) {
      await load();
      bumpContentCache();
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Services</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Service cards shown on the homepage grid and the /services page. Drag rows to reorder.
          </p>
        </div>
      </div>

      <form className="admin-card" onSubmit={add}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Add service</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="contact-row">
          <div className="field">
            <label>Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brand Identity" />
          </div>
          <div className="field">
            <label>Subtitle (optional)</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Identities that endure" />
          </div>
        </div>
        <div className="field">
          <label>Icon</label>
          <select value={icon} onChange={(e) => setIcon(e.target.value)}>
            {ICON_OPTIONS.map((ic) => (
              <option key={ic} value={ic}>
                {ic}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 11, color: "var(--muted)", marginTop: -6 }}>
            Font Awesome icon class — the icon renders in the card header.
          </span>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: 70 }} placeholder="Logos, color systems, typography, and brand guidelines that make you instantly recognizable." />
        </div>
        <div className="field">
          <label>Features (one per line — optional)</label>
          <textarea value={features} onChange={(e) => setFeatures(e.target.value)} style={{ minHeight: 90 }} placeholder={"Logo Design & Identity\nBrand Strategy\nBrand Guidelines"} />
          <span style={{ fontSize: 11, color: "var(--muted)", marginTop: -6 }}>
            Shown as check chips on the /services page. Leave empty to hide the panel.
          </span>
        </div>
        {msg && <p style={{ color: "#ff8080", fontSize: 13, margin: "0 0 10px" }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Adding..." : "Add Service"}
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
                <th>Icon</th>
                <th>Title</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s, i) => (
                <tr
                  key={s.id}
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
                      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => nudge(i, -1)} aria-label="Move up">
                        <i className="fa-solid fa-arrow-up" />
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={() => nudge(i, 1)} aria-label="Move down">
                        <i className="fa-solid fa-arrow-down" />
                      </button>
                    </span>
                  </td>
                  <td data-label="Icon" style={{ maxWidth: 170 }}>
                    <InlineEdit value={s.icon} onSave={(v) => quickSave(s.id, { icon: v })} inputStyle={{ width: 130 }} />
                  </td>
                  <td data-label="Title" style={{ fontWeight: 600, maxWidth: 240 }}>
                    <InlineEdit value={s.title} onSave={(v) => quickSave(s.id, { title: v })} />
                  </td>
                  <td data-label="Description" style={{ color: "var(--muted)", maxWidth: 380 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }}>
                      {s.description}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "var(--muted)" }}>No services yet.</td>
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

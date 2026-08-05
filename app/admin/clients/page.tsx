"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Client } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";
import InlineEdit from "@/components/admin/InlineEdit";
import AdminToast from "@/components/admin/AdminToast";
import { useDragSort } from "@/components/admin/useDragSort";
import { bumpContentCache } from "@/components/admin/cacheBump";

export default function AdminClients() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setItems(data as Client[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("display_order", { ascending: true });
      if (mounted && !error && data) setItems(data as Client[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function reorder(next: Client[]) {
    const reordered = next.map((c, i) => ({ ...c, display_order: i + 1 }));
    setItems(reordered);
    const { error } = await supabase
      .from("clients")
      .upsert(
        reordered.map((c) => ({ id: c.id, display_order: c.display_order })),
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

  async function quickSave(id: string, patch: Partial<Client>) {
    const { error } = await supabase.from("clients").update(patch).eq("id", id);
    if (error) {
      setToast({ text: error.message, type: "err" });
      return;
    }
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setToast({ text: "Saved", type: "ok" });
    bumpContentCache();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setMsg("Client name is required.");
      return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("clients").insert({
      name: name.trim(),
      logo_url: logo?.trim() || null,
      display_order: items.length + 1
    });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setName("");
    setLogo(null);
    setToast({ text: "Client added", type: "ok" });
    await load();
    bumpContentCache();
  }

  async function remove(id: string) {
    if (!confirm("Remove this client?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (!error) {
      await load();
      bumpContentCache();
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Clients</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Logos shown in the “Trusted by” marquee on the homepage. Drag rows to reorder.
          </p>
        </div>
      </div>

      <form className="admin-card" onSubmit={add}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Add client</h3>
        <div className="admin-form-grid">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Client name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Logo</label>
            <ImageUpload value={logo} folder="clients" onChange={(url) => setLogo(url ?? null)} />
            <input
              value={logo ?? ""}
              onChange={(e) => setLogo(e.target.value || null)}
              placeholder="…or paste a logo URL"
              style={{ marginTop: 8 }}
            />
          </div>
        </div>
        {msg && <p style={{ color: "#ff8080", fontSize: 13, margin: "10px 0 0" }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy} style={{ marginTop: 16 }}>
          {busy ? "Adding..." : "Add Client"}
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
                <th style={{ width: 64 }}>Logo</th>
                <th>Name</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c, i) => (
                <tr
                  key={c.id}
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
                  <td>
                    {c.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="thumb-cell" src={c.logo_url} alt={c.name} />
                    ) : (
                      <div className="thumb-cell" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
                        —
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <InlineEdit value={c.name} onSave={(v) => quickSave(c.id, { name: v })} />
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(c.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>No clients yet.</td>
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

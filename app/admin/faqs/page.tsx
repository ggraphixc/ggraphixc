"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Faq } from "@/lib/types";
import InlineEdit from "@/components/admin/InlineEdit";
import AdminToast from "@/components/admin/AdminToast";
import { useDragSort } from "@/components/admin/useDragSort";
import { bumpContentCache } from "@/components/admin/cacheBump";

export default function AdminFaqs() {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setItems(data as Faq[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("display_order", { ascending: true });
      if (mounted && !error && data) setItems(data as Faq[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function reorder(next: Faq[]) {
    const reordered = next.map((f, i) => ({ ...f, display_order: i + 1 }));
    setItems(reordered);
    const { error } = await supabase
      .from("faqs")
      .upsert(
        reordered.map((f) => ({ id: f.id, display_order: f.display_order })),
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

  async function quickSave(id: string, patch: Partial<Faq>) {
    const { error } = await supabase.from("faqs").update(patch).eq("id", id);
    if (error) {
      setToast({ text: error.message, type: "err" });
      return;
    }
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    setToast({ text: "Saved", type: "ok" });
    bumpContentCache();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setMsg("Question and answer are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    const { error } = await supabase.from("faqs").insert({
      question: question.trim(),
      answer: answer.trim(),
      display_order: items.length + 1
    });
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setQuestion("");
    setAnswer("");
    setToast({ text: "FAQ added", type: "ok" });
    await load();
    bumpContentCache();
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (!error) {
      await load();
      bumpContentCache();
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>FAQs</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Questions shown in the homepage accordion. Drag rows to reorder.
          </p>
        </div>
      </div>

      <form className="admin-card" onSubmit={add}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Add FAQ</h3>
        <div className="field">
          <label>Question</label>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What design services do you offer?" />
        </div>
        <div className="field">
          <label>Answer</label>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ minHeight: 80 }} />
        </div>
        {msg && <p style={{ color: "#ff8080", fontSize: 13, margin: "0 0 10px" }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Adding..." : "Add FAQ"}
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
                <th>Question</th>
                <th>Answer</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((f, i) => (
                <tr
                  key={f.id}
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
                  <td data-label="Question" style={{ fontWeight: 600, maxWidth: 260 }}>
                    <InlineEdit value={f.question} onSave={(v) => quickSave(f.id, { question: v })} />
                  </td>
                  <td data-label="Answer" style={{ color: "var(--muted)", maxWidth: 380 }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 }}>
                      {f.answer}
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(f.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ color: "var(--muted)" }}>No FAQs yet.</td>
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

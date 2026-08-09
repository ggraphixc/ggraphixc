"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { BlogPost } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";
import InlineEdit from "@/components/admin/InlineEdit";
import AdminToast from "@/components/admin/AdminToast";
import { useDragSort } from "@/components/admin/useDragSort";
import { bumpContentCache } from "@/components/admin/cacheBump";

type FormState = Omit<BlogPost, "id" | "created_at">;

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: null,
  cover_url: null,
  content: "",
  tags: null,
  published: false,
  published_at: null,
  display_order: 0
};

export default function AdminBlog() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setItems(data as BlogPost[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("display_order", { ascending: true });
      if (mounted && !error && data) setItems(data as BlogPost[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /** Drag-reorder: renumber display_order 1..n and persist. */
  async function reorder(next: BlogPost[]) {
    const reordered = next.map((p, i) => ({ ...p, display_order: i + 1 }));
    setItems(reordered);
    const { error } = await supabase
      .from("blog_posts")
      .upsert(
        reordered.map((p) => ({ id: p.id, display_order: p.display_order })),
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
  async function quickSave(id: string, patch: Partial<BlogPost>) {
    const { error } = await supabase.from("blog_posts").update(patch).eq("id", id);
    if (error) {
      setToast({ text: error.message, type: "err" });
      return;
    }
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
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

  function startEdit(p: BlogPost) {
    setEditing(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      cover_url: p.cover_url,
      content: p.content,
      tags: p.tags,
      published: p.published,
      published_at: p.published_at,
      display_order: p.display_order
    });
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
    if (!form.title.trim() || !form.slug.trim() || !form.content.trim()) {
      setMsg("Title, slug and content are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt?.trim() || null,
      cover_url: form.cover_url?.trim() || null,
      content: form.content.trim(),
      tags: form.tags?.trim() || null,
      published: form.published,
      // Only store a schedule when it's in the future — otherwise the post is
      // simply live (published_at=null means "visible now").
      published_at: form.published_at && new Date(form.published_at).getTime() > Date.now() ? new Date(form.published_at).toISOString() : null,
      display_order: form.display_order
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("blog_posts").update(payload).eq("id", editing));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(payload));
    }
    setBusy(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setToast({ text: editing ? "Post updated" : "Post added", type: "ok" });
    reset();
    await load();
    bumpContentCache();
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (!error) {
      await load();
      bumpContentCache();
    }
  }

  async function togglePublish(p: BlogPost) {
    const { error } = await supabase.from("blog_posts").update({ published: !p.published }).eq("id", p.id);
    if (!error) {
      await load();
      bumpContentCache();
    }
  }

  /** Mint a signed draft-preview link and copy it to the clipboard. */
  async function copyPreview(slug: string) {
    try {
      const res = await fetch(`/api/preview-token?kind=blog&slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Unauthorized or invalid");
      const { url } = (await res.json()) as { url?: string };
      if (!url) throw new Error("No url");
      await navigator.clipboard.writeText(url);
      setToast({ text: "Preview link copied — share it to review this draft", type: "ok" });
    } catch {
      setToast({ text: "Couldn't create a preview link", type: "err" });
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Blog</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Write and publish posts shown on /blog. Drag rows to reorder.
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
          {editing ? "Edit post" : "New post"}
        </h3>
        <div className="admin-form-grid">
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="field">
            <label>Slug</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-post" />
          </div>
        </div>
        <div className="field">
          <label>Excerpt</label>
          <input value={form.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary for cards" />
        </div>
        <div className="field">
          <label>Cover image</label>
          <ImageUpload value={form.cover_url} folder="blog" onChange={(url) => set("cover_url", url ?? "")} />
          <input
            value={form.cover_url ?? ""}
            onChange={(e) => set("cover_url", e.target.value)}
            placeholder="…or paste a cover URL"
            style={{ marginTop: 8 }}
          />
        </div>
        <div className="field">
          <label>Content (paragraphs separated by blank lines)</label>
          <textarea value={form.content} onChange={(e) => set("content", e.target.value)} style={{ minHeight: 160 }} />
        </div>
        <div className="admin-form-grid">
          <div className="field">
            <label>Tags (comma separated)</label>
            <input value={form.tags ?? ""} onChange={(e) => set("tags", e.target.value)} placeholder="Brand, Systems" />
          </div>
          <div className="field">
            <label>Display order</label>
            <input type="number" value={form.display_order} onChange={(e) => set("display_order", Number(e.target.value))} />
          </div>
        </div>
        <div className="admin-form-grid">
          <label style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--muted)", fontSize: 14 }}>
            <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
            Published (visible on the public blog)
          </label>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Schedule publish (optional)</label>
            <input
              type="datetime-local"
              value={form.published_at ? new Date(form.published_at).toISOString().slice(0, 16) : ""}
              onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: -6 }}>
              Leave empty to publish immediately. With a future date, the post appears automatically from that moment (needs the post to stay checked as published).
            </span>
          </div>
        </div>
        {msg && <p style={{ color: "#ff8080", fontSize: 13, marginBottom: 10 }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Saving..." : editing ? "Update" : "Add Post"}
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
                <th style={{ width: 64 }}>Cover</th>
                <th>Title</th>
                <th>Tags</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p, i) => (
                <tr
                  key={p.id}
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
                  <td>
                    {p.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="thumb-cell" src={p.cover_url} alt={p.title} />
                    ) : (
                      <div className="thumb-cell" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 12 }}>
                        —
                      </div>
                    )}
                  </td>
                  <td data-label="Title" style={{ fontWeight: 600 }}>
                    <InlineEdit value={p.title} onSave={(v) => quickSave(p.id, { title: v })} />
                  </td>
                  <td data-label="Tags" style={{ color: "var(--muted)" }}>
                    <InlineEdit value={p.tags ?? ""} onSave={(v) => quickSave(p.id, { tags: v || null })} />
                  </td>
                  <td data-label="Status">
                    {(() => {
                      const isScheduled =
                        p.published && p.published_at && new Date(p.published_at).getTime() > Date.now();
                      return (
                        <span
                          className="badge-soft"
                          style={{
                            background: isScheduled ? "rgba(255,180,84,0.12)" : p.published ? "rgba(0,210,255,0.12)" : "var(--glass-strong)",
                            color: isScheduled ? "#ffb454" : p.published ? "var(--accent)" : "var(--muted)"
                          }}
                        >
                          {isScheduled
                            ? `scheduled ${new Date(p.published_at as string).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
                            : p.published
                              ? "published"
                              : "draft"}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => copyPreview(p.slug)} title="Copy draft preview link">
                        <i className="fa-solid fa-link" />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => togglePublish(p)} title="Toggle publish">
                        <i className={`fa-solid ${p.published ? "fa-eye-slash" : "fa-eye"}`} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>No posts yet.</td>
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

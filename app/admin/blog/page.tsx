"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { BlogPost } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";
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
  display_order: 0
};

export default function AdminBlog() {
  const [items, setItems] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

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

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Blog</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Write and publish posts shown on /blog.</p>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>Tags (comma separated)</label>
            <input value={form.tags ?? ""} onChange={(e) => set("tags", e.target.value)} placeholder="Brand, Systems" />
          </div>
          <div className="field">
            <label>Display order</label>
            <input type="number" value={form.display_order} onChange={(e) => set("display_order", Number(e.target.value))} />
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, color: "var(--muted)", fontSize: 14 }}>
          <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
          Published (visible on the public blog)
        </label>
        {msg && <p style={{ color: "#ff8080", fontSize: 13, marginBottom: 10 }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Saving..." : editing ? "Update" : "Add Post"}
        </button>
      </form>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Tags</th>
                <th>Status</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.title}</td>
                  <td style={{ color: "var(--muted)" }}>{p.tags}</td>
                  <td>
                    <span className="badge-soft" style={{ background: p.published ? "rgba(0,210,255,0.12)" : "rgba(255,255,255,0.06)", color: p.published ? "var(--accent)" : "var(--muted)" }}>
                      {p.published ? "published" : "draft"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.display_order}</td>
                  <td>
                    <div className="row-actions">
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
                  <td colSpan={5} style={{ color: "var(--muted)" }}>No posts yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

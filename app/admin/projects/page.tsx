"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";
import GalleryManager from "@/components/admin/GalleryManager";
import { bumpContentCache } from "@/components/admin/cacheBump";

type FormState = Omit<Project, "id" | "created_at">;

const EMPTY: FormState = {
  title: "",
  slug: "",
  category: null,
  image_url: null,
  result: null,
  description: null,
  link: null,
  featured: false,
  client_name: null,
  challenge: null,
  solution: null,
  results: null,
  display_order: 0
};

export default function AdminProjects() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setItems(data as Project[]);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("display_order", { ascending: true });
      if (mounted && !error && data) setItems(data as Project[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function startEdit(p: Project) {
    setEditing(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      category: p.category,
      image_url: p.image_url,
      result: p.result,
      description: p.description,
      link: p.link,
      featured: p.featured,
      client_name: p.client_name,
      challenge: p.challenge,
      solution: p.solution,
      results: p.results,
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

  async function aiDraft() {
    if (!form.title.trim()) {
      setMsg("Add a title first — the AI drafts from it.");
      return;
    }
    setDrafting(true);
    setMsg("");
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, category: form.category, description: form.description })
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || "AI draft failed.");
        return;
      }
      setForm((f) => ({
        ...f,
        challenge: json.challenge ?? f.challenge,
        solution: json.solution ?? f.solution,
        results: json.results ?? f.results
      }));
      setMsg("✨ AI draft generated — review and tweak before saving.");
    } catch {
      setMsg("AI draft failed. Try again.");
    } finally {
      setDrafting(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) {
      setMsg("Title and slug are required.");
      return;
    }
    setBusy(true);
    setMsg("");
    const payload = {
      ...form,
      slug: form.slug.trim(),
      title: form.title.trim(),
      image_url: form.image_url?.trim() || null,
      result: form.result?.trim() || null,
      description: form.description?.trim() || null,
      link: form.link?.trim() || null,
      category: form.category?.trim() || null,
      client_name: form.client_name?.trim() || null,
      challenge: form.challenge?.trim() || null,
      solution: form.solution?.trim() || null,
      results: form.results?.trim() || null
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("projects").update(payload).eq("id", editing));
    } else {
      ({ error } = await supabase.from("projects").insert(payload));
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
    if (!confirm("Delete this project and its gallery?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      await load();
      bumpContentCache();
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Projects</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Case studies shown on /projects. Each one becomes a detail page.
          </p>
        </div>
        {editing && (
          <button className="btn btn-ghost btn-sm" onClick={reset}>
            <i className="fa-solid fa-xmark" /> Cancel
          </button>
        )}
      </div>

      <form className="admin-card" onSubmit={save}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>{editing ? "Edit project" : "Add project"}</h3>
          <button type="button" className="btn btn-outline btn-sm" onClick={aiDraft} disabled={drafting}>
            <i className="fa-solid fa-wand-magic-sparkles" /> {drafting ? "Drafting…" : "AI draft case study"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Veloura Living" />
          </div>
          <div className="field">
            <label>Slug</label>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="veloura-living" />
          </div>
          <div className="field">
            <label>Category</label>
            <input value={form.category ?? ""} onChange={(e) => set("category", e.target.value)} placeholder="Brand Identity" />
          </div>
          <div className="field">
            <label>Result (badge)</label>
            <input value={form.result ?? ""} onChange={(e) => set("result", e.target.value)} placeholder="+48% Recall" />
          </div>
          <div className="field">
            <label>Client name</label>
            <input value={form.client_name ?? ""} onChange={(e) => set("client_name", e.target.value)} placeholder="Veloura Living" />
          </div>
          <div className="field">
            <label>Link (external, optional)</label>
            <input value={form.link ?? ""} onChange={(e) => set("link", e.target.value)} placeholder="https://..." />
          </div>
          <div className="field">
            <label>Cover image</label>
            <ImageUpload
              value={form.image_url}
              folder="projects"
              onChange={(url) => set("image_url", url ?? "")}
            />
            <input
              value={form.image_url ?? ""}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="…or paste an image URL"
              style={{ marginTop: 8 }}
            />
          </div>
          <div className="field">
            <label>Display order</label>
            <input type="number" value={form.display_order} onChange={(e) => set("display_order", Number(e.target.value))} />
          </div>
        </div>

        <div className="field">
          <label>Description (card + SEO)</label>
          <textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} style={{ minHeight: 70 }} />
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: "var(--muted)", fontSize: 14 }}>
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
          Featured on the homepage
        </label>

        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Case-study narrative (shown on /projects/{form.slug || "slug"})</h4>
        <div className="field">
          <label>The Challenge</label>
          <textarea value={form.challenge ?? ""} onChange={(e) => set("challenge", e.target.value)} style={{ minHeight: 70 }} placeholder="What problem did the client have?" />
        </div>
        <div className="field">
          <label>The Approach</label>
          <textarea value={form.solution ?? ""} onChange={(e) => set("solution", e.target.value)} style={{ minHeight: 70 }} placeholder="How did you solve it?" />
        </div>
        <div className="field">
          <label>The Results</label>
          <textarea value={form.results ?? ""} onChange={(e) => set("results", e.target.value)} style={{ minHeight: 60 }} placeholder="Outcomes and metrics" />
        </div>

        {msg && <p style={{ color: "#ff8080", fontSize: 13, marginBottom: 10 }}>{msg}</p>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? "Saving..." : editing ? "Update Project" : "Add Project"}
        </button>

        {editing && (
          <div style={{ marginTop: 22, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Gallery</h4>
            <p style={{ color: "var(--muted)", fontSize: 12, marginBottom: 8 }}>
              Extra images shown on the case-study page after saving.
            </p>
            <GalleryManager projectId={editing} />
          </div>
        )}
      </form>

      <div className="admin-card" style={{ overflowX: "auto" }}>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Result</th>
                <th>Case study</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>
                    {p.featured && <span style={{ color: "var(--accent)", marginRight: 6 }}>★</span>}
                    {p.title}
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.category}</td>
                  <td><span className="badge-soft">{p.result}</span></td>
                  <td style={{ color: "var(--muted)" }}>
                    {p.challenge || p.solution || p.results ? (
                      <span style={{ color: "#22c55e" }}>yes</span>
                    ) : (
                      <span>no</span>
                    )}
                  </td>
                  <td style={{ color: "var(--muted)" }}>{p.display_order}</td>
                  <td>
                    <div className="row-actions">
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
                  <td colSpan={6} style={{ color: "var(--muted)" }}>No projects yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

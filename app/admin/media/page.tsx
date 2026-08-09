"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { MediaItem } from "@/lib/types";
import ImageUpload from "@/components/admin/ImageUpload";
import AdminToast from "@/components/admin/AdminToast";

export default function AdminMedia() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ text: string; type: "ok" | "err" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && data) setItems(data as MediaItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("media")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (mounted && !error && data) setItems(data as MediaItem[]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setToast({ text: "URL copied — paste it into any image field", type: "ok" });
    } catch {
      setToast({ text: "Couldn't copy — select the URL from the card below", type: "err" });
    }
  }

  async function remove(item: MediaItem) {
    if (!confirm("Delete this image from the library? (Files still referenced by projects/blog keep their URL.)")) return;
    const { error } = await supabase.from("media").delete().eq("id", item.id);
    if (error) {
      setToast({ text: error.message, type: "err" });
      return;
    }
    setItems((prev) => prev.filter((m) => m.id !== item.id));
    setToast({ text: "Removed from library", type: "ok" });
  }

  const filtered = query.trim()
    ? items.filter(
        (m) =>
          (m.filename ?? "").toLowerCase().includes(query.toLowerCase()) ||
          m.folder.toLowerCase().includes(query.toLowerCase()) ||
          m.url.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Media library</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Every image uploaded through the admin lands here. Upload once, then copy its URL into any
            project, blog post, service, or setting.
          </p>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Upload an image</h3>
        <ImageUpload
          value={null}
          folder="uploads"
          onChange={async (url) => {
            if (url) {
              setToast({ text: "Uploaded — refreshing the library", type: "ok" });
              await load();
            }
          }}
        />
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          Images are compressed automatically (≤250 KB target) and stored on Cloudinary.
        </p>
      </div>

      <div className="admin-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>All images ({filtered.length})</h3>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or folder…"
            style={{ maxWidth: 280 }}
            aria-label="Search media"
          />
        </div>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            {query.trim() ? "No images match your search." : "No uploads yet — add one above."}
          </p>
        ) : (
          <div className="admin-gallery-grid">
            {filtered.map((m) => (
              <div key={m.id} className="g-item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.filename ?? "Uploaded image"} className="g-thumb" loading="lazy" />
                <div className="g-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => copyUrl(m.url)} title="Copy URL">
                    <i className="fa-solid fa-link" />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(m)} title="Remove from library">
                    <i className="fa-solid fa-trash" />
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    padding: "6px 8px 8px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  title={m.filename ?? m.url}
                >
                  {m.filename ?? m.url}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminToast message={toast?.text ?? ""} type={toast?.type ?? "ok"} onClear={() => setToast(null)} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { ProjectImage } from "@/lib/types";
import { compressImage } from "@/lib/image-compressor";

export default function GalleryManager({ projectId }: { projectId: string }) {
  const [images, setImages] = useState<ProjectImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const { data } = await supabase
      .from("project_images")
      .select("*")
      .eq("project_id", projectId)
      .order("display_order", { ascending: true });
    if (data) setImages(data as ProjectImage[]);
  }

  useEffect(() => {
    if (!projectId) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("project_images")
        .select("*")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });
      if (mounted && data) setImages(data as ProjectImage[]);
    })();
    return () => {
      mounted = false;
    };
  }, [projectId]);

  async function addFiles(files: FileList | null) {
    if (!files || files.length === 0 || !projectId) return;
    setUploading(true);
    setError("");
    let i = 0;
    try {
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append("file", compressed, `gallery-${Date.now()}-${compressed.name.replace(/\s+/g, "-")}`);
        fd.append("folder", "projects/gallery");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        const { error: insErr } = await supabase.from("project_images").insert({
          project_id: projectId,
          image_url: json.secure_url as string,
          display_order: images.length + i
        });
        if (insErr) throw new Error(insErr.message);
        i++;
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this image?")) return;
    await supabase.from("project_images").delete().eq("id", id);
    await load();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = images.findIndex((x) => x.id === id);
    const other = images[idx + dir];
    if (!other) return;
    await supabase.from("project_images").update({ display_order: other.display_order }).eq("id", id);
    await supabase.from("project_images").update({ display_order: images[idx].display_order }).eq("id", other.id);
    await load();
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
          <i className="fa-solid fa-images" /> {uploading ? "Uploading…" : "Add gallery images"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          Auto-compressed to ≤ 250 KB (WebP)
        </span>
      </div>
      {error && <p style={{ color: "#ff8080", fontSize: 12, marginTop: 8 }}>{error}</p>}

      {images.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 12,
            marginTop: 14
          }}
        >
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                position: "relative"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt={img.alt_text ?? ""} style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
              <div style={{ display: "flex", gap: 4, padding: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => move(img.id, -1)} aria-label="Move earlier">
                  ←
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => move(img.id, 1)} aria-label="Move later">
                  →
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(img.id)} aria-label="Delete image">
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

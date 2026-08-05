"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-compressor";

export default function ImageUpload({
  value,
  onChange,
  folder = "misc"
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    setError("");
    setNote("");
    try {
      const beforeKB = file.size / 1024;
      const compressed = await compressImage(file);
      const afterKB = compressed.size / 1024;
      const savedPct =
        beforeKB > 0 ? Math.max(0, Math.round((1 - afterKB / beforeKB) * 100)) : 0;
      setNote(
        `Optimized: ${Math.round(beforeKB).toLocaleString()} KB → ${Math.round(afterKB).toLocaleString()} KB (target ≤ 250 KB)` +
          (savedPct > 0 ? ` — ${savedPct}% smaller` : " — already optimized")
      );

      const path = `${folder}/${Date.now()}-${compressed.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("project-images").upload(path, compressed, {
        cacheControl: "3600",
        upsert: false
      });
      if (error) {
        setError(error.message + " — you can still paste an image URL below.");
        return;
      }
      const { data } = supabase.storage.from("project-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setError("Could not process that image. Try a different file or paste a URL.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
          <i className="fa-solid fa-upload" /> {uploading ? "Uploading…" : "Upload image"}
          <input type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </label>
        {value && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange(null)}>
            <i className="fa-solid fa-trash" /> Remove
          </button>
        )}
      </div>
      {note && <p style={{ color: "var(--accent)", fontSize: 12, marginTop: 8 }}>{note}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="preview"
          style={{ width: 120, height: 80, objectFit: "cover", borderRadius: 10, marginTop: 10, display: "block", border: "1px solid var(--border)" }}
        />
      )}
      {error && <p style={{ color: "#ff8080", fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}

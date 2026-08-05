"use client";

import { useState } from "react";
import { compressImage } from "@/lib/image-compressor";

/**
 * Multi-file image uploader (compresses each file client-side, uploads to
 * Cloudinary, and reports URLs upward). Used for buffering gallery images on
 * projects that don't have an id yet.
 */
export default function MultiImageUpload({
  urls,
  onChange,
  folder = "misc"
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = "";
    setUploading(true);
    setError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        const fd = new FormData();
        fd.append("file", compressed, `gallery-${Date.now()}-${compressed.name.replace(/\s+/g, "-")}`);
        fd.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        uploaded.push(json.secure_url as string);
      }
      onChange([...urls, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "One or more images failed to upload.");
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    onChange(urls.filter((u) => u !== url));
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
          <i className="fa-solid fa-images" /> {uploading ? "Uploading…" : "Add multiple images"}
          <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
        </label>
        {urls.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {urls.length} image{urls.length > 1 ? "s" : ""} ready
          </span>
        )}
      </div>
      {error && <p style={{ color: "#ff8080", fontSize: 12, marginTop: 8 }}>{error}</p>}

      {urls.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 12,
            marginTop: 14
          }}
        >
          {urls.map((url) => (
            <div
              key={url}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
                position: "relative"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
              <button
                className="btn btn-danger btn-sm"
                onClick={() => remove(url)}
                aria-label="Remove image"
                style={{ position: "absolute", top: 6, right: 6, padding: "4px 8px" }}
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

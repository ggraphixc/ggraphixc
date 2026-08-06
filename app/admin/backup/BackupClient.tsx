"use client";

import { useRef, useState } from "react";
import { exportBackup, restoreBackup } from "@/app/actions/backup";

type Props = {
  initialCounts: Record<string, number>;
  labels: Record<string, string>;
};

type Status = { type: "ok" | "err"; text: string } | null;

export default function BackupClient({ initialCounts, labels }: Props) {
  const [counts, setCounts] = useState(initialCounts);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [preview, setPreview] = useState<Record<string, number> | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const downloadRef = useRef<HTMLAnchorElement | null>(null);

  async function onExport() {
    setBusy(true);
    setStatus(null);
    const res = await exportBackup();
    setBusy(false);
    if (!res.ok || !res.data) {
      setStatus({ type: "err", text: res.message });
      return;
    }
    const blob = new Blob([res.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    if (downloadRef.current) {
      downloadRef.current.href = url;
      downloadRef.current.download = `ggraphixc-backup-${new Date().toISOString().slice(0, 10)}.json`;
      downloadRef.current.click();
    }
    URL.revokeObjectURL(url);
    setStatus({ type: "ok", text: "Backup downloaded. Keep it somewhere safe — it contains everything in the admin." });
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    setStatus(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const tables = parsed?.tables;
        if (typeof tables !== "object" || tables === null) {
          setStatus({ type: "err", text: "That doesn't look like a ggraphixc backup file." });
          return;
        }
        const previewCounts: Record<string, number> = {};
        for (const [k, v] of Object.entries(tables)) {
          if (Array.isArray(v)) previewCounts[k] = v.length;
        }
        setPreview(previewCounts);
      } catch {
        setStatus({ type: "err", text: "Couldn't read that file — it isn't valid JSON." });
      }
    };
    reader.readAsText(file);
  }

  async function onRestore() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (!confirm("Restore this backup? It will overwrite matching rows and add missing ones in every content table. There's no undo — export a fresh backup first if you're unsure.")) return;
    setBusy(true);
    setStatus(null);
    const text = await file.text();
    const res = await restoreBackup(text);
    setBusy(false);
    if (res.ok && res.tables) {
      setCounts(res.tables);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setFileName("");
    }
    setStatus({ type: res.ok ? "ok" : "err", text: res.message });
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Backup &amp; restore</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            One-click JSON backup of every content table — your insurance against accidental edits or deletions.
          </p>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Current content</h3>
        <div className="admin-gallery-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {Object.entries(labels).map(([key, label]) => (
            <div key={key} className="g-item" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, var(--accent), var(--royal))", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {counts[key] ?? 0}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Export backup</h3>
        <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 14, lineHeight: 1.6 }}>
          Downloads projects, gallery images, blog posts, testimonials, clients, FAQs, messages and settings as one
          JSON file. Includes every field — ids included, so a restore keeps links intact.
        </p>
        <button className="btn btn-primary btn-sm" onClick={onExport} disabled={busy}>
          <i className="fa-solid fa-download" style={{ marginRight: 6 }} />
          {busy ? "Preparing…" : "Download full backup"}
        </button>
      </div>

      <div className="admin-card">
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Restore from backup</h3>
        <p style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 14, lineHeight: 1.6 }}>
          Pick a previously exported file. It updates existing rows and adds missing ones — it never deletes content
          that isn&apos;t in the backup. Content is upserted by id, so project galleries keep their links.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          style={{ marginBottom: 14, fontSize: 13.5, color: "var(--muted)", maxWidth: 420 }}
        />
        {fileName && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
            <i className="fa-solid fa-file-circle-check" style={{ marginRight: 6, color: "var(--accent)" }} />
            {fileName}
          </p>
        )}
        {preview && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>This backup contains:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(preview)
                .filter(([, n]) => n > 0)
                .map(([k, n]) => (
                  <span key={k} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 999, background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                    {labels[k] ?? k}: <strong style={{ color: "var(--text)" }}>{n}</strong>
                  </span>
                ))}
            </div>
          </div>
        )}
        <button className="btn btn-danger btn-sm" onClick={onRestore} disabled={busy || !preview}>
          <i className="fa-solid fa-rotate-left" style={{ marginRight: 6 }} />
          {busy ? "Restoring…" : "Restore this backup"}
        </button>
      </div>

      {status && (
        <p style={{ marginTop: 12, fontSize: 13.5, color: status.type === "ok" ? "var(--accent)" : "#ff8080" }}>{status.text}</p>
      )}

      <a ref={downloadRef} style={{ display: "none" }} aria-hidden="true" tabIndex={-1} />
    </>
  );
}

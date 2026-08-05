"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { SiteSetting } from "@/lib/types";
import { bumpContentCache } from "@/components/admin/cacheBump";
import { DEFAULT_SETTINGS, SETTING_FIELD_LABELS } from "@/lib/site-settings";

type SettingsMap = Record<string, string>;

const DEFAULTS: SettingsMap = { ...DEFAULT_SETTINGS };

const FIELD_LABELS = SETTING_FIELD_LABELS;

export default function AdminSettings() {
  const [form, setForm] = useState<SettingsMap>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (mounted && !error && data) {
        const map: SettingsMap = { ...DEFAULTS };
        (data as SiteSetting[]).forEach((s) => (map[s.key] = s.value));
        setForm(map);
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const rows = Object.entries(form).map(([key, value]) => ({
      key,
      value: value.trim()
    }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setBusy(false);
    if (error) {
      setMsg({ type: "err", text: error.message });
      return;
    }
    setMsg({ type: "ok", text: "Settings saved — the public site has been updated." });
    bumpContentCache();
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Settings</h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            Site copy shown on the homepage, about section, and footer.
          </p>
        </div>
      </div>

      <form className="admin-card" onSubmit={save}>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14 }}>Site content</h3>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <div className="admin-form-grid">
            {FIELD_LABELS.map(([key, label, hint], i) => {
              const isSecret = key === "google_api_key";
              return (
                <div key={key} className="field">
                  <label>{label}</label>
                  <input
                    type={isSecret ? "password" : "text"}
                    value={form[key] ?? ""}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={isSecret ? "Paste your Google AI key…" : hint}
                    autoComplete={isSecret ? "off" : undefined}
                    style={i >= 3 ? { fontWeight: 700 } : undefined}
                  />
                  <span style={{ fontSize: 11, color: "var(--muted)", marginTop: -6 }}>{hint}</span>
                </div>
              );
            })}
          </div>
        )}

        {msg && (
          <p style={{ marginBottom: 12, fontSize: 13, color: msg.type === "ok" ? "var(--accent)" : "#ff8080" }}>
            {msg.text}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || loading}>
          {busy ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </>
  );
}

"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { getServiceSupabase } from "@/lib/supabase/server";

export type BackupResult = { ok: boolean; message: string; tables?: Record<string, number> };

// Content tables, in dependency order (parents before children so foreign keys
// resolve on restore). Analytics, subscribers and broadcast jobs are excluded —
// they're operational data, not content.
const CONTENT_TABLES = [
  "projects",
  "project_images",
  "blog_posts",
  "testimonials",
  "clients",
  "faqs",
  "inquiries",
  "site_settings"
] as const;

const MAX_JSON_BYTES = 15 * 1024 * 1024;

function parseBackup(json: string): Record<string, unknown[]> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;
  const tables = obj.tables;
  if (typeof tables !== "object" || tables === null || Array.isArray(tables)) return null;
  for (const name of CONTENT_TABLES) {
    const rows = (tables as Record<string, unknown>)[name];
    if (rows !== undefined && !Array.isArray(rows)) return null;
  }
  return tables as Record<string, unknown[]>;
}

/** Download a full JSON backup of every content table. */
export async function exportBackup(): Promise<{ ok: boolean; message: string; data?: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Unauthorized — sign in to the admin portal and try again." };
  }
  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return { ok: false, message: "Supabase isn't connected on this deployment." };
  }

  const tables: Record<string, unknown[]> = {};
  const skipped: string[] = [];
  for (const name of CONTENT_TABLES) {
    // No .order(): not every table has created_at (site_settings has only
    // updated_at), and backup completeness doesn't depend on row order.
    const { data, error } = await sb.from(name).select("*");
    if (error) {
      skipped.push(`${name} (${error.message})`);
      continue;
    }
    tables[name] = (data ?? []) as unknown[];
  }

  const payload = {
    app: "ggraphixc",
    version: 1,
    exported_at: new Date().toISOString(),
    tables
  };

  if (skipped.length > 0) {
    return {
      ok: false,
      message: `Backup incomplete — couldn't read: ${skipped.join(", ")}. Nothing was downloaded.`
    };
  }
  return { ok: true, message: "Backup ready.", data: JSON.stringify(payload, null, 2) };
}

/**
 * Restore a backup: validates the shape, then upserts every table in
 * dependency order (ids are preserved, so references like project_images →
 * projects keep working). Skips empty tables.
 */
export async function restoreBackup(json: string): Promise<BackupResult> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Unauthorized — sign in to the admin portal and try again." };
  }
  if (Buffer.byteLength(json, "utf8") > MAX_JSON_BYTES) {
    return { ok: false, message: "Backup file is too large (max 15 MB)." };
  }
  const tables = parseBackup(json);
  if (!tables) {
    return { ok: false, message: "That doesn't look like a ggraphixc backup file." };
  }

  let sb;
  try {
    sb = getServiceSupabase();
  } catch {
    return { ok: false, message: "Supabase isn't connected on this deployment." };
  }

  const counts: Record<string, number> = {};
  const failures: string[] = [];
  for (const name of CONTENT_TABLES) {
    const rows = tables[name];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const { error } = await sb.from(name).upsert(rows, { onConflict: "id" });
    if (error) {
      failures.push(`${name}: ${error.message}`);
      continue;
    }
    counts[name] = rows.length;
  }

  const restored = Object.values(counts).reduce((a, b) => a + b, 0);
  if (failures.length > 0) {
    return {
      ok: false,
      message: `Restored ${restored} rows, but ${failures.length} table${failures.length === 1 ? "" : "s"} failed: ${failures.join("; ")}. Rows already in the database keep their existing ids.`,
      tables: counts
    };
  }
  return {
    ok: true,
    message: `Restored ${restored} rows across ${Object.keys(counts).length} tables. Everything matches the backup — refresh the admin pages to see it.`,
    tables: counts
  };
}

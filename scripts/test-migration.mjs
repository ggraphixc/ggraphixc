// Ground-truth test: run the ENTIRE migration in PGlite after creating the
// Supabase-specific pieces it references (roles + storage schema/bucket table).
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const sql = readFileSync("supabase/migrations/20260805142043_initial_schema.sql", "utf8");

const db = new PGlite();
await db.waitReady;

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean not null default false);
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text not null,
    name text not null default ''
  );
`);

try {
  await db.exec(sql);
  const tables = await db.query(
    "select tablename from pg_tables where schemaname = 'public' order by tablename"
  );
  const counts = {};
  for (const t of tables.rows) {
    const r = await db.query(`select count(*)::int as n from public."${t.tablename}"`);
    counts[t.tablename] = r.rows[0].n;
  }
  console.log("ALL STATEMENTS EXECUTED OK");
  console.log("tables:", tables.rows.map((r) => r.tablename).join(", "));
  console.log("row counts:", JSON.stringify(counts));
} catch (e) {
  const msg = String(e.message);
  console.log("ERROR:", msg.split("\n").slice(0, 3).join(" | "));
  const lines = sql.split("\n");
  const lineMatch = msg.match(/line (\d+)/);
  if (lineMatch) {
    const n = Number(lineMatch[1]);
    console.log(`\nContext around line ${n}:`);
    for (let i = Math.max(0, n - 3); i < Math.min(lines.length, n + 2); i++) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
  process.exit(1);
}

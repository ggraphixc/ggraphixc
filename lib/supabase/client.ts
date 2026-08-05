import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Avoid crashing in environments where env vars are not yet set.
  console.warn("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Browser-side client via @supabase/ssr: persists the session in cookies so the
// server-side proxy (proxy.ts) can validate it on protected routes. Using the
// plain supabase-js client here stores the session in localStorage instead,
// which the proxy can't see — logging in would bounce you straight back out.
export const supabase: SupabaseClient = createBrowserClient(
  supabaseUrl ?? "http://localhost:54321",
  supabaseAnonKey ?? "public-anon-key"
);

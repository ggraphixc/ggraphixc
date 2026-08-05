import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Avoid crashing in environments where env vars are not yet set.
  console.warn("[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Browser-side client (safe: uses the anon key, subject to RLS).
export const supabase: SupabaseClient = createClient(
  supabaseUrl ?? "http://localhost:54321",
  supabaseAnonKey ?? "public-anon-key"
);

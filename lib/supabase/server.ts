import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

// Server-only client with the service role key (bypasses RLS). Use exclusively in
// server components / route handlers for trusted operations (e.g. contact form writes).
export function getServiceSupabase(): SupabaseClient {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service-role credentials (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Gate for privileged admin actions (broadcasts, subscriber management, …).
 * Mirrors the API-route guard (app/api/revalidate, upload, ai/draft): read the
 * session cookie with @supabase/ssr and validate the JWT server-side. Demo
 * mode (no Supabase env vars) is allowed only outside production — in
 * production, an unconfigured auth would leave privileged endpoints open.
 */
export async function requireAdmin(): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return process.env.NODE_ENV !== "production";
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    });
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return Boolean(user);
  } catch {
    return false;
  }
}

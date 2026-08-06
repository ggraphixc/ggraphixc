import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { resetKnowledgeCache } from "@/app/api/ai/concierge/route";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Fired by the admin portal after mutations so ISR pages re-render immediately.
// Protected: only a logged-in admin session can purge.
export async function GET() {
  // Demo mode (no Supabase configured): nothing to invalidate.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {}
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Revalidate the whole site under the root layout (home, projects, blog, …).
  revalidatePath("/", "layout");
  // Drop the concierge's portfolio cache so admin edits answer correctly next ask.
  resetKnowledgeCache();
  return NextResponse.json({ ok: true });
}

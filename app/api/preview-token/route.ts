import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { signPreview } from "@/lib/preview-link";

// Mint a signed draft-preview link. Admin-guarded so only someone logged into
// the portal can open unpublished content (RLS already hides drafts publicly).
export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const slug = searchParams.get("slug");
  if (kind !== "blog" && kind !== "project") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9-_.]+$/i.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const token = signPreview(`${kind}:${slug}`);
  return NextResponse.json({ url: `${base}/preview/${kind}/${slug}?t=${token}` });
}

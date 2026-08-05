import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getCloudinary } from "@/lib/cloudinary";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Receives a (client-side compressed) image as FormData and stores it on
// Cloudinary, returning the public secure_url to persist in the database.
//
// Auth mirrors /api/revalidate: when Supabase is configured (production), only a
// logged-in admin session may upload. In demo mode (no Supabase env vars) the
// guard is skipped — so do not deploy the site publicly without Supabase keys,
// otherwise this endpoint would accept anonymous uploads to your Cloudinary.
export async function POST(req: Request) {
  if (supabaseUrl && supabaseAnonKey) {
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
  }

  let cld;
  try {
    cld = getCloudinary();
  } catch {
    return NextResponse.json(
      { error: "Cloudinary is not configured — add CLOUDINARY_URL to .env.local" },
      { status: 500 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be between 1 byte and 10 MB" }, { status: 400 });
  }

  // Client-suggested folder is sanitized before use (nested paths allowed,
  // no leading slash, no traversal, capped length).
  const rawFolder = String(form.get("folder") ?? "uploads");
  const folder =
    "ggraphixc/" +
    rawFolder.replace(/[^a-z0-9-_/]/gi, "").replace(/^\/+/g, "").replace(/\/+$/g, "").slice(0, 80);

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cld.uploader.upload_stream(
        { folder, resource_type: "image" },
        (err, res) => (err ? reject(err) : resolve(res as { secure_url: string }))
      );
      stream.end(buffer);
    });
    return NextResponse.json({ secure_url: result.secure_url });
  } catch (e) {
    console.error("[cloudinary] upload failed", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

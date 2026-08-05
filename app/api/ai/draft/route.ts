import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callGemini, extractJson, type GeminiPart } from "@/lib/gemini";

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Fetch images (cover + gallery, already client-compressed) and turn them into
 * inline Gemini parts. Fails soft: unreachable/non-image files are skipped.
 */
async function imageParts(urls: string[]): Promise<GeminiPart[]> {
  const parts: GeminiPart[] = [];
  for (const url of urls.slice(0, MAX_IMAGES)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) continue;
      const mime = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
      if (!mime.startsWith("image/")) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) continue;
      parts.push({ inlineData: { mimeType: mime, data: buf.toString("base64") } });
    } catch {
      // skip unreadable image
    }
  }
  return parts;
}

export async function POST(request: Request) {
  // Admin-only: this endpoint spends Gemini tokens.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
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

  let body: { title?: string; category?: string; description?: string; imageUrls?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Give the project a title first." }, { status: 400 });
  }

  const images = await imageParts(Array.isArray(body.imageUrls) ? body.imageUrls : []);

  const prompt = `Write a short case-study narrative for a design project.

Project title: ${title}
Category: ${String(body.category ?? "").trim() || "—"}
Summary: ${String(body.description ?? "").trim() || "—"}

${images.length > 0 ? "Reference images of the actual work are attached — describe the visuals you can see (style, colors, layout, mood) so the case study matches the real output.\n" : ""}

Return ONLY JSON with exactly these three keys:
- "challenge": 2-3 sentences describing the client's problem.
- "solution": 2-3 sentences describing the design approach and deliverables.
- "results": 1-2 sentences describing the outcome with a plausible, specific metric.
Voice: confident, concise, no buzzwords, no marketing fluff.`;

  const result = await callGemini({
    system: "You are a senior design case-study copywriter.",
    contents: [{ role: "user", parts: [{ text: prompt }, ...images] }],
    temperature: 0.7,
    maxOutputTokens: 700,
    responseMimeType: "application/json"
  });

  if ("error" in result) {
    console.error("[ai/draft] failed:", result.error);
    return NextResponse.json(
      { error: `The AI draft failed. ${result.error}` },
      { status: 500 }
    );
  }

  const parsed = extractJson<{ challenge?: unknown; solution?: unknown; results?: unknown }>(result.text);
  if (
    !parsed ||
    typeof parsed.challenge !== "string" ||
    typeof parsed.solution !== "string" ||
    typeof parsed.results !== "string"
  ) {
    console.error("[ai/draft] unexpected shape:", result.text.slice(0, 300));
    return NextResponse.json(
      { error: "The AI draft failed. Unexpected response shape." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    challenge: parsed.challenge,
    solution: parsed.solution,
    results: parsed.results
  });
}

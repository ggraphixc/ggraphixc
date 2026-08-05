import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";

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

  let body: { title?: string; category?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Give the project a title first." }, { status: 400 });
  }

  const prompt = `Write a short case-study narrative for a design project.

Project title: ${title}
Category: ${String(body.category ?? "").trim() || "—"}
Summary: ${String(body.description ?? "").trim() || "—"}

Return ONLY JSON with exactly these three keys:
- "challenge": 2-3 sentences describing the client's problem.
- "solution": 2-3 sentences describing the design approach and deliverables.
- "results": 1-2 sentences describing the outcome with a plausible, specific metric.
Voice: confident, concise, no buzzwords, no marketing fluff.`;

  const result = await callGemini({
    system: "You are a senior design case-study copywriter.",
    contents: [{ role: "user", parts: prompt }],
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

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getGoogleApiKey } from "@/lib/data";

const MODEL = "gemini-2.5-flash";

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

  const apiKey = await getGoogleApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google AI key is not configured — add it in Admin → Settings, or to .env.local." },
      { status: 400 }
    );
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

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "You are a senior design case-study copywriter." }]
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 700,
            responseMimeType: "application/json"
          }
        })
      }
    );
    if (!res.ok) throw new Error(`Gemini responded ${res.status}`);
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = JSON.parse(text);
    if (typeof parsed.challenge !== "string" || typeof parsed.solution !== "string" || typeof parsed.results !== "string") {
      throw new Error("Unexpected shape");
    }
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "The AI draft failed. Try again, or write it by hand." }, { status: 500 });
  }
}

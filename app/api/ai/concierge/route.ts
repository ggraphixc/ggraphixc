import { NextResponse } from "next/server";
import { getGoogleApiKey } from "@/lib/data";

const MODEL = "gemini-flash-latest";

const SYSTEM_PROMPT = `You are the friendly project concierge for ggraphixc — the design studio of Godson Otobo, a graphics designer.

What ggraphixc does: brand identity, creative systems, logo design, packaging, social media kits, campaign visual direction, web/UI design, and motion graphics.

Your job: help prospective clients decide whether to reach out, and steer them toward the contact form at /contact. Answer questions about services, process (brief → moodboard → concepts → refinement → handoff), typical timelines (identity systems usually 2-4 weeks, social kits 1-2 weeks), and pricing ranges (rough: brand identity $1k-$5k+, social kits $1k-$3k, full campaigns $5k+). Be warm, concise (2-4 sentences), and never invent specific facts or portfolio claims. If asked something you don't know, say so and suggest emailing hello@ggraphixc.com. Always end by nudging them to start a project via the contact form.`;

// Per-IP in-memory rate limit: 15 requests / minute. Enough for a portfolio site.
const buckets = new Map<string, number[]>();

function rateLimit(ip: string): boolean {
  // Bound the map so rotating IPs can't grow memory without limit.
  if (buckets.size > 1000) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (buckets.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= 15) {
    buckets.set(ip, recent);
    return false;
  }
  recent.push(now);
  buckets.set(ip, recent);
  return true;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: "Slow down — one message at a time 🙂" }, { status: 429 });
  }

  let body: { messages?: { role: string; parts: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

  const apiKey = await getGoogleApiKey();
  if (!apiKey) {
    return NextResponse.json({
      offline: true,
      reply:
        "I'm offline right now — the AI key isn't configured yet. Add it in Admin → Settings, or email hello@ggraphixc.com and Godson will get back to you within 24 hours."
    });
  }

  const contents = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.parts }]
  }));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 512 }
        })
      }
    );
    if (!res.ok) throw new Error(`Gemini responded ${res.status}`);
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return NextResponse.json({
      reply:
        text ||
        "I couldn't quite process that. Could you rephrase, or email hello@ggraphixc.com?"
    });
  } catch {
    return NextResponse.json({
      reply: "Hmm, I hit a technical snag. Email hello@ggraphixc.com instead and I'll get right back to you."
    });
  }
}

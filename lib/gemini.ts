import { getGoogleApiKey } from "@/lib/data";

/**
 * Server-only Gemini caller with model fallback + retry.
 *
 * Stable aliases (e.g. `gemini-flash-latest`) get overloaded (503) and retired
 * model pins return 404, so try a small list in order and retry transient
 * failures (429/500/503) with backoff before giving up.
 */
const MODELS = ["gemini-flash-latest", "gemini-3-flash-preview"];
const ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type GeminiCall = {
  system?: string;
  contents: { role: "user" | "model"; parts: string }[];
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
};

export type GeminiResult = { text: string } | { error: string };

export async function callGemini(opts: GeminiCall): Promise<GeminiResult> {
  const apiKey = await getGoogleApiKey();
  if (!apiKey) {
    return { error: "Google AI key is not configured — add it in Admin → Settings, or to .env.local." };
  }

  let lastError = "No model responded";

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: opts.system ? { parts: [{ text: opts.system }] } : undefined,
              contents: opts.contents,
              generationConfig: {
                temperature: opts.temperature ?? 0.7,
                maxOutputTokens: opts.maxOutputTokens ?? 700,
                responseMimeType: opts.responseMimeType ?? "text/plain"
              }
            })
          }
        );

        if (res.ok) {
          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text.trim()) return { text };
          lastError = "Empty response from model";
        } else {
          const body = await res.text();
          lastError = `Gemini responded ${res.status}: ${body.slice(0, 200)}`;
          if (res.status === 429 || res.status === 500 || res.status === 503) {
            // Transient — retry this model, then fall through to the next.
            await sleep(attempt * 800);
            continue;
          }
          // Permanent (400/403/404): stop retrying this model.
          break;
        }
      } catch (e) {
        lastError = e instanceof Error ? e.message : "Unknown network error";
        await sleep(attempt * 500);
      }
    }
  }

  return { error: lastError };
}

/**
 * Gemini is not always strict about `responseMimeType: application/json` —
 * strip markdown fences and take the first balanced JSON object if needed.
 */
export function extractJson<T = unknown>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

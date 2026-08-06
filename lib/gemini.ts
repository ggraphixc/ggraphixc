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

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export type GeminiContent = {
  role: "user" | "model";
  // A plain string is normalized to [{ text }] before sending — the API
  // rejects a bare string at contents[].parts.
  parts: GeminiPart[] | string;
};

export type GeminiCall = {
  system?: string;
  contents: GeminiContent[];
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "application/json" | "text/plain";
  /**
   * Thinking budget for reasoning models (gemini-3-flash, …). Set 0 for
   * simple drafting tasks: the model can't spend tokens on chain-of-thought,
   * so the answer isn't truncated mid-JSON. Omit to keep the default.
   */
  thinkingBudget?: number;
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
              contents: opts.contents.map((c) => ({
                role: c.role,
                parts: Array.isArray(c.parts) ? c.parts : [{ text: c.parts }]
              })),
              generationConfig: {
                temperature: opts.temperature ?? 0.7,
                maxOutputTokens: opts.maxOutputTokens ?? 700,
                responseMimeType: opts.responseMimeType ?? "text/plain",
                // Reasoning models default to spending the budget on thinking,
                // which truncates the answer — drafting callers opt out.
                ...(opts.thinkingBudget !== undefined
                  ? { thinkingConfig: { thinkingBudget: opts.thinkingBudget } }
                  : {})
              }
            })
          }
        );

        if (res.ok) {
          const json = await res.json();
          // Reasoning models (e.g. gemini-flash-latest aliasing a thinking
          // model) return their chain-of-thought as parts with `thought: true`
          // BEFORE the answer — parts[0] would be the thinking, not the reply.
          // Filter those out and join the actual answer parts.
          const parts: { text?: string; thought?: boolean }[] =
            json?.candidates?.[0]?.content?.parts ?? [];
          const text = parts
            .filter((p) => !p.thought && typeof p.text === "string")
            .map((p) => p.text as string)
            .join("\n");
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
 * Also repairs the most common defect: literal (unescaped) newlines inside
 * string values, which make JSON.parse throw.
 */
export function extractJson<T = unknown>(text: string): T | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    /* fall through to repair */
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  const candidate = escapeNewlinesInJson(cleaned.slice(start, end + 1));
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

/** Escape unescaped \n/\r characters that appear inside JSON string values. */
function escapeNewlinesInJson(json: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (inString) {
      if (ch === "\\") {
        out += ch + (json[i + 1] ?? "");
        i++;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }
      if (ch === "\r") {
        out += "\\n";
        if (json[i + 1] === "\n") i++; // consume the LF so we emit a single newline
        continue;
      }
      if (ch === "\n") {
        out += "\\n";
        continue;
      }
      out += ch;
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out;
}

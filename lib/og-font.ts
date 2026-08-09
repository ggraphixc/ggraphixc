import fs from "node:fs";
import path from "node:path";

// Manrope is bundled locally (lib/fonts/manrope-{700,800}.woff) so the
// opengraph images NEVER depend on the network at build/prerender time — a
// transient Google Fonts fetch failure used to produce `fonts: []`, which
// crashes Satori with "No fonts are loaded" and breaks the whole build.
// If the local file is somehow missing (e.g. a custom deployment without the
// repo assets), fall back to fetching from Google Fonts with retries.
const CACHE: Record<string, ArrayBuffer | null> = {};

export async function loadOgFont(weight: 700 | 800 = 800): Promise<ArrayBuffer | null> {
  const key = `manrope-${weight}`;
  if (key in CACHE) return CACHE[key];

  let data: ArrayBuffer | null = null;

  // 1) Bundled font — always available, zero network.
  try {
    const p = path.join(process.cwd(), "lib", "fonts", `manrope-${weight}.woff`);
    const buf = fs.readFileSync(p);
    data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  } catch {
    data = null;
  }

  // 2) Fallback: fetch from Google Fonts (3 attempts).
  if (!data) {
    for (let i = 0; i < 3; i++) {
      try {
        const css = await fetch(
          `https://fonts.googleapis.com/css2?family=Manrope:wght@${weight}&display=swap`
        ).then((r) => r.text());
        const url = css.match(/url\((https:\/\/[^)]+\.woff2?)\)/)?.[1];
        if (url) {
          data = await fetch(url).then((r) => r.arrayBuffer());
          if (data) break;
        }
      } catch {
        // transient — retry
      }
    }
  }

  CACHE[key] = data;
  return data;
}

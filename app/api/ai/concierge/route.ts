import { NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini";
import { getSettings, getProjects, getTestimonials, getFaqs, getPublishedBlog } from "@/lib/data";

// Shape of the project cards the widget renders under each answer.
export type RecommendedProject = {
  title: string;
  slug: string;
  result?: string | null;
  image_url?: string | null;
};

const truncate = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1)}…` : s;

/**
 * Build a compact, bounded fact sheet from the live portfolio so the concierge
 * answers from real content (projects, testimonials, FAQs) instead of generic
 * copy. Every list is capped so the system prompt stays small and cheap.
 */
function buildKnowledge(): string {
  const parts: string[] = [];
  const MAX = 12;
  const projects = projectsCache;
  if (projects.length > 0) {
    const rows = projects
      .slice(0, MAX)
      .map(
        (p) =>
          `- ${p.title} (${p.category || "Design"})${p.result ? ` — ${p.result}` : ""}: ${truncate(p.description || "", 140)}`
      )
      .join("\n");
    parts.push(`Real portfolio projects:\n${rows}`);
  }
  const testimonials = testimonialsCache;
  if (testimonials.length > 0) {
    const rows = testimonials
      .slice(0, 4)
      .map((t) => `- "${truncate(t.quote || "", 160)}" — ${t.name || "Client"}${t.role ? `, ${t.role}` : ""}`)
      .join("\n");
    parts.push(`Client testimonials:\n${rows}`);
  }
  const faqs = faqsCache;
  if (faqs.length > 0) {
    const rows = faqs
      .slice(0, 8)
      .map((f) => `- Q: ${truncate(f.question || "", 120)}\n  A: ${truncate(f.answer || "", 200)}`)
      .join("\n");
    parts.push(`Official FAQ:\n${rows}`);
  }
  const posts = blogCache;
  if (posts.length > 0) {
    const rows = posts
      .slice(0, 6)
      .map((b) => `- ${b.title} (/blog/${b.slug})${b.excerpt ? `: ${truncate(b.excerpt, 120)}` : ""}`)
      .join("\n");
    parts.push(`Blog articles to recommend:\n${rows}`);
  }
  return parts.join("\n\n");
}

/**
 * Pick up to 3 projects the visitor is likely asking about, by scoring the
 * last user message against each project's title, category, description, and
 * client name. Falls back to the highest-priority projects so the card row is
 * never empty. Returns the lightweight shape the widget renders.
 */
function recommendProjects(message: string): RecommendedProject[] {
  const q = (message || "").toLowerCase();
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  const scored = projectsCache
    .map((p) => {
      const hay = `${p.title} ${p.category || ""} ${p.description || ""} ${p.client_name || ""}`.toLowerCase();
      let score = 0;
      if (q.length > 4 && hay.includes(q)) score += 3;
      for (const w of words) if (hay.includes(w)) score += 1;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || a.p.display_order - b.p.display_order);
  const matches = scored.filter((s) => s.score > 0).slice(0, 3);
  const picks = (matches.length > 0 ? matches : scored.slice(0, 3)).filter(
    ({ p }) => p.slug
  );
  return picks.map(({ p }) => ({
    title: p.title,
    slug: p.slug,
    result: p.result,
    image_url: p.image_url
  }));
}

// Module-level caches refreshed once per server instance. Portfolio data is
// edited in the admin, not per-request, so a 10-minute refresh is plenty. The
// /api/revalidate endpoint resets these when admin content is published.
let projectsCache: Awaited<ReturnType<typeof getProjects>> = [];
let testimonialsCache: Awaited<ReturnType<typeof getTestimonials>> = [];
let faqsCache: Awaited<ReturnType<typeof getFaqs>> = [];
let blogCache: Awaited<ReturnType<typeof getPublishedBlog>> = [];
let knowledgeLoadedAt = 0;

export function resetKnowledgeCache() {
  knowledgeLoadedAt = 0;
}

async function loadKnowledge() {
  const now = Date.now();
  if (now - knowledgeLoadedAt < 10 * 60_000) return;
  try {
    const [p, t, f, b] = await Promise.all([
      getProjects(),
      getTestimonials(),
      getFaqs(),
      getPublishedBlog()
    ]);
    projectsCache = p;
    testimonialsCache = t;
    faqsCache = f;
    blogCache = b;
    knowledgeLoadedAt = now;
  } catch {
    // Keep whatever we already have; never break the concierge on a DB hiccup.
  }
}

function buildSystemPrompt(s: Record<string, string>): string {
  const brand = s.brand_name || "ggraphixc";
  const designer = s.designer_name || "Godson Otobo";
  const role = s.role_title || "Graphics Designer";
  const email = s.contact_email || "hello@ggraphixc.vercel.app";
  const location = s.location ? ` Based in ${s.location}.` : "";
  // Owner-controlled pricing: when set, quote it verbatim instead of rough ranges.
  const pricing = s.pricing_note?.trim()
    ? `Pricing (set by the owner — quote this verbatim, never improvise prices): ${s.pricing_note.trim()}`
    : "pricing ranges (rough: brand identity $1k-$5k+, social kits $1k-$3k, full campaigns $5k+)";
  return `You are the friendly project concierge for ${brand} — the design studio of ${designer}, a ${role}.${location}

What ${brand} does: brand identity, creative systems, logo design, packaging, social media kits, campaign visual direction, web/UI design, and motion graphics.

Your job: help prospective clients decide whether to reach out, and steer them toward the contact form at /contact. Answer questions about services, process (brief → moodboard → concepts → refinement → handoff), typical timelines (identity systems usually 2-4 weeks, social kits 1-2 weeks), and ${pricing}. Be warm, concise (2-4 sentences), and never invent specific facts or portfolio claims. If asked something you don't know, say so and suggest emailing ${email}. Always end by nudging them to start a project via the contact form.

Real portfolio facts — use these when visitors ask about specific work, proof, or whether ${brand} has done something:
${buildKnowledge()}`;
}

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
  await loadKnowledge();
  const settings = await getSettings();
  const email = settings.contact_email || "hello@ggraphixc.vercel.app";
  const designer = settings.designer_name || "Godson Otobo";
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

  const contents = messages.map((m) => ({
    role: (m.role === "user" ? "user" : "model") as "user" | "model",
    parts: m.parts
  }));
  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.parts ?? "";
  const projects = recommendProjects(lastUserMessage);

  const result = await callGemini({
    system: buildSystemPrompt(settings),
    contents,
    temperature: 0.6,
    maxOutputTokens: 512
  });

  if ("error" in result) {
    // Key missing → tell the owner how to enable the concierge.
    if (result.error.includes("not configured")) {
      return NextResponse.json({
        offline: true,
        projects,
        reply: `I'm offline right now — the AI key isn't configured yet. Add it in Admin → Settings, or email ${email} and ${designer} will get back to you within 24 hours.`
      });
    }
    return NextResponse.json({
      projects,
      reply: `Hmm, I hit a technical snag. Email ${email} instead and I'll get right back to you.`
    });
  }

  const reply = result.text.trim();
  return NextResponse.json({
    projects,
    reply:
      reply ||
      `I couldn't quite process that. Could you rephrase, or email ${email}?`
  });
}

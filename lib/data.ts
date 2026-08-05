import { getServiceSupabase } from "@/lib/supabase/server";
import { DEFAULT_SETTINGS } from "@/lib/site-settings";
import type { Project, ProjectImage, Testimonial, SiteSetting, BlogPost, Client, Faq } from "@/lib/types";

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Veloura Living — Brand & Packaging",
    slug: "veloura-living",
    category: "Brand Identity",
    image_url: "/images/projects/mr-clin-cards.jpg",
    result: "+48% Recall",
    description:
      "A calm, premium identity system and packaging suite for a direct-to-consumer furniture brand, built to feel tactile and trustworthy.",
    link: null,
    featured: true,
    client_name: "Veloura Living",
    challenge:
      "A DTC furniture brand with a warm, tactile product line was being communicated through scattered, cold marketing assets. Every channel told a slightly different visual story, which made the brand feel smaller and harder to trust.",
    solution:
      "I built a calm, premium identity system — a refined wordmark, a warm neutral palette, a modular packaging grid, and art direction rules — then applied it across packaging, web, and social so every touchpoint felt like one brand.",
    results:
      "Shipped a 40+ asset brand kit. Client reports +48% unaided brand recall in follow-up testing and a consistent launch across 3 channels.",
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: "p2",
    title: "Velocity Drive — Visual Campaign",
    slug: "velocity-drive",
    category: "Creative Direction",
    image_url: "/images/projects/thrive-credit-card.jpg",
    result: "+64% Engagement",
    description:
      "A high-velocity visual campaign with motion graphics and ad creative for a luxury rentals launch.",
    link: null,
    featured: true,
    client_name: "Velocity Drive",
    challenge:
      "A luxury rentals platform needed a launch campaign that cut through a saturated, generic category — and they needed it fast, with no in-house creative team.",
    solution:
      "A high-velocity visual campaign: bold kinetic typography, a motion graphics system, and ad creative variants engineered to be produced in batch. One direction, endlessly remixable.",
    results:
      "+64% engagement on launch ads and a campaign library that let the team ship new variants in hours instead of days.",
    display_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: "p3",
    title: "AeroLux Travel — Social Kit",
    slug: "aerolux-travel",
    category: "Social Design",
    image_url: "/images/projects/thrive-referrals.jpg",
    result: "-30% Production Time",
    description:
      "A modular social template system and icon library that cut campaign production time dramatically.",
    link: null,
    featured: true,
    client_name: "AeroLux Travel",
    challenge:
      "The marketing team was recreating social assets from scratch every week, burning designer time and drifting off-brand.",
    solution:
      "A modular social template system with an icon library, layout rules, and a small token set — so any asset could be assembled from the kit in minutes.",
    results: "Cut campaign production time by ~30% while keeping every post on-brand.",
    display_order: 3,
    created_at: new Date().toISOString()
  },
  {
    id: "p4",
    title: "ConvertX — Landing Page Design",
    slug: "convertx",
    category: "Web / UI",
    image_url: "/images/projects/web-2.jpg",
    result: "+120% Leads",
    description:
      "Conversion-focused landing page architecture with a clean visual hierarchy and reusable component kit.",
    link: null,
    featured: false,
    client_name: null,
    challenge: null,
    solution: null,
    results: null,
    display_order: 4,
    created_at: new Date().toISOString()
  },
  {
    id: "p5",
    title: "Swiftora — Dashboard UI",
    slug: "swiftora",
    category: "Product UI",
    image_url: "/images/projects/uiux-3.jpg",
    result: "-40% Ops Cost",
    description:
      "An enterprise analytics UI with a consistent design system, custom widgets, and a scalable component library.",
    link: null,
    featured: false,
    client_name: null,
    challenge: null,
    solution: null,
    results: null,
    display_order: 5,
    created_at: new Date().toISOString()
  },
  {
    id: "p6",
    title: "Sanctuary — Audio Brand",
    slug: "sanctuary",
    category: "Brand Identity",
    image_url: "/images/projects/gelt-token.jpg",
    result: "100k+ Streams",
    description:
      "A bold audio-first brand identity and cover art system for an independent streaming artist.",
    link: null,
    featured: false,
    client_name: null,
    challenge: null,
    solution: null,
    results: null,
    display_order: 6,
    created_at: new Date().toISOString()
  }
];

export const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "Samuel Adama",
    role: "CEO, Ophirbrooks Technologies",
    avatar_url: null,
    quote:
      "ggraphixc turned a basic brief into a premium visual identity that clearly explains our offer. The new system made it easy for serious clients to trust us.",
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: "t2",
    name: "Ifanyi Eze",
    role: "Marketing Lead",
    avatar_url: null,
    quote:
      "We finally had a clear visual direction — consistent templates, brand colors, and assets tied to actual goals instead of random posts.",
    display_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: "t3",
    name: "Christopher Onogwu",
    role: "Product Designer",
    avatar_url: null,
    quote:
      "They didn't just make things look better. They helped us simplify the product flow and give users a cleaner path from first look to action.",
    display_order: 3,
    created_at: new Date().toISOString()
  },
  {
    id: "t4",
    name: "Kunle Olalekan",
    role: "Founder",
    avatar_url: null,
    quote:
      "Our old process depended on scattered assets. ggraphixc built us a unified kit so the team could move faster and stay on brand.",
    display_order: 4,
    created_at: new Date().toISOString()
  }
];

async function safeService() {
  try {
    return getServiceSupabase();
  } catch {
    return null;
  }
}

// Data reads are cached via the classic ISR `revalidate` segment config on each
// page (see the page files), which is far more stable than `"use cache"` here.
// Admin edits publish instantly through the /api/revalidate endpoint.
export async function getProjects(): Promise<Project[]> {
  const sb = await safeService();
  if (!sb) return SAMPLE_PROJECTS;
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !data || data.length === 0) return SAMPLE_PROJECTS;
  return data as Project[];
}

// Single-row lookups. On a DB *error* we degrade to sample content (matching the
// list fetchers); a genuine absence (no row) still returns null → 404.
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const sample = SAMPLE_PROJECTS.find((p) => p.slug === slug) ?? null;
  const sb = await safeService();
  if (!sb) return sample;
  const { data, error } = await sb.from("projects").select("*").eq("slug", slug).maybeSingle();
  if (error) return sample;
  if (!data) return null;
  return data as Project;
}

export async function getProjectGallery(projectId: string): Promise<ProjectImage[]> {
  const sb = await safeService();
  if (!sb) return [];
  const { data, error } = await sb
    .from("project_images")
    .select("*")
    .eq("project_id", projectId)
    .order("display_order", { ascending: true });
  if (error || !data) return [];
  return data as ProjectImage[];
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const sb = await safeService();
  if (!sb) return SAMPLE_TESTIMONIALS;
  const { data, error } = await sb
    .from("testimonials")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !data || data.length === 0) return SAMPLE_TESTIMONIALS;
  return data as Testimonial[];
}

export async function getSettings(): Promise<Record<string, string>> {
  const sb = await safeService();
  const defaults: Record<string, string> = { ...DEFAULT_SETTINGS };
  if (!sb) return defaults;
  const { data, error } = await sb.from("site_settings").select("*");
  if (error || !data) return defaults;
  const map: Record<string, string> = { ...defaults };
  (data as SiteSetting[]).forEach((s) => (map[s.key] = s.value));
  return map;
}

export const SAMPLE_BLOG: BlogPost[] = [
  {
    id: "b1",
    title: "How a consistent brand system saves you time",
    slug: "consistent-brand-system",
    excerpt:
      "A reusable brand system is the difference between scrambling for assets and shipping on-brand in minutes.",
    cover_url: "/images/projects/branding-1.jpg",
    content:
      "Most brands lose time because every new post, deck, or ad starts from scratch. A small system — logo rules, color tokens, a type scale, and a few templates — lets your team move fast without a designer in the loop for every task.\n\nStart with the 20% of assets you actually reuse: social templates, an icon set, and a one-page brand sheet. Everything else can be derived from those.",
    tags: "Brand, Systems",
    published: true,
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: "b2",
    title: "Designing thumbnails that actually get clicked",
    slug: "thumbnails-that-get-clicked",
    excerpt: "A good thumbnail is a promise. Here is the simple structure I use for scroll-stopping covers.",
    cover_url: "/images/projects/design-1.png",
    content:
      "Clarity beats cleverness. Lead with one focal subject, keep text to three words max, and use high contrast so it reads at a glance. Test two versions and keep the one people actually stop for.",
    tags: "Social, Motion",
    published: true,
    display_order: 2,
    created_at: new Date().toISOString()
  }
];

export async function getPublishedBlog(): Promise<BlogPost[]> {
  const sb = await safeService();
  if (!sb) return SAMPLE_BLOG;
  const { data, error } = await sb
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("display_order", { ascending: true });
  if (error || !data || data.length === 0) return SAMPLE_BLOG;
  return data as BlogPost[];
}

export const SAMPLE_CLIENTS: Client[] = [
  { id: "c1", name: "Gleamify", logo_url: "/images/clients/gleamify-1.png", display_order: 1, created_at: new Date().toISOString() },
  { id: "c2", name: "Thrive", logo_url: "/images/clients/thrive.jpg", display_order: 2, created_at: new Date().toISOString() },
  { id: "c3", name: "Gelt Token", logo_url: "/images/clients/gelt.jpg", display_order: 3, created_at: new Date().toISOString() },
  { id: "c4", name: "Mr. Clin", logo_url: "/images/clients/mr-clin.jpg", display_order: 4, created_at: new Date().toISOString() },
  { id: "c5", name: "Azax", logo_url: "/images/clients/azax.jpg", display_order: 5, created_at: new Date().toISOString() },
  { id: "c6", name: "Thrive Token", logo_url: "/images/clients/thrive-token.jpg", display_order: 6, created_at: new Date().toISOString() }
];

export const SAMPLE_FAQS: Faq[] = [
  {
    id: "f1",
    question: "What design services do you offer?",
    answer:
      "Brand identity, creative systems, product & UI design, social and campaign creative, packaging/print, and art direction — either as one project or ongoing visual partnership.",
    display_order: 1,
    created_at: new Date().toISOString()
  },
  {
    id: "f2",
    question: "Can you help my brand look more premium and consistent?",
    answer:
      "Yes. I audit scattered visuals and rebuild them into a clean identity and reusable system, so every touchpoint feels intentional and trustworthy.",
    display_order: 2,
    created_at: new Date().toISOString()
  },
  {
    id: "f3",
    question: "How long does a brand or design project take?",
    answer:
      "A focused identity system usually takes 2–4 weeks, a full brand + creative system 4–8 weeks, and a product UI build depends on scope and approvals.",
    display_order: 3,
    created_at: new Date().toISOString()
  },
  {
    id: "f4",
    question: "Do you provide source files and full ownership?",
    answer:
      "Always. You keep full ownership of every approved asset, design file, and system I create — delivered in formats your team can actually use.",
    display_order: 4,
    created_at: new Date().toISOString()
  },
  {
    id: "f5",
    question: "Can we work together on an ongoing basis?",
    answer:
      "Yes. Many clients keep me on a monthly retainer for continuous design, so new assets ship fast and stay on-brand without hiring in-house.",
    display_order: 5,
    created_at: new Date().toISOString()
  }
];

export async function getClients(): Promise<Client[]> {
  const sb = await safeService();
  if (!sb) return SAMPLE_CLIENTS;
  const { data, error } = await sb
    .from("clients")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !data || data.length === 0) return SAMPLE_CLIENTS;
  return data as Client[];
}

export async function getFaqs(): Promise<Faq[]> {
  const sb = await safeService();
  if (!sb) return SAMPLE_FAQS;
  const { data, error } = await sb
    .from("faqs")
    .select("*")
    .order("display_order", { ascending: true });
  if (error || !data || data.length === 0) return SAMPLE_FAQS;
  return data as Faq[];
}

/**
 * Resolve the Google AI (Gemini) key: env var wins, else the private
 * google_api_key setting from site_settings (hidden from public reads via RLS).
 * Server-only — never call from a client component.
 */
export async function getGoogleApiKey(): Promise<string | null> {
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  const sb = await safeService();
  if (!sb) return null;
  const { data, error } = await sb.from("site_settings").select("value").eq("key", "google_api_key").maybeSingle();
  if (error || !data) return null;
  const v = (data as SiteSetting).value?.trim();
  return v || null;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const sb = await safeService();
  if (!sb) return SAMPLE_BLOG.find((b) => b.slug === slug) ?? null;
  const { data, error } = await sb.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (error) return SAMPLE_BLOG.find((b) => b.slug === slug) ?? null;
  if (!data) return null;
  return data as BlogPost;
}

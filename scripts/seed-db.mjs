/**
 * One-off: seed starter content into Supabase (idempotent — skips rows that
 * already exist by slug/key). Run after the schema.sql has been applied.
 *
 *   node scripts/seed-db.mjs
 *
 * Uses the service-role key from .env.local, so keep this script server-side.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function env(name) {
  const line = readFileSync(".env.local", "utf8")
    .split("\n")
    .find((l) => l.startsWith(name + "="));
  if (!line) throw new Error(`Missing ${name} in .env.local`);
  return line.slice(name.length + 1).trim();
}

const sb = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

const projects = [
  {
    title: "Veloura Living — Brand & Packaging",
    slug: "veloura-living",
    category: "Brand Identity",
    image_url: "/images/projects/mr-clin-cards.jpg",
    result: "+48% Recall",
    description:
      "A calm, premium identity system and packaging suite for a direct-to-consumer furniture brand, built to feel tactile and trustworthy.",
    link: null,
    display_order: 1,
    featured: true,
    client_name: "Veloura Living",
    challenge:
      "A DTC furniture brand with a warm, tactile product line was being communicated through scattered, cold marketing assets. Every channel told a slightly different visual story, which made the brand feel smaller and harder to trust.",
    solution:
      "I built a calm, premium identity system — a refined wordmark, a warm neutral palette, a modular packaging grid, and art direction rules — then applied it across packaging, web, and social so every touchpoint felt like one brand.",
    results:
      "Shipped a 40+ asset brand kit. Client reports +48% unaided brand recall in follow-up testing and a consistent launch across 3 channels."
  },
  {
    title: "Velocity Drive — Visual Campaign",
    slug: "velocity-drive",
    category: "Creative Direction",
    image_url: "/images/projects/thrive-credit-card.jpg",
    result: "+64% Engagement",
    description:
      "A high-velocity visual campaign with motion graphics and ad creative for a luxury rentals launch.",
    link: null,
    display_order: 2,
    featured: true,
    client_name: "Velocity Drive",
    challenge:
      "A luxury rentals platform needed a launch campaign that cut through a saturated, generic category — and they needed it fast, with no in-house creative team.",
    solution:
      "A high-velocity visual campaign: bold kinetic typography, a motion graphics system, and ad creative variants engineered to be produced in batch. One direction, endlessly remixable.",
    results:
      "+64% engagement on launch ads and a campaign library that let the team ship new variants in hours instead of days."
  },
  {
    title: "AeroLux Travel — Social Kit",
    slug: "aerolux-travel",
    category: "Social Design",
    image_url: "/images/projects/thrive-referrals.jpg",
    result: "-30% Production Time",
    description:
      "A modular social template system and icon library that cut campaign production time dramatically.",
    link: null,
    display_order: 3,
    featured: true,
    client_name: "AeroLux Travel",
    challenge:
      "The marketing team was recreating social assets from scratch every week, burning designer time and drifting off-brand.",
    solution:
      "A modular social template system with an icon library, layout rules, and a small token set — so any asset could be assembled from the kit in minutes.",
    results: "Cut campaign production time by ~30% while keeping every post on-brand."
  },
  {
    title: "ConvertX — Landing Page Design",
    slug: "convertx",
    category: "Web / UI",
    image_url: "/images/projects/web-2.jpg",
    result: "+120% Leads",
    description:
      "Conversion-focused landing page architecture with a clean visual hierarchy and reusable component kit.",
    link: null,
    display_order: 4,
    featured: false,
    client_name: null,
    challenge: null,
    solution: null,
    results: null
  },
  {
    title: "Swiftora — Dashboard UI",
    slug: "swiftora",
    category: "Product UI",
    image_url: "/images/projects/uiux-3.jpg",
    result: "-40% Ops Cost",
    description:
      "An enterprise analytics UI with a consistent design system, custom widgets, and a scalable component library.",
    link: null,
    display_order: 5,
    featured: false,
    client_name: null,
    challenge: null,
    solution: null,
    results: null
  },
  {
    title: "Sanctuary — Audio Brand",
    slug: "sanctuary",
    category: "Brand Identity",
    image_url: "/images/projects/gelt-token.jpg",
    result: "100k+ Streams",
    description:
      "A bold audio-first brand identity and cover art system for an independent streaming artist.",
    link: null,
    display_order: 6,
    featured: false,
    client_name: null,
    challenge: null,
    solution: null,
    results: null
  }
];

const testimonials = [
  {
    name: "Samuel Adama",
    role: "CEO, Ophirbrooks Technologies",
    avatar_url: null,
    quote:
      "ggraphixc turned a basic brief into a premium visual identity that clearly explains our offer. The new system made it easy for serious clients to trust us.",
    display_order: 1
  },
  {
    name: "Ifanyi Eze",
    role: "Marketing Lead",
    avatar_url: null,
    quote:
      "We finally had a clear visual direction — consistent templates, brand colors, and assets tied to actual goals instead of random posts.",
    display_order: 2
  },
  {
    name: "Christopher Onogwu",
    role: "Product Designer",
    avatar_url: null,
    quote:
      "They didn't just make things look better. They helped us simplify the product flow and give users a cleaner path from first look to action.",
    display_order: 3
  },
  {
    name: "Kunle Olalekan",
    role: "Founder",
    avatar_url: null,
    quote:
      "Our old process depended on scattered assets. ggraphixc built us a unified kit so the team could move faster and stay on brand.",
    display_order: 4
  }
];

const settings = {
  hero_headline: "I Design Brands, Visuals & Digital Experiences",
  hero_lead:
    "Godson Otobo (ggraphixc) builds brand identities, creative systems, and conversion-ready design for ambitious brands that want to look premium and earn trust.",
  about_text:
    "I'm a graphics designer obsessed with clarity and craft. From first sketch to shipped system, I help brands look intentional, consistent, and impossible to ignore.",
  stats_projects: "120+",
  stats_clients: "60+",
  stats_experience: "6+",
  stats_satisfaction: "98%",
  contact_email: "hello@ggraphixc.vercel.app"
};

const blog = [
  {
    title: "How a consistent brand system saves you time",
    slug: "consistent-brand-system",
    excerpt:
      "A reusable brand system is the difference between scrambling for assets and shipping on-brand in minutes.",
    cover_url: "/images/projects/branding-1.jpg",
    content:
      "Most brands lose time because every new post, deck, or ad starts from scratch. A small system — logo rules, color tokens, a type scale, and a few templates — lets your team move fast without a designer in the loop for every task.\n\nStart with the 20% of assets you actually reuse: social templates, an icon set, and a one-page brand sheet. Everything else can be derived from those.",
    tags: "Brand, Systems",
    published: true,
    display_order: 1
  },
  {
    title: "Designing thumbnails that actually get clicked",
    slug: "thumbnails-that-get-clicked",
    excerpt:
      "A good thumbnail is a promise. Here is the simple structure I use for scroll-stopping covers.",
    cover_url: "/images/projects/design-1.png",
    content:
      "Clarity beats cleverness. Lead with one focal subject, keep text to three words max, and use high contrast so it reads at a glance. Test two versions and keep the one people actually stop for.",
    tags: "Social, Motion",
    published: true,
    display_order: 2
  }
];

const report = {};
const skip = (t) => (report[t] = (report[t] ?? 0) + 1);

// Projects (skip existing slugs)
for (const p of projects) {
  const { data } = await sb.from("projects").select("id").eq("slug", p.slug).maybeSingle();
  if (data) { skip("projects"); continue; }
  const { error } = await sb.from("projects").insert(p);
  if (error) throw new Error(`projects/${p.slug}: ${error.message}`);
}
console.log("projects:", report.projects ? `${report.projects} skipped` : "6 inserted");

// Testimonials (skip existing quotes)
for (const t of testimonials) {
  const { data } = await sb.from("testimonials").select("id").eq("quote", t.quote).maybeSingle();
  if (data) { skip("testimonials"); continue; }
  const { error } = await sb.from("testimonials").insert(t);
  if (error) throw new Error(`testimonials: ${error.message}`);
}
console.log("testimonials:", report.testimonials ? `${report.testimonials} skipped` : "4 inserted");

// Settings (upsert by key)
for (const [key, value] of Object.entries(settings)) {
  const { error } = await sb
    .from("site_settings")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) throw new Error(`settings/${key}: ${error.message}`);
}
console.log("settings: 8 upserted");

// Blog posts (skip existing slugs)
for (const b of blog) {
  const { data } = await sb.from("blog_posts").select("id").eq("slug", b.slug).maybeSingle();
  if (data) { skip("blog"); continue; }
  const { error } = await sb.from("blog_posts").insert(b);
  if (error) throw new Error(`blog/${b.slug}: ${error.message}`);
}
console.log("blog:", report.blog ? `${report.blog} skipped` : "2 inserted");

console.log("Seeding complete.");

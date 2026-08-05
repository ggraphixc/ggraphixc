# ggraphixc — Portfolio

A personal portfolio for **Godson Otobo** (studio **ggraphixc**), a graphics designer.
Built with **Next.js 16 + React 19 + Supabase**, using the dark/glassmorphic design language of andybext.com.

## Stack (2026 modern structure)

- **Next.js 16** (App Router, TypeScript, Turbopack default bundler, React Compiler enabled)
- **React 19** — Server Actions + `useActionState` forms, ISR caching
- **Tailwind CSS 4** (CSS-first config via `@theme` in `app/globals.css`)
- **Supabase** for content (projects, case studies, galleries, testimonials, blog, inquiries) + Auth for the admin portal
- **Native 2026 platform features** — View Transitions API, Speculation Rules API (pre-rendering), dynamic OG images (`next/og`)
- **three.js** — GPU-accelerated hero (WebGPU renderer with WebGL fallback)
- **Google AI (Gemini)** — optional AI concierge on /contact + AI case-study drafts in the admin

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in your Supabase keys
npm run dev
```

Visit http://localhost:3000 (public site) and http://localhost:3000/admin (admin portal).

## Supabase setup

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run `supabase/schema.sql` (creates tables, RLS policies, and seeds sample content).
   Re-run it after upgrading — the 2026 section (`featured`, `client_name`, `challenge`, `solution`, `results`,
   `project_images`) is idempotent and safe on an existing database.
3. In **Authentication → Users → Add user**, create your admin account (email + password).
4. Copy the project URL and anon key (and service-role key) into `.env.local`.

Without Supabase configured, the site still renders with built-in sample content (demo mode).

## AI features (optional)

Add a Gemini API key to enable the concierge chat on `/contact` and the "AI draft case study" button in admin:

```
GOOGLE_API_KEY=...
```

Get a free key at https://aistudio.google.com/apikey. Both features degrade gracefully
when the key is absent (the concierge suggests emailing hello@ggraphixc.com instead).

## Features

- **Public site** — hero with 3D canvas, stats, about, services, filterable projects, case-study
  detail pages (`/projects/[slug]`) with image galleries + lightbox, blog, testimonials, FAQ, contact.
- **2026 polish** — buttery page transitions (View Transitions API), background pre-rendering
  (Speculation Rules), dynamically generated social cards (`app/opengraph-image.tsx`), and ISR
  content caching (5-min revalidate) with instant admin invalidation (`/api/revalidate`).
- **Contact** — Server Action form (no API route), writes to the `inquiries` table.
- **Admin** (`/admin`) — dashboard, projects (case-study fields + featured + gallery management +
  client-side image compression targeting 50–250 KB), blog, testimonials, messages, and a settings
  page for homepage copy + contact email. All edits purge the content cache so the public site
  updates instantly.

## Project structure

```
app/
  layout.tsx, page.tsx        # public site (view transitions + speculation rules in layout)
  actions/contact.ts          # Server Action for the contact form
  api/ai/                     # Gemini concierge + case-study draft endpoints
  api/revalidate/route.ts     # admin cache purge (protected)
  projects/[slug]/            # case-study detail pages
  services/                   # dedicated services page
  blog/[slug]/                # blog posts
  admin/                      # protected portal (dashboard, projects, blog, testimonials, messages, settings)
components/
  three/HeroCanvas.tsx        # 3D hero (lazy, client-only)
  ViewTransitions.tsx         # native page-transition wrapper
  ProjectGallery.tsx          # lightbox gallery
  Concierge.tsx               # AI chat widget
  admin/                      # ImageUpload (compressed), GalleryManager, cacheBump
lib/
  data.ts                     # content fetching with sample fallback
  site-settings.ts            # shared settings defaults (server + admin)
  image-compressor.ts         # zero-dep client-side image compression (WebP/JPEG)
  supabase/                   # browser + server clients
proxy.ts                      # Next 16 auth proxy (was middleware.ts)
supabase/schema.sql           # database schema + RLS + seed + 2026 migrations
```

## Customizing

- Edit copy in `supabase/schema.sql` (`site_settings`) or directly via the admin **Dashboard** settings flow.
- Projects, case studies, galleries, testimonials, and messages are managed entirely from `/admin`.
- Colors/fonts live in the `@theme` block of `app/globals.css`.

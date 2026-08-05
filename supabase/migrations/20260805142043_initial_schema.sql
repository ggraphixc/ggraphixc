-- ============================================================================
-- ggraphixc — 001_initial_schema (initial migration)
-- Creates all tables, RLS policies, seed content, and the storage bucket.
--
-- Run via the Supabase SQL editor (Dashboard → SQL → New query) or:
--   supabase db push   (with the Supabase CLI linked to this project)
--
-- Safe to re-run: uses IF NOT EXISTS / ON CONFLICT DO NOTHING throughout.
-- ============================================================================

-- ---------- projects ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  category text,
  image_url text,
  result text,
  description text,
  link text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Slug must be unique — the app looks up case studies with .maybeSingle().
-- A unique index is used instead of a table constraint so this stays
-- idempotent (CREATE UNIQUE INDEX IF NOT EXISTS) and pairs with
-- ON CONFLICT (slug) below.
create unique index if not exists projects_slug_key on public.projects (slug);

-- ---------- testimonials ----------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  avatar_url text,
  quote text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- inquiries (contact form) ----------
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  investment_range text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

-- ---------- site_settings ----------
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ---------- indexes ----------
create index if not exists projects_order_idx on public.projects (display_order);
create index if not exists testimonials_order_idx on public.testimonials (display_order);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.projects enable row level security;
alter table public.testimonials enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_settings enable row level security;

-- Public read everywhere
drop policy if exists "public read projects" on public.projects;
create policy "public read projects" on public.projects for select using (true);
drop policy if exists "public read testimonials" on public.testimonials;
create policy "public read testimonials" on public.testimonials for select using (true);
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);

-- Authenticated admins can manage content
drop policy if exists "admin write projects" on public.projects;
create policy "admin write projects" on public.projects
  for all to authenticated using (true) with check (true);
drop policy if exists "admin write testimonials" on public.testimonials;
create policy "admin write testimonials" on public.testimonials
  for all to authenticated using (true) with check (true);
drop policy if exists "admin write settings" on public.site_settings;
create policy "admin write settings" on public.site_settings
  for all to authenticated using (true) with check (true);

-- Inquiries: public can insert (contact form), admins can read/manage
drop policy if exists "public insert inquiries" on public.inquiries;
create policy "public insert inquiries" on public.inquiries
  for insert to anon with check (true);
drop policy if exists "admin read inquiries" on public.inquiries;
create policy "admin read inquiries" on public.inquiries
  for select to authenticated using (true);
drop policy if exists "admin write inquiries" on public.inquiries;
create policy "admin write inquiries" on public.inquiries
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- Seed data (safe to re-run; uses on conflict for settings)
-- ============================================================================
insert into public.projects (title, slug, category, result, description, display_order)
values
  ('Veloura Living — Brand & Packaging', 'veloura-living', 'Brand Identity', '+48% Recall',
   'A calm, premium identity system and packaging suite for a direct-to-consumer furniture brand.', 1),
  ('Velocity Drive — Visual Campaign', 'velocity-drive', 'Creative Direction', '+64% Engagement',
   'A high-velocity visual campaign with motion graphics and ad creative for a luxury rentals launch.', 2),
  ('AeroLux Travel — Social Kit', 'aerolux-travel', 'Social Design', '-30% Production Time',
   'A modular social template system and icon library that cut campaign production time.', 3),
  ('ConvertX — Landing Page Design', 'convertx', 'Web / UI', '+120% Leads',
   'Conversion-focused landing page architecture with a clean visual hierarchy.', 4),
  ('Swiftora — Dashboard UI', 'swiftora', 'Product UI', '-40% Ops Cost',
   'An enterprise analytics UI with a consistent design system and component library.', 5),
  ('Sanctuary — Audio Brand', 'sanctuary', 'Brand Identity', '100k+ Streams',
   'A bold audio-first brand identity and cover art system for an independent artist.', 6)
on conflict (slug) do nothing;

insert into public.testimonials (name, role, quote, display_order)
select v.name, v.role, v.quote, v.display_order
from (values
  ('Samuel Adama', 'CEO, Ophirbrooks Technologies',
   'ggraphixc turned a basic brief into a premium visual identity that clearly explains our offer.', 1),
  ('Ifanyi Eze', 'Marketing Lead',
   'We finally had a clear visual direction — consistent templates, brand colors, assets tied to goals.', 2),
  ('Christopher Onogwu', 'Product Designer',
   'They helped us simplify the product flow and give users a cleaner path from first look to action.', 3),
  ('Kunle Olalekan', 'Founder',
   'ggraphixc built us a unified kit so the team could move faster and stay on brand.', 4)
) as v(name, role, quote, display_order)
where not exists (select 1 from public.testimonials t where t.quote = v.quote);

insert into public.site_settings (key, value) values
  ('hero_headline', 'I Design Brands, Visuals & Digital Experiences'),
  ('hero_lead', 'Godson Otobo (ggraphixc) builds brand identities, creative systems, and conversion-ready design for ambitious brands that want to look premium and earn trust.'),
  ('about_text', 'I''m a graphics designer obsessed with clarity and craft. From first sketch to shipped system, I help brands look intentional, consistent, and impossible to ignore.'),
  ('stats_projects', '120+'),
  ('stats_clients', '60+'),
  ('stats_experience', '6+'),
  ('stats_satisfaction', '98%')
on conflict (key) do nothing;

-- ============================================================================
-- Blog posts
-- ============================================================================
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  cover_url text,
  content text not null,
  tags text,
  published boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists blog_slug_idx on public.blog_posts (slug);
create index if not exists blog_order_idx on public.blog_posts (display_order);

alter table public.blog_posts enable row level security;

drop policy if exists "public read published posts" on public.blog_posts;
create policy "public read published posts" on public.blog_posts
  for select using (published = true);
drop policy if exists "admin read all posts" on public.blog_posts;
create policy "admin read all posts" on public.blog_posts
  for select to authenticated using (true);
drop policy if exists "admin write posts" on public.blog_posts;
create policy "admin write posts" on public.blog_posts
  for all to authenticated using (true) with check (true);

insert into public.blog_posts (title, slug, excerpt, content, tags, published, display_order)
values
  ('How a consistent brand system saves you time', 'consistent-brand-system',
   'A reusable brand system is the difference between scrambling for assets and shipping on-brand in minutes.',
   'Most brands lose time because every new post, deck, or ad starts from scratch. A small system — logo rules, color tokens, a type scale, and a few templates — lets your team move fast without a designer in the loop for every task.\n\nStart with the 20% of assets you actually reuse: social templates, an icon set, and a one-page brand sheet. Everything else can be derived from those.',
   'Brand, Systems', true, 1),
  ('Designing thumbnails that actually get clicked', 'thumbnails-that-get-clicked',
   'A good thumbnail is a promise. Here is the simple structure I use for scroll-stopping covers.',
   'Clarity beats cleverness. Lead with one focal subject, keep text to three words max, and use high contrast so it reads at a glance. Test two versions and keep the one people actually stop for.',
   'Social, Motion', true, 2)
on conflict do nothing;

-- ============================================================================
-- Storage bucket for project / blog images
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

-- Authenticated admins can upload / manage files
drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images" on storage.objects
  for insert to authenticated with check (bucket_id = 'project-images');
drop policy if exists "admin update images" on storage.objects;
create policy "admin update images" on storage.objects
  for update to authenticated using (bucket_id = 'project-images');
drop policy if exists "admin delete images" on storage.objects;
create policy "admin delete images" on storage.objects
  for delete to authenticated using (bucket_id = 'project-images');
-- Public read of uploaded images
drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects
  for select using (bucket_id = 'project-images');

-- ============================================================================
-- 2026 upgrade — case-study fields + project image gallery
-- (safe to re-run: uses IF NOT EXISTS so it works on already-seeded databases)
-- ============================================================================
alter table public.projects add column if not exists featured boolean not null default false;
alter table public.projects add column if not exists client_name text;
alter table public.projects add column if not exists challenge text;
alter table public.projects add column if not exists solution text;
alter table public.projects add column if not exists results text;

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_images_project_idx on public.project_images (project_id, display_order);

alter table public.project_images enable row level security;

drop policy if exists "public read project images" on public.project_images;
create policy "public read project images" on public.project_images
  for select using (true);
drop policy if exists "admin write project images" on public.project_images;
create policy "admin write project images" on public.project_images
  for all to authenticated using (true) with check (true);

-- Seed case-study narrative + featured flags for the sample projects
update public.projects set
  featured = true,
  client_name = 'Veloura Living',
  challenge = 'A DTC furniture brand with a warm, tactile product line was being communicated through scattered, cold marketing assets. Every channel told a slightly different visual story, which made the brand feel smaller and harder to trust.',
  solution = 'I built a calm, premium identity system — a refined wordmark, a warm neutral palette, a modular packaging grid, and art direction rules — then applied it across packaging, web, and social so every touchpoint felt like one brand.',
  results = 'Shipped a 40+ asset brand kit. Client reports +48% unaided brand recall in follow-up testing and a consistent launch across 3 channels.'
where slug = 'veloura-living';

update public.projects set
  featured = true,
  client_name = 'Velocity Drive',
  challenge = 'A luxury rentals platform needed a launch campaign that cut through a saturated, generic category — and they needed it fast, with no in-house creative team.',
  solution = 'A high-velocity visual campaign: bold kinetic typography, a motion graphics system, and ad creative variants engineered to be produced in batch. One direction, endlessly remixable.',
  results = '+64% engagement on launch ads and a campaign library that let the team ship new variants in hours instead of days.'
where slug = 'velocity-drive';

update public.projects set
  featured = true,
  client_name = 'AeroLux Travel',
  challenge = 'The marketing team was recreating social assets from scratch every week, burning designer time and drifting off-brand.',
  solution = 'A modular social template system with an icon library, layout rules, and a small token set — so any asset could be assembled from the kit in minutes.',
  results = 'Cut campaign production time by ~30% while keeping every post on-brand.'
where slug = 'aerolux-travel';

-- ============================================================================
-- Create your admin user
-- In the Supabase Dashboard go to: Authentication -> Users -> "Add user"
-- (check "Send invite" or set a password) and use that email/password to log in
-- at /admin/login. No extra DB grants are needed — RLS above handles access.
-- ============================================================================

-- ============================================================================
-- ggraphixc - Supabase schema (DDL only)
-- Tables, indexes, RLS policies, and the storage bucket. No seed data here:
-- run scripts/seed-db.mjs (uses the service-role key) to populate content.
-- Safe to re-run: IF NOT EXISTS / drop-if-exists throughout.
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

-- Slug must be unique - the app looks up case studies with .maybeSingle().
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

-- ---------- blog_posts ----------
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

-- ---------- project_images ----------
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  image_url text not null,
  alt_text text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- 2026 case-study fields ----------
alter table public.projects add column if not exists featured boolean not null default false;
alter table public.projects add column if not exists client_name text;
alter table public.projects add column if not exists challenge text;
alter table public.projects add column if not exists solution text;
alter table public.projects add column if not exists results text;

-- ---------- indexes ----------
create index if not exists projects_order_idx on public.projects (display_order);
create index if not exists testimonials_order_idx on public.testimonials (display_order);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists blog_slug_idx on public.blog_posts (slug);
create index if not exists blog_order_idx on public.blog_posts (display_order);
create index if not exists project_images_project_idx on public.project_images (project_id, display_order);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.projects enable row level security;
alter table public.testimonials enable row level security;
alter table public.inquiries enable row level security;
alter table public.site_settings enable row level security;
alter table public.blog_posts enable row level security;
alter table public.project_images enable row level security;

-- Public read everywhere
drop policy if exists "public read projects" on public.projects;
create policy "public read projects" on public.projects for select using (true);
drop policy if exists "public read testimonials" on public.testimonials;
create policy "public read testimonials" on public.testimonials for select using (true);
drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings for select using (true);
drop policy if exists "public read published posts" on public.blog_posts;
create policy "public read published posts" on public.blog_posts for select using (published = true);
drop policy if exists "public read project images" on public.project_images;
create policy "public read project images" on public.project_images for select using (true);

-- Authenticated admins can manage content
drop policy if exists "admin write projects" on public.projects;
create policy "admin write projects" on public.projects for all to authenticated using (true) with check (true);
drop policy if exists "admin write testimonials" on public.testimonials;
create policy "admin write testimonials" on public.testimonials for all to authenticated using (true) with check (true);
drop policy if exists "admin write settings" on public.site_settings;
create policy "admin write settings" on public.site_settings for all to authenticated using (true) with check (true);
drop policy if exists "admin read all posts" on public.blog_posts;
create policy "admin read all posts" on public.blog_posts for select to authenticated using (true);
drop policy if exists "admin write posts" on public.blog_posts;
create policy "admin write posts" on public.blog_posts for all to authenticated using (true) with check (true);
drop policy if exists "admin write project images" on public.project_images;
create policy "admin write project images" on public.project_images for all to authenticated using (true) with check (true);

-- Inquiries: public can insert (contact form), admins can read/manage
drop policy if exists "public insert inquiries" on public.inquiries;
create policy "public insert inquiries" on public.inquiries for insert to anon with check (true);
drop policy if exists "admin read inquiries" on public.inquiries;
create policy "admin read inquiries" on public.inquiries for select to authenticated using (true);
drop policy if exists "admin write inquiries" on public.inquiries;
create policy "admin write inquiries" on public.inquiries for all to authenticated using (true) with check (true);

-- ============================================================================
-- Storage bucket for project / blog images
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

drop policy if exists "admin upload images" on storage.objects;
create policy "admin upload images" on storage.objects
  for insert to authenticated with check (bucket_id = 'project-images');
drop policy if exists "admin update images" on storage.objects;
create policy "admin update images" on storage.objects
  for update to authenticated using (bucket_id = 'project-images');
drop policy if exists "admin delete images" on storage.objects;
create policy "admin delete images" on storage.objects
  for delete to authenticated using (bucket_id = 'project-images');
drop policy if exists "public read images" on storage.objects;
create policy "public read images" on storage.objects
  for select using (bucket_id = 'project-images');

-- ============================================================================
-- Create your admin user
-- In the Supabase Dashboard go to: Authentication -> Users -> "Add user"
-- (check "Send invite" or set a password) and use that email/password to log
-- in at /admin/login. No extra DB grants are needed - RLS above handles access.
-- ============================================================================

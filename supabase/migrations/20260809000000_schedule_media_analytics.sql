-- ============================================================================
-- 2026-08-09 batch: scheduled publishing, media library, page-view analytics
-- ============================================================================

-- ---------- scheduled publishing ----------
-- blog_posts.published_at: when set, the post only appears on the public blog
-- from that moment (published=true is still required; combined with ISR
-- revalidate=300 the post appears within ~5 minutes of its date, no cron needed).
alter table public.blog_posts add column if not exists published_at timestamptz;

-- ---------- media library ----------
-- Every image uploaded through /api/upload is recorded here so the admin has a
-- searchable library with copy-URL and delete. RLS: public anon cannot read or
-- write; admins (authenticated) can manage; the upload route writes via the
-- service role.
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  filename text,
  folder text not null default 'uploads',
  size_kb int,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;
drop policy if exists "admin read media" on public.media;
create policy "admin read media" on public.media for select to authenticated using (true);
drop policy if exists "admin write media" on public.media;
create policy "admin write media" on public.media for all to authenticated using (true) with check (true);
create index if not exists media_created_idx on public.media (created_at desc);

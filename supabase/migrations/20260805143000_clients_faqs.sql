-- ============================================================================
-- Delta migration: admin-managed Clients (logo marquee) and FAQs
-- Run this in the Supabase SQL editor (safe to re-run).
-- ASCII only; no dollar quoting; no IF NOT EXISTS on policies.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Clients (trusted-by logo marquee on the homepage)
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

drop policy if exists "public read clients" on public.clients;
create policy "public read clients" on public.clients for select using (true);
drop policy if exists "admin write clients" on public.clients;
create policy "admin write clients" on public.clients for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- FAQs (homepage accordion)
-- ---------------------------------------------------------------------------
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.faqs enable row level security;

drop policy if exists "public read faqs" on public.faqs;
create policy "public read faqs" on public.faqs for select using (true);
drop policy if exists "admin write faqs" on public.faqs;
create policy "admin write faqs" on public.faqs for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed (idempotent via unique name / question)
-- ---------------------------------------------------------------------------
create unique index if not exists clients_name_key on public.clients (lower(name));
create unique index if not exists faqs_question_key on public.faqs (lower(question));

insert into public.clients (name, logo_url, display_order) values
  ('Gleamify', '/images/clients/gleamify-1.png', 1),
  ('Thrive', '/images/clients/thrive.jpg', 2),
  ('Gelt Token', '/images/clients/gelt.jpg', 3),
  ('Mr. Clin', '/images/clients/mr-clin.jpg', 4),
  ('Azax', '/images/clients/azax.jpg', 5),
  ('Thrive Token', '/images/clients/thrive-token.jpg', 6)
on conflict ((lower(name))) do nothing;

insert into public.faqs (question, answer, display_order) values
  ('What design services do you offer?',
   'Brand identity, creative systems, product & UI design, social and campaign creative, packaging/print, and art direction - either as one project or ongoing visual partnership.',
   1),
  ('Can you help my brand look more premium and consistent?',
   'Yes. I audit scattered visuals and rebuild them into a clean identity and reusable system, so every touchpoint feels intentional and trustworthy.',
   2),
  ('How long does a brand or design project take?',
   'A focused identity system usually takes 2-4 weeks, a full brand + creative system 4-8 weeks, and a product UI build depends on scope and approvals.',
   3),
  ('Do you provide source files and full ownership?',
   'Always. You keep full ownership of every approved asset, design file, and system I create - delivered in formats your team can actually use.',
   4),
  ('Can we work together on an ongoing basis?',
   'Yes. Many clients keep me on a monthly retainer for continuous design, so new assets ship fast and stay on-brand without hiring in-house.',
   5)
on conflict ((lower(question))) do nothing;

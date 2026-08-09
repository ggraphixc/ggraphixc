-- ---------- services ----------
-- Admin-managed service cards shown on the homepage grid and the /services
-- page. Icon is a Font Awesome class (e.g. 'fa-palette'); features is a
-- newline-separated list rendered as check chips on the /services page.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  icon text not null default 'fa-wand-magic-sparkles',
  title text not null,
  subtitle text,
  description text not null,
  features text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.services enable row level security;
drop policy if exists "public read services" on public.services;
create policy "public read services" on public.services for select using (true);
drop policy if exists "admin write services" on public.services;
create policy "admin write services" on public.services for all to authenticated using (true) with check (true);
create index if not exists services_order_idx on public.services (display_order);
-- Unique on lower(title) so re-running this migration never duplicates rows
-- (same pattern as clients/faqs).
create unique index if not exists services_title_key on public.services (lower(title));

insert into public.services (icon, title, subtitle, description, features, display_order) values
  ('fa-palette', 'Brand Identity', 'Identities that endure',
   'Logos, color systems, typography, and brand guidelines that make you instantly recognizable.',
   'Logo Design & Identity
Brand Strategy
Brand Guidelines
Stationery Design
Brand Collateral
Rebranding', 1),
  ('fa-layer-group', 'Creative Systems', 'Creative systems that scale',
   'Reusable templates, icon libraries, and asset kits so your team stays on-brand at scale.',
   'Social Media Kits
Template Systems
Icon Libraries
Ad Creative Variants
Motion Graphics
Campaign Direction', 2),
  ('fa-object-group', 'Product & UI Design', 'Digital experiences that convert',
   'Clean interfaces and component libraries that remove friction from first tap to conversion.',
   'Landing Page Design
Website Redesign
E-Commerce Design
Dashboard & Product UI
Design Systems
Interaction & Motion', 3),
  ('fa-bullhorn', 'Social & Campaign', 'Campaigns that get seen',
   'Scroll-stopping ad creative, carousels, and motion graphics built around real goals.',
   'Social Media Kits
Ad Creative Variants
Carousel Design
Motion Graphics
Campaign Direction
Template Systems', 4),
  ('fa-wand-magic-sparkles', 'Packaging & Print', 'Tactile, premium deliverables',
   'Tactile, premium packaging and print design that feels as good as it looks.',
   'Packaging Design
Label Design
Print Collateral
Die-Cut & Finishing
Retail Display
Product Launch Kits', 5),
  ('fa-compass-drafting', 'Art Direction', 'A consistent visual direction',
   'A consistent visual direction across every touchpoint, from shoots to launch.',
   'Creative Direction
Photoshoot Art Direction
Mood & Style Boards
Visual Language
Tone of Voice
Launch Strategy', 6)
on conflict ((lower(title))) do nothing;

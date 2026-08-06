-- ---------- newsletter_subscribers ----------
-- Backup sink for newsletter signups, written by the subscribe server action
-- (service role) alongside Brevo. RLS on with no policies: the public anon
-- key cannot read or write; only the server can. Email is deduped via the
-- primary key, so re-subscribing updates the row instead of duplicating it.
create table if not exists public.newsletter_subscribers (
  email text primary key,
  source text not null default 'footer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists newsletter_subscribers_time_idx
  on public.newsletter_subscribers (created_at desc);
alter table public.newsletter_subscribers enable row level security;

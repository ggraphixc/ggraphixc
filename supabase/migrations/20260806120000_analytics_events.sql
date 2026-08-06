-- ============================================================================
-- analytics_events — self-hosted source for the admin Concierge activity panel.
-- The client fires lightweight events (concierge_opened, concierge_message,
-- concierge_card_click, contact_submit) to POST /api/track, which inserts them
-- here via the service-role key. Works on any Vercel plan (unlike Vercel's
-- custom-events API, which needs Pro). RLS is enabled with NO policies, so the
-- public anon key can neither read nor write — only the server (service role)
-- touches this table.
-- ============================================================================

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Fast date-range + name aggregation for the 7/30-day dashboard queries.
create index if not exists analytics_events_name_time_idx
  on public.analytics_events (event_name, created_at desc);
create index if not exists analytics_events_time_idx
  on public.analytics_events (created_at desc);

alter table public.analytics_events enable row level security;
-- Intentionally NO policies: anon/public must not access this table.

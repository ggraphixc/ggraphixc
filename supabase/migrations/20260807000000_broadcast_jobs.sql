-- ============================================================================
-- Broadcast delivery jobs — lets campaigns reach lists larger than a single
-- serverless run can send in one go.
--
-- Flow: the admin broadcast action snapshots the recipient list into a job
-- (status 'queued'), then drains as many batches as fit in the request window.
-- Vercel Cron hits /api/cron/broadcast every 10 minutes, which drains the next
-- batch (~80 sends) of the oldest unfinished job until it's done.
-- ============================================================================
create table if not exists public.broadcast_jobs (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body text not null,
  status text not null default 'queued',      -- queued | sending | done
  total int not null default 0,
  sent int not null default 0,
  failed int not null default 0,
  failures jsonb not null default '[]'::jsonb, -- [{ email, error }]
  recipients jsonb not null default '[]'::jsonb, -- snapshot of the list at enqueue time
  next_index int not null default 0,          -- next recipient index to send
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists broadcast_jobs_status_idx
  on public.broadcast_jobs (status, created_at);
alter table public.broadcast_jobs enable row level security;
-- No policies: only the server (service role) reads or writes jobs.

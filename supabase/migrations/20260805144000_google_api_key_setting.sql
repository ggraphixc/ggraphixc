-- ============================================================================
-- Delta migration: keep the Google API key private.
-- The settings table is publicly readable (the site needs hero copy etc.), but
-- the google_api_key row must never be exposed to anonymous clients.
-- Run this in the Supabase SQL editor (safe to re-run).
-- ============================================================================

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings" on public.site_settings
  for select using (key <> 'google_api_key');

-- Also prevent anonymous clients from updating it by any means other than RLS.
drop policy if exists "admin write settings" on public.site_settings;
create policy "admin write settings" on public.site_settings
  for all to authenticated using (true) with check (true);

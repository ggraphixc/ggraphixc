-- ---------- allow_downloads ----------
-- Per-project download control. NULL = follow the global site setting
-- (site_settings.allow_downloads, set in Admin → Settings); true = always
-- allow; false = block and show "Request access" instead of download buttons.
alter table public.projects add column if not exists allow_downloads boolean;

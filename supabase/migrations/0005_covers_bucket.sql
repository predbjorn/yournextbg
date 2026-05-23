-- 0005_covers_bucket.sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('covers', 'covers', true, 2 * 1024 * 1024, array['image/webp','image/jpeg','image/png'])
  on conflict (id) do nothing;

-- Public read; service-role write only.
drop policy if exists covers_public_read on storage.objects;
create policy covers_public_read on storage.objects
  for select using (bucket_id = 'covers');

-- Cover path columns on games. Three sizes: thumb 80px, card 200px, hero 600px.
-- Stored as a deterministic path so URL can be constructed without a DB lookup.
alter table public.games
  add column if not exists cover_origin_url text,
  add column if not exists cover_status text not null default 'pending'
    check (cover_status in ('pending','ready','failed','manual'));

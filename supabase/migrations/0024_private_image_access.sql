update storage.buckets
set public = false
where id in ('class-photos', 'leaf-photos');

drop policy if exists "users read class photos" on storage.objects;
create policy "users read own class photos"
on storage.objects for select
using (bucket_id = 'class-photos' and auth.uid()::text = split_part(name, '/', 1));

drop policy if exists "users read leaf photos" on storage.objects;
create policy "users read own leaf photos"
on storage.objects for select
using (bucket_id = 'leaf-photos' and auth.uid()::text = split_part(name, '/', 1));

alter table public.discoveries
  add column if not exists image_path text;

update public.discoveries
set image_path = regexp_replace(image_url, '^.*/object/public/leaf-photos/', '')
where image_path is null
  and image_url like '%/object/public/leaf-photos/%';

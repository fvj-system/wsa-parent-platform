alter table public.geocaches
  add column if not exists vague_map_hint text,
  add column if not exists image_path text,
  add column if not exists image_url text;

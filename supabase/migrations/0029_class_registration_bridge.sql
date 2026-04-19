alter table public.classes
  add column if not exists slug text,
  add column if not exists short_description text,
  add column if not exists class_date date,
  add column if not exists price_child numeric,
  add column if not exists price_family numeric,
  add column if not exists capacity integer,
  add column if not exists image_url text,
  add column if not exists age_range text,
  add column if not exists registration_link_child text,
  add column if not exists registration_link_family text,
  add column if not exists is_featured boolean not null default false;

alter table public.classes
  alter column status set default 'scheduled';

update public.classes
set class_date = coalesce(class_date, date)
where class_date is null;

update public.classes
set price_child = round((price_cents::numeric / 100.0), 2)
where price_child is null
  and price_cents is not null;

update public.classes
set price_family = case
  when price_cents is not null and price_cents > 0 then greatest(round(((price_cents::numeric / 100.0) * 2), 2), 25)
  else 25
end
where price_family is null;

update public.classes
set capacity = max_capacity
where capacity is null
  and max_capacity is not null;

update public.classes
set short_description = left(coalesce(description, title), 220)
where short_description is null;

update public.classes
set age_range = concat_ws('-', age_min::text, age_max::text)
where age_range is null
  and age_min is not null
  and age_max is not null;

update public.classes
set slug = concat(
    trim(both '-' from regexp_replace(lower(coalesce(title, 'class')), '[^a-z0-9]+', '-', 'g')),
    '-',
    substr(id::text, 1, 8)
  )
where slug is null or btrim(slug) = '';

update public.classes
set status = 'scheduled'
where status = 'published';

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'classes'
      and constraint_name = 'classes_status_check'
  ) then
    alter table public.classes
      drop constraint classes_status_check;
  end if;
end $$;

alter table public.classes
  add constraint classes_status_check
  check (status in ('draft', 'scheduled', 'full', 'cancelled', 'completed', 'archived'));

create unique index if not exists classes_slug_unique_idx
  on public.classes (slug)
  where slug is not null;

create index if not exists classes_status_class_date_idx
  on public.classes (status, class_date);

create index if not exists classes_featured_class_date_idx
  on public.classes (is_featured desc, class_date asc);

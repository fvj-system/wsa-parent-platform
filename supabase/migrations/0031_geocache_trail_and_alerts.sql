create table if not exists public.geocaches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  cache_type text not null default 'message'
    check (cache_type in ('message', 'treasure', 'nature_swap', 'field_note')),
  state_code text not null
    check (state_code in ('MD', 'VA', 'WV', 'DE', 'PA')),
  county_name text not null,
  location_hint text not null,
  clue text not null,
  treasure_note text,
  family_friendly boolean not null default true,
  latitude double precision,
  longitude double precision,
  status text not null default 'active'
    check (status in ('active', 'found', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists geocaches_status_created_idx
  on public.geocaches (status, created_at desc);

create index if not exists geocaches_state_county_idx
  on public.geocaches (state_code, county_name, status);

create index if not exists geocaches_household_idx
  on public.geocaches (household_id, created_at desc);

alter table public.geocaches enable row level security;

drop policy if exists "geocaches readable by families" on public.geocaches;
create policy "geocaches readable by families"
on public.geocaches for select
to authenticated
using (
  status in ('active', 'found')
  or public.is_household_member(household_id)
);

drop policy if exists "geocaches writable by household" on public.geocaches;
create policy "geocaches writable by household"
on public.geocaches for insert
to authenticated
with check (
  public.is_household_member(household_id)
  and auth.uid() = user_id
);

drop policy if exists "geocaches updatable by household" on public.geocaches;
create policy "geocaches updatable by household"
on public.geocaches for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "geocaches deletable by household" on public.geocaches;
create policy "geocaches deletable by household"
on public.geocaches for delete
to authenticated
using (public.is_household_member(household_id));

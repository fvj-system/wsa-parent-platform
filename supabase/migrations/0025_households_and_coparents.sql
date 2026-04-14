create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_memberships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'coparent' check (role in ('owner', 'coparent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id),
  unique (household_id, user_id)
);

create table if not exists public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  invite_email text not null,
  invite_token text not null unique default gen_random_uuid()::text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create unique index if not exists household_invites_pending_email_idx
  on public.household_invites (household_id, lower(invite_email))
  where status = 'pending';

alter table public.profiles
  add column if not exists household_id uuid references public.households(id) on delete set null;

alter table public.waivers
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.students
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.generations
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.discoveries
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.activity_completions
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.class_bookings
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.student_achievements
  add column if not exists household_id uuid references public.households(id) on delete cascade;

insert into public.households (id, name, created_by, created_at, updated_at)
select
  profiles.id,
  coalesce(nullif(profiles.household_name, ''), nullif(profiles.full_name, ''), 'WSA Household'),
  profiles.id,
  profiles.created_at,
  now()
from public.profiles
on conflict (id) do nothing;

update public.profiles
set household_id = profiles.id
where household_id is null;

insert into public.household_memberships (household_id, user_id, role, created_at, updated_at)
select
  profiles.household_id,
  profiles.id,
  'owner',
  profiles.created_at,
  now()
from public.profiles
where profiles.household_id is not null
on conflict (user_id) do update
set household_id = excluded.household_id,
    role = excluded.role,
    updated_at = now();

update public.waivers
set household_id = profiles.household_id
from public.profiles
where waivers.user_id = profiles.id
  and waivers.household_id is null;

update public.students
set household_id = profiles.household_id
from public.profiles
where students.user_id = profiles.id
  and students.household_id is null;

update public.generations
set household_id = profiles.household_id
from public.profiles
where generations.user_id = profiles.id
  and generations.household_id is null;

update public.discoveries
set household_id = profiles.household_id
from public.profiles
where discoveries.user_id = profiles.id
  and discoveries.household_id is null;

update public.activity_completions
set household_id = profiles.household_id
from public.profiles
where activity_completions.user_id = profiles.id
  and activity_completions.household_id is null;

update public.class_bookings
set household_id = profiles.household_id
from public.profiles
where class_bookings.user_id = profiles.id
  and class_bookings.household_id is null;

update public.student_achievements
set household_id = profiles.household_id
from public.profiles
where student_achievements.user_id = profiles.id
  and student_achievements.household_id is null;

alter table public.profiles
  alter column household_id set not null;

alter table public.waivers
  alter column household_id set not null;

alter table public.students
  alter column household_id set not null;

alter table public.generations
  alter column household_id set not null;

alter table public.discoveries
  alter column household_id set not null;

alter table public.activity_completions
  alter column household_id set not null;

alter table public.class_bookings
  alter column household_id set not null;

alter table public.student_achievements
  alter column household_id set not null;

create index if not exists profiles_household_id_idx
  on public.profiles (household_id);

create index if not exists waivers_household_id_idx
  on public.waivers (household_id, signed_at desc);

create index if not exists students_household_id_idx
  on public.students (household_id, created_at desc);

create index if not exists generations_household_id_idx
  on public.generations (household_id, created_at desc);

create index if not exists discoveries_household_id_idx
  on public.discoveries (household_id, observed_at desc);

create index if not exists activity_completions_household_id_idx
  on public.activity_completions (household_id, completed_at desc);

create index if not exists class_bookings_household_id_idx
  on public.class_bookings (household_id, booked_at desc);

create index if not exists student_achievements_household_id_idx
  on public.student_achievements (household_id, earned_at desc);

alter table public.households enable row level security;
alter table public.household_memberships enable row level security;
alter table public.household_invites enable row level security;

create or replace function public.get_current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select profiles.household_id
  from public.profiles
  where profiles.id = auth.uid()
$$;

create or replace function public.is_household_member(check_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_memberships
    where household_memberships.household_id = check_household_id
      and household_memberships.user_id = auth.uid()
  )
$$;

create or replace function public.accept_household_invite(invite_token_input text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  target_invite public.household_invites;
begin
  if current_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if current_email = '' then
    raise exception 'Your account needs a real email before you can accept a household invite.';
  end if;

  select *
  into target_invite
  from public.household_invites
  where invite_token = invite_token_input
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'This household invite is missing or expired.';
  end if;

  if lower(target_invite.invite_email) <> current_email then
    raise exception 'This invite was sent to a different email address.';
  end if;

  update public.profiles
  set household_id = target_invite.household_id,
      household_name = coalesce(
        nullif(household_name, ''),
        (select households.name from public.households where households.id = target_invite.household_id)
      ),
      updated_at = now()
  where id = current_user_id;

  insert into public.household_memberships (household_id, user_id, role)
  values (target_invite.household_id, current_user_id, 'coparent')
  on conflict (user_id) do update
  set household_id = excluded.household_id,
      role = excluded.role,
      updated_at = now();

  update public.household_invites
  set status = 'accepted',
      accepted_by_user_id = current_user_id,
      accepted_at = now()
  where id = target_invite.id;

  update public.waivers
  set household_id = target_invite.household_id
  where user_id = current_user_id;

  update public.students
  set household_id = target_invite.household_id
  where user_id = current_user_id;

  update public.generations
  set household_id = target_invite.household_id
  where user_id = current_user_id;

  update public.discoveries
  set household_id = target_invite.household_id
  where user_id = current_user_id;

  update public.activity_completions
  set household_id = target_invite.household_id
  where user_id = current_user_id;

  update public.class_bookings
  set household_id = target_invite.household_id
  where user_id = current_user_id;

  update public.student_achievements
  set household_id = target_invite.household_id
  where user_id = current_user_id;

  return target_invite.household_id;
end;
$$;

grant execute on function public.accept_household_invite(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid := gen_random_uuid();
  next_household_name text := coalesce(
    nullif(new.raw_user_meta_data ->> 'household_name', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'WSA Household'
  );
begin
  insert into public.households (id, name, created_by)
  values (new_household_id, next_household_name, new.id)
  on conflict (id) do nothing;

  insert into public.profiles (id, full_name, household_name, household_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'household_name', ''),
    new_household_id
  )
  on conflict (id) do update
  set household_id = excluded.household_id,
      household_name = excluded.household_name,
      full_name = excluded.full_name;

  insert into public.household_memberships (household_id, user_id, role)
  values (new_household_id, new.id, 'owner')
  on conflict (user_id) do update
  set household_id = excluded.household_id,
      role = excluded.role,
      updated_at = now();

  return new;
end;
$$;

drop policy if exists "profiles are readable by owner" on public.profiles;
create policy "profiles readable by household"
on public.profiles for select
using (auth.uid() = id or public.is_household_member(household_id));

drop policy if exists "profiles are writable by owner" on public.profiles;
create policy "profiles insert by owner"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "profiles are updatable by owner" on public.profiles;
create policy "profiles updatable by owner"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "waivers owned by user" on public.waivers;
drop policy if exists "waivers readable by household" on public.waivers;
drop policy if exists "waivers writable by household" on public.waivers;
drop policy if exists "waivers updatable by household" on public.waivers;
drop policy if exists "waivers deletable by owner" on public.waivers;
create policy "waivers readable by household"
on public.waivers for select
using (public.is_household_member(household_id));

create policy "waivers writable by household"
on public.waivers for insert
with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "waivers updatable by household"
on public.waivers for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "waivers deletable by owner"
on public.waivers for delete
using (public.is_household_member(household_id) and auth.uid() = user_id);

drop policy if exists "students owned by user" on public.students;
drop policy if exists "students readable by household" on public.students;
drop policy if exists "students writable by household" on public.students;
drop policy if exists "students updatable by household" on public.students;
drop policy if exists "students deletable by household" on public.students;
create policy "students readable by household"
on public.students for select
using (public.is_household_member(household_id));

create policy "students writable by household"
on public.students for insert
with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "students updatable by household"
on public.students for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "students deletable by household"
on public.students for delete
using (public.is_household_member(household_id));

drop policy if exists "discoveries_select_own" on public.discoveries;
drop policy if exists "discoveries_insert_own" on public.discoveries;
drop policy if exists "discoveries_update_own" on public.discoveries;
drop policy if exists "discoveries_delete_own" on public.discoveries;

create policy "discoveries readable by household"
on public.discoveries for select
using (public.is_household_member(household_id));

create policy "discoveries writable by household"
on public.discoveries for insert
with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "discoveries updatable by household"
on public.discoveries for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "discoveries deletable by household"
on public.discoveries for delete
using (public.is_household_member(household_id));

drop policy if exists "generations owned by user" on public.generations;
drop policy if exists "generations readable by household" on public.generations;
drop policy if exists "generations writable by household" on public.generations;
drop policy if exists "generations updatable by household" on public.generations;
drop policy if exists "generations deletable by household" on public.generations;
create policy "generations readable by household"
on public.generations for select
using (public.is_household_member(household_id));

create policy "generations writable by household"
on public.generations for insert
with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "generations updatable by household"
on public.generations for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "generations deletable by household"
on public.generations for delete
using (public.is_household_member(household_id));

drop policy if exists "activity completions owned by user" on public.activity_completions;
drop policy if exists "activity completions readable by household" on public.activity_completions;
drop policy if exists "activity completions writable by household" on public.activity_completions;
drop policy if exists "activity completions updatable by household" on public.activity_completions;
drop policy if exists "activity completions deletable by household" on public.activity_completions;
create policy "activity completions readable by household"
on public.activity_completions for select
using (public.is_household_member(household_id));

create policy "activity completions writable by household"
on public.activity_completions for insert
with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "activity completions updatable by household"
on public.activity_completions for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "activity completions deletable by household"
on public.activity_completions for delete
using (public.is_household_member(household_id));

drop policy if exists "class bookings owned by user" on public.class_bookings;
drop policy if exists "class bookings readable by household" on public.class_bookings;
drop policy if exists "class bookings writable by household" on public.class_bookings;
drop policy if exists "class bookings updatable by household" on public.class_bookings;
drop policy if exists "class bookings deletable by household" on public.class_bookings;
create policy "class bookings readable by household"
on public.class_bookings for select
using (public.is_household_member(household_id));

create policy "class bookings writable by household"
on public.class_bookings for insert
with check (public.is_household_member(household_id) and auth.uid() = user_id);

create policy "class bookings updatable by household"
on public.class_bookings for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "class bookings deletable by household"
on public.class_bookings for delete
using (public.is_household_member(household_id));

drop policy if exists "student badges owned by student parent" on public.student_badges;
drop policy if exists "student badges readable by household" on public.student_badges;
drop policy if exists "student badges writable by household" on public.student_badges;
drop policy if exists "student badges updatable by household" on public.student_badges;
drop policy if exists "student badges deletable by household" on public.student_badges;
create policy "student badges readable by household"
on public.student_badges for select
using (
  exists (
    select 1
    from public.students
    where students.id = student_badges.student_id
      and public.is_household_member(students.household_id)
  )
);

create policy "student badges writable by household"
on public.student_badges for insert
with check (
  exists (
    select 1
    from public.students
    where students.id = student_badges.student_id
      and public.is_household_member(students.household_id)
  )
);

create policy "student badges updatable by household"
on public.student_badges for update
using (
  exists (
    select 1
    from public.students
    where students.id = student_badges.student_id
      and public.is_household_member(students.household_id)
  )
)
with check (
  exists (
    select 1
    from public.students
    where students.id = student_badges.student_id
      and public.is_household_member(students.household_id)
  )
);

create policy "student badges deletable by household"
on public.student_badges for delete
using (
  exists (
    select 1
    from public.students
    where students.id = student_badges.student_id
      and public.is_household_member(students.household_id)
  )
);

drop policy if exists "student achievements owned by student parent" on public.student_achievements;
drop policy if exists "student achievements readable by household" on public.student_achievements;
drop policy if exists "student achievements writable by household" on public.student_achievements;
drop policy if exists "student achievements updatable by household" on public.student_achievements;
drop policy if exists "student achievements deletable by household" on public.student_achievements;
create policy "student achievements readable by household"
on public.student_achievements for select
using (public.is_household_member(household_id));

create policy "student achievements writable by household"
on public.student_achievements for insert
with check (public.is_household_member(household_id));

create policy "student achievements updatable by household"
on public.student_achievements for update
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

create policy "student achievements deletable by household"
on public.student_achievements for delete
using (public.is_household_member(household_id));

drop policy if exists "portfolio entries owned by student parent" on public.portfolio_entries;
drop policy if exists "portfolio entries readable by household" on public.portfolio_entries;
drop policy if exists "portfolio entries writable by household" on public.portfolio_entries;
drop policy if exists "portfolio entries updatable by household" on public.portfolio_entries;
drop policy if exists "portfolio entries deletable by household" on public.portfolio_entries;
create policy "portfolio entries readable by household"
on public.portfolio_entries for select
using (
  exists (
    select 1
    from public.students
    where students.id = portfolio_entries.student_id
      and public.is_household_member(students.household_id)
  )
);

create policy "portfolio entries writable by household"
on public.portfolio_entries for insert
with check (
  exists (
    select 1
    from public.students
    where students.id = portfolio_entries.student_id
      and public.is_household_member(students.household_id)
  )
);

create policy "portfolio entries updatable by household"
on public.portfolio_entries for update
using (
  exists (
    select 1
    from public.students
    where students.id = portfolio_entries.student_id
      and public.is_household_member(students.household_id)
  )
)
with check (
  exists (
    select 1
    from public.students
    where students.id = portfolio_entries.student_id
      and public.is_household_member(students.household_id)
  )
);

create policy "portfolio entries deletable by household"
on public.portfolio_entries for delete
using (
  exists (
    select 1
    from public.students
    where students.id = portfolio_entries.student_id
      and public.is_household_member(students.household_id)
  )
);

drop policy if exists "households readable by members" on public.households;
create policy "households readable by members"
on public.households for select
using (public.is_household_member(id));

drop policy if exists "household memberships readable by members" on public.household_memberships;
create policy "household memberships readable by members"
on public.household_memberships for select
using (public.is_household_member(household_id));

drop policy if exists "household invites readable by members or invited email" on public.household_invites;
create policy "household invites readable by members or invited email"
on public.household_invites for select
using (
  public.is_household_member(household_id)
  or lower(invite_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists "household invites writable by members" on public.household_invites;
create policy "household invites writable by members"
on public.household_invites for insert
with check (
  public.is_household_member(household_id)
  and auth.uid() = invited_by_user_id
);

drop policy if exists "household invites deletable by members" on public.household_invites;
create policy "household invites deletable by members"
on public.household_invites for delete
using (public.is_household_member(household_id));

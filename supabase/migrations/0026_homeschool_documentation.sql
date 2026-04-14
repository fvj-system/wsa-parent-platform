alter table public.portfolio_entries
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists occurred_at timestamptz;

update public.portfolio_entries
set household_id = students.household_id
from public.students
where portfolio_entries.student_id = students.id
  and portfolio_entries.household_id is null;

update public.portfolio_entries
set household_id = discoveries.household_id
from public.discoveries
where portfolio_entries.source_discovery_id = discoveries.id
  and portfolio_entries.household_id is null;

update public.portfolio_entries
set occurred_at = coalesce(discoveries.observed_at, portfolio_entries.created_at)
from public.discoveries
where portfolio_entries.source_discovery_id = discoveries.id
  and portfolio_entries.occurred_at is null;

update public.portfolio_entries
set occurred_at = created_at
where occurred_at is null;

alter table public.portfolio_entries
  alter column household_id set not null;

alter table public.portfolio_entries
  alter column occurred_at set not null;

alter table public.portfolio_entries
  alter column occurred_at set default now();

alter table public.portfolio_entries
  alter column student_id drop not null;

create index if not exists portfolio_entries_household_id_occurred_at_idx
  on public.portfolio_entries (household_id, occurred_at desc);

create index if not exists portfolio_entries_household_student_occurred_at_idx
  on public.portfolio_entries (household_id, student_id, occurred_at desc);

alter table public.portfolio_notes
  add column if not exists household_id uuid references public.households(id) on delete cascade;

update public.portfolio_notes
set household_id = students.household_id
from public.students
where portfolio_notes.student_id = students.id
  and portfolio_notes.household_id is null;

alter table public.portfolio_notes
  alter column household_id set not null;

create index if not exists portfolio_notes_household_id_created_at_idx
  on public.portfolio_notes (household_id, created_at desc);

alter table public.portfolio_notes enable row level security;

drop policy if exists "portfolio entries owned by student parent" on public.portfolio_entries;
drop policy if exists "portfolio entries readable by household" on public.portfolio_entries;
drop policy if exists "portfolio entries writable by household" on public.portfolio_entries;
drop policy if exists "portfolio entries updatable by household" on public.portfolio_entries;
drop policy if exists "portfolio entries deletable by household" on public.portfolio_entries;

create policy "portfolio entries readable by household"
on public.portfolio_entries for select
using (
  public.is_household_member(household_id)
  and (
    student_id is null
    or exists (
      select 1
      from public.students
      where students.id = portfolio_entries.student_id
        and students.household_id = portfolio_entries.household_id
    )
  )
);

create policy "portfolio entries writable by household"
on public.portfolio_entries for insert
with check (
  public.is_household_member(household_id)
  and (
    student_id is null
    or exists (
      select 1
      from public.students
      where students.id = portfolio_entries.student_id
        and students.household_id = portfolio_entries.household_id
    )
  )
);

create policy "portfolio entries updatable by household"
on public.portfolio_entries for update
using (
  public.is_household_member(household_id)
)
with check (
  public.is_household_member(household_id)
  and (
    student_id is null
    or exists (
      select 1
      from public.students
      where students.id = portfolio_entries.student_id
        and students.household_id = portfolio_entries.household_id
    )
  )
);

create policy "portfolio entries deletable by household"
on public.portfolio_entries for delete
using (
  public.is_household_member(household_id)
);

drop policy if exists "portfolio notes owned by user" on public.portfolio_notes;
drop policy if exists "portfolio notes readable by household" on public.portfolio_notes;
drop policy if exists "portfolio notes writable by household" on public.portfolio_notes;
drop policy if exists "portfolio notes updatable by household" on public.portfolio_notes;
drop policy if exists "portfolio notes deletable by household" on public.portfolio_notes;

create policy "portfolio notes readable by household"
on public.portfolio_notes for select
using (public.is_household_member(household_id));

create policy "portfolio notes writable by household"
on public.portfolio_notes for insert
with check (
  public.is_household_member(household_id)
  and auth.uid() = user_id
);

create policy "portfolio notes updatable by household"
on public.portfolio_notes for update
using (public.is_household_member(household_id))
with check (
  public.is_household_member(household_id)
  and auth.uid() = user_id
);

create policy "portfolio notes deletable by household"
on public.portfolio_notes for delete
using (
  public.is_household_member(household_id)
  and auth.uid() = user_id
);

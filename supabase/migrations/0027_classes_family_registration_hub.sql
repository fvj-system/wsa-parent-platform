alter table public.waivers
  add column if not exists save_on_file boolean not null default false;

alter table public.class_bookings
  add column if not exists registration_group_id uuid,
  add column if not exists group_lead boolean not null default false,
  add column if not exists attendee_count integer not null default 1 check (attendee_count >= 1),
  add column if not exists pricing_mode text not null default 'per_child' check (pricing_mode in ('per_child', 'family')),
  add column if not exists waiver_id uuid references public.waivers(id) on delete set null;

update public.class_bookings
set registration_group_id = id
where registration_group_id is null;

alter table public.class_bookings
  alter column registration_group_id set not null;

update public.class_bookings
set group_lead = true
where group_lead is false
  and registration_group_id = id;

update public.class_bookings
set attendee_count = 1
where attendee_count is null or attendee_count < 1;

update public.class_bookings
set pricing_mode = 'per_child'
where pricing_mode is null;

drop index if exists public.class_bookings_checkout_session_unique_idx;

create index if not exists class_bookings_registration_group_idx
  on public.class_bookings (registration_group_id, booked_at desc);

create index if not exists class_bookings_checkout_session_idx
  on public.class_bookings (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists class_bookings_waiver_id_idx
  on public.class_bookings (waiver_id)
  where waiver_id is not null;

create index if not exists waivers_household_on_file_idx
  on public.waivers (household_id, save_on_file, accepted_at desc);

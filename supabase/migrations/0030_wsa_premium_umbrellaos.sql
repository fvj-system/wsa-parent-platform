create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null unique references public.households(id) on delete cascade,
  name text not null,
  county text,
  local_school_system text,
  primary_contact_user_id uuid references auth.users(id) on delete set null,
  payment_status text not null default 'not_configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists role text not null default 'parent',
  add column if not exists family_id uuid references public.families(id) on delete set null;

alter table public.students
  add column if not exists family_id uuid references public.families(id) on delete cascade,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists birthdate date,
  add column if not exists grade_level text,
  add column if not exists math_level text,
  add column if not exists science_level text,
  add column if not exists writing_level text,
  add column if not exists active boolean not null default false,
  add column if not exists notes text;

create table if not exists public.subject_areas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  plan_date date not null default current_date,
  title text not null,
  theme text,
  plan_type text not null default 'full_day',
  preferred_learning_style text,
  parent_available_time_minutes integer,
  outdoor_option boolean not null default false,
  estimated_total_minutes integer not null default 0,
  weak_subjects text[] not null default '{}'::text[],
  source_model text not null default 'fallback-no-openai',
  raw_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_assignments (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references public.lesson_plans(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_area_id uuid references public.subject_areas(id) on delete set null,
  subject_name text not null,
  activity_title text not null,
  instructions text not null,
  evidence_to_save text,
  estimated_minutes integer not null default 0,
  materials jsonb not null default '[]'::jsonb,
  parent_notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.worksheets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  subject_area_id uuid references public.subject_areas(id) on delete set null,
  subject text not null,
  topic text not null,
  difficulty text,
  number_of_questions integer not null default 5,
  include_answer_key boolean not null default false,
  worksheet_json jsonb not null default '{}'::jsonb,
  answer_key_json jsonb not null default '{}'::jsonb,
  source_model text not null default 'fallback-no-openai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  description text not null default '',
  activity_date date not null default current_date,
  evidence_type text not null default 'other',
  file_url text,
  storage_path text,
  parent_notes text,
  ai_summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_subject_tags (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  portfolio_item_id uuid not null references public.portfolio_items(id) on delete cascade,
  subject_area_id uuid not null references public.subject_areas(id) on delete cascade,
  confidence_score numeric(5,2) not null default 1.0,
  rationale text,
  tagged_by text not null default 'parent',
  reviewer_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (portfolio_item_id, subject_area_id)
);

create table if not exists public.review_packets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  review_period_start date not null,
  review_period_end date not null,
  current_status text not null default 'draft',
  coverage_snapshot jsonb not null default '{}'::jsonb,
  packet_json jsonb not null default '{}'::jsonb,
  ai_summary text,
  parent_notes text,
  submitted_for_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviewer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  active boolean not null default true,
  max_family_load integer not null default 20,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviewer_assignments (
  id uuid primary key default gen_random_uuid(),
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reviewer_user_id, family_id, student_id)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  review_packet_id uuid not null unique references public.review_packets(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  reviewer_user_id uuid references auth.users(id) on delete set null,
  decision text not null default 'awaiting_review',
  reviewer_summary text,
  correction_notes text,
  due_date date,
  approved_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.review_findings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  subject_area_id uuid not null references public.subject_areas(id) on delete cascade,
  ai_summary text,
  reviewer_status text not null default 'weak',
  reviewer_note text,
  parent_action_needed text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (review_id, subject_area_id)
);

create table if not exists public.umbrella_enrollments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  enrollment_status text not null default 'draft',
  start_date date,
  end_date date,
  supervising_entity_status text not null default 'portfolio_support_only',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

create table if not exists public.guardian_agreements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  agreement_type text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  attended_on date not null default current_date,
  source_type text not null default 'parent_log',
  source_reference_id uuid,
  minutes integer not null default 0,
  subject_area_id uuid references public.subject_areas(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reading_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  activity_date date not null default current_date,
  title text not null,
  minutes integer not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  snapshot_date date not null default current_date,
  grade_level text,
  reading_level text,
  math_level text,
  science_level text,
  writing_level text,
  summary text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null,
  prompt_summary text not null,
  model_used text not null,
  output_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references public.families(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_type text not null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  review_packet_id uuid references public.review_packets(id) on delete set null,
  title text not null,
  document_type text not null default 'review_packet',
  file_url text,
  storage_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments_placeholder (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  status text not null default 'pending_setup',
  stripe_customer_id text,
  stripe_subscription_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.families (household_id, name, primary_contact_user_id)
select
  households.id,
  households.name,
  households.created_by
from public.households
on conflict (household_id) do update
set name = excluded.name,
    primary_contact_user_id = coalesce(public.families.primary_contact_user_id, excluded.primary_contact_user_id),
    updated_at = now();

update public.profiles
set display_name = coalesce(nullif(display_name, ''), nullif(full_name, ''), 'WSA Parent'),
    family_id = families.id
from public.families
where families.household_id = profiles.household_id
  and (profiles.family_id is null or profiles.display_name is null or profiles.display_name = '');

update public.students
set family_id = families.id
from public.families
where families.household_id = students.household_id
  and students.family_id is null;

update public.students
set first_name = coalesce(nullif(first_name, ''), split_part(name, ' ', 1)),
    last_name = case
      when last_name is not null and last_name <> '' then last_name
      when strpos(trim(name), ' ') > 0 then trim(substr(trim(name), strpos(trim(name), ' ') + 1))
      else null
    end,
    grade_level = coalesce(
      nullif(grade_level, ''),
      case
        when age <= 5 then 'kindergarten'
        when age = 6 then '1'
        when age = 7 then '2'
        when age = 8 then '3'
        when age = 9 then '4'
        when age = 10 then '5'
        when age = 11 then '6'
        when age = 12 then '7'
        when age = 13 then '8'
        when age = 14 then '9'
        when age = 15 then '10'
        when age = 16 then '11'
        when age >= 17 then '12'
        else 'mixed'
      end
    ),
    math_level = coalesce(nullif(math_level, ''), 'addition_subtraction'),
    science_level = coalesce(nullif(science_level, ''), 'general'),
    writing_level = coalesce(nullif(writing_level, ''), 'developing'),
    reading_level = coalesce(reading_level, 'early_reader')
where true;

with ranked_students as (
  select id, row_number() over (partition by household_id order by created_at asc, id asc) as row_num
  from public.students
)
update public.students
set active = ranked_students.row_num = 1
from ranked_students
where ranked_students.id = students.id
  and not exists (
    select 1
    from public.students existing
    where existing.household_id = students.household_id
      and existing.active = true
  );

insert into public.subject_areas (slug, name)
values
  ('english', 'English'),
  ('mathematics', 'Mathematics'),
  ('science', 'Science'),
  ('social-studies', 'Social Studies'),
  ('art', 'Art'),
  ('music', 'Music'),
  ('health', 'Health'),
  ('physical-education', 'Physical Education')
on conflict (slug) do update
set name = excluded.name,
    updated_at = now();

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'students_reading_level_check'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students drop constraint students_reading_level_check;
  end if;
end
$$;

alter table public.students
  add constraint students_reading_level_check
  check (
    reading_level in (
      'just starting',
      'knows letter sounds',
      'knows simple words (3-5 letters)',
      'knows more complex words (5-12 letters)',
      'reads small books with a little help',
      'reads small books without help',
      'reads any book with some help',
      'reads any book without help',
      'pre_reader',
      'letter_sounds',
      'blending',
      'early_reader',
      'independent_reader',
      'advanced_reader'
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('parent', 'student', 'reviewer', 'admin', 'super_admin'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'students_math_level_check'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_math_level_check
      check (
        math_level is null or math_level in (
          'pre_k',
          'counting',
          'addition_subtraction',
          'place_value',
          'multiplication_division',
          'fractions',
          'pre_algebra',
          'algebra',
          'geometry'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'portfolio_items_evidence_type_check'
      and conrelid = 'public.portfolio_items'::regclass
  ) then
    alter table public.portfolio_items
      add constraint portfolio_items_evidence_type_check
      check (
        evidence_type in (
          'worksheet',
          'photo',
          'video',
          'reading_log',
          'writing_sample',
          'math_work',
          'science_observation',
          'outdoor_activity',
          'class_attendance',
          'art_project',
          'music_activity',
          'health_activity',
          'pe_activity',
          'parent_note',
          'other'
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'portfolio_subject_tags_tagged_by_check'
      and conrelid = 'public.portfolio_subject_tags'::regclass
  ) then
    alter table public.portfolio_subject_tags
      add constraint portfolio_subject_tags_tagged_by_check
      check (tagged_by in ('ai', 'parent', 'reviewer'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'review_packets_current_status_check'
      and conrelid = 'public.review_packets'::regclass
  ) then
    alter table public.review_packets
      add constraint review_packets_current_status_check
      check (current_status in ('draft', 'submitted', 'under_review', 'approved', 'needs_correction', 'rejected'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reviews_decision_check'
      and conrelid = 'public.reviews'::regclass
  ) then
    alter table public.reviews
      add constraint reviews_decision_check
      check (decision in ('awaiting_review', 'in_review', 'approved', 'needs_correction', 'rejected'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'review_findings_status_check'
      and conrelid = 'public.review_findings'::regclass
  ) then
    alter table public.review_findings
      add constraint review_findings_status_check
      check (reviewer_status in ('sufficient', 'weak', 'missing'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'umbrella_enrollments_status_check'
      and conrelid = 'public.umbrella_enrollments'::regclass
  ) then
    alter table public.umbrella_enrollments
      add constraint umbrella_enrollments_status_check
      check (enrollment_status in ('draft', 'active', 'paused', 'withdrawn', 'graduated'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'umbrella_enrollments_supervising_entity_status_check'
      and conrelid = 'public.umbrella_enrollments'::regclass
  ) then
    alter table public.umbrella_enrollments
      add constraint umbrella_enrollments_supervising_entity_status_check
      check (supervising_entity_status in ('portfolio_support_only', 'partner_umbrella', 'wsa_registered_umbrella'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'audit_logs_actor_type_check'
      and conrelid = 'public.audit_logs'::regclass
  ) then
    alter table public.audit_logs
      add constraint audit_logs_actor_type_check
      check (actor_type in ('parent', 'reviewer', 'admin', 'ai', 'system'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'ai_generation_logs_feature_check'
      and conrelid = 'public.ai_generation_logs'::regclass
  ) then
    alter table public.ai_generation_logs
      add constraint ai_generation_logs_feature_check
      check (feature in ('lesson_planner', 'worksheet_generator', 'portfolio_tagger', 'review_summarizer'));
  end if;
end
$$;

create index if not exists families_household_id_idx
  on public.families (household_id);

create index if not exists profiles_family_id_idx
  on public.profiles (family_id);

create index if not exists students_family_id_idx
  on public.students (family_id, created_at desc);

create index if not exists students_active_idx
  on public.students (family_id, active desc, created_at desc);

create index if not exists lesson_plans_family_id_idx
  on public.lesson_plans (family_id, created_at desc);

create index if not exists lesson_plans_student_id_idx
  on public.lesson_plans (student_id, plan_date desc);

create index if not exists daily_assignments_student_id_idx
  on public.daily_assignments (student_id, created_at desc);

create index if not exists daily_assignments_subject_area_id_idx
  on public.daily_assignments (subject_area_id, created_at desc);

create index if not exists worksheets_family_id_idx
  on public.worksheets (family_id, created_at desc);

create index if not exists worksheets_student_id_idx
  on public.worksheets (student_id, created_at desc);

create index if not exists worksheets_subject_area_id_idx
  on public.worksheets (subject_area_id, created_at desc);

create index if not exists portfolio_items_family_id_idx
  on public.portfolio_items (family_id, activity_date desc, created_at desc);

create index if not exists portfolio_items_student_id_idx
  on public.portfolio_items (student_id, activity_date desc, created_at desc);

create index if not exists portfolio_subject_tags_subject_area_id_idx
  on public.portfolio_subject_tags (subject_area_id, created_at desc);

create index if not exists portfolio_subject_tags_portfolio_item_id_idx
  on public.portfolio_subject_tags (portfolio_item_id, created_at desc);

create index if not exists review_packets_family_id_idx
  on public.review_packets (family_id, created_at desc);

create index if not exists review_packets_student_id_idx
  on public.review_packets (student_id, created_at desc);

create index if not exists reviews_family_id_idx
  on public.reviews (family_id, created_at desc);

create index if not exists reviews_student_id_idx
  on public.reviews (student_id, created_at desc);

create index if not exists reviews_reviewer_user_id_idx
  on public.reviews (reviewer_user_id, created_at desc);

create index if not exists review_findings_review_id_idx
  on public.review_findings (review_id, created_at desc);

create index if not exists review_findings_subject_area_id_idx
  on public.review_findings (subject_area_id, created_at desc);

create index if not exists reviewer_assignments_family_id_idx
  on public.reviewer_assignments (family_id, created_at desc);

create index if not exists reviewer_assignments_student_id_idx
  on public.reviewer_assignments (student_id, created_at desc);

create index if not exists reviewer_assignments_reviewer_user_id_idx
  on public.reviewer_assignments (reviewer_user_id, created_at desc);

create index if not exists umbrella_enrollments_family_id_idx
  on public.umbrella_enrollments (family_id, created_at desc);

create index if not exists umbrella_enrollments_student_id_idx
  on public.umbrella_enrollments (student_id, created_at desc);

create index if not exists attendance_logs_family_id_idx
  on public.attendance_logs (family_id, attended_on desc, created_at desc);

create index if not exists attendance_logs_student_id_idx
  on public.attendance_logs (student_id, attended_on desc, created_at desc);

create index if not exists attendance_logs_subject_area_id_idx
  on public.attendance_logs (subject_area_id, created_at desc);

create index if not exists reading_logs_family_id_idx
  on public.reading_logs (family_id, activity_date desc, created_at desc);

create index if not exists reading_logs_student_id_idx
  on public.reading_logs (student_id, activity_date desc, created_at desc);

create index if not exists progress_snapshots_family_id_idx
  on public.progress_snapshots (family_id, snapshot_date desc, created_at desc);

create index if not exists progress_snapshots_student_id_idx
  on public.progress_snapshots (student_id, snapshot_date desc, created_at desc);

create index if not exists ai_generation_logs_family_id_idx
  on public.ai_generation_logs (family_id, created_at desc);

create index if not exists ai_generation_logs_student_id_idx
  on public.ai_generation_logs (student_id, created_at desc);

create index if not exists audit_logs_family_id_idx
  on public.audit_logs (family_id, created_at desc);

create index if not exists audit_logs_student_id_idx
  on public.audit_logs (student_id, created_at desc);

create index if not exists documents_family_id_idx
  on public.documents (family_id, created_at desc);

create index if not exists documents_student_id_idx
  on public.documents (student_id, created_at desc);

create index if not exists payments_placeholder_family_id_idx
  on public.payments_placeholder (family_id, created_at desc);

create index if not exists payments_placeholder_student_id_idx
  on public.payments_placeholder (student_id, created_at desc);

create or replace function public.get_current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select profiles.role from public.profiles where profiles.id = auth.uid()), 'parent')
$$;

create or replace function public.has_app_role(check_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_current_profile_role() = any(check_roles)
$$;

create or replace function public.can_manage_umbrella_records()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_app_role(array['admin', 'super_admin'])
$$;

create or replace function public.can_access_family(check_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.families
    where families.id = check_family_id
      and public.is_household_member(families.household_id)
  )
  or public.can_manage_umbrella_records()
$$;

create or replace function public.can_review_family(check_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_umbrella_records()
    or exists (
      select 1
      from public.reviewer_assignments
      where reviewer_assignments.family_id = check_family_id
        and reviewer_assignments.reviewer_user_id = auth.uid()
        and reviewer_assignments.active = true
    )
$$;

create or replace function public.can_review_student(check_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_umbrella_records()
    or exists (
      select 1
      from public.students
      join public.reviewer_assignments
        on reviewer_assignments.family_id = students.family_id
      where students.id = check_student_id
        and reviewer_assignments.reviewer_user_id = auth.uid()
        and reviewer_assignments.active = true
        and (
          reviewer_assignments.student_id is null
          or reviewer_assignments.student_id = students.id
        )
    )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_families on public.families;
create trigger set_updated_at_families
before update on public.families
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_lesson_plans on public.lesson_plans;
create trigger set_updated_at_lesson_plans
before update on public.lesson_plans
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_daily_assignments on public.daily_assignments;
create trigger set_updated_at_daily_assignments
before update on public.daily_assignments
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_worksheets on public.worksheets;
create trigger set_updated_at_worksheets
before update on public.worksheets
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_portfolio_items on public.portfolio_items;
create trigger set_updated_at_portfolio_items
before update on public.portfolio_items
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_portfolio_subject_tags on public.portfolio_subject_tags;
create trigger set_updated_at_portfolio_subject_tags
before update on public.portfolio_subject_tags
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_review_packets on public.review_packets;
create trigger set_updated_at_review_packets
before update on public.review_packets
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_reviews on public.reviews;
create trigger set_updated_at_reviews
before update on public.reviews
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_review_findings on public.review_findings;
create trigger set_updated_at_review_findings
before update on public.review_findings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_reviewer_profiles on public.reviewer_profiles;
create trigger set_updated_at_reviewer_profiles
before update on public.reviewer_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_reviewer_assignments on public.reviewer_assignments;
create trigger set_updated_at_reviewer_assignments
before update on public.reviewer_assignments
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_umbrella_enrollments on public.umbrella_enrollments;
create trigger set_updated_at_umbrella_enrollments
before update on public.umbrella_enrollments
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_guardian_agreements on public.guardian_agreements;
create trigger set_updated_at_guardian_agreements
before update on public.guardian_agreements
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_attendance_logs on public.attendance_logs;
create trigger set_updated_at_attendance_logs
before update on public.attendance_logs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_reading_logs on public.reading_logs;
create trigger set_updated_at_reading_logs
before update on public.reading_logs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_progress_snapshots on public.progress_snapshots;
create trigger set_updated_at_progress_snapshots
before update on public.progress_snapshots
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_ai_generation_logs on public.ai_generation_logs;
create trigger set_updated_at_ai_generation_logs
before update on public.ai_generation_logs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_audit_logs on public.audit_logs;
create trigger set_updated_at_audit_logs
before update on public.audit_logs
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_documents on public.documents;
create trigger set_updated_at_documents
before update on public.documents
for each row execute procedure public.set_updated_at();

drop trigger if exists set_updated_at_payments_placeholder on public.payments_placeholder;
create trigger set_updated_at_payments_placeholder
before update on public.payments_placeholder
for each row execute procedure public.set_updated_at();

alter table public.families enable row level security;
alter table public.subject_areas enable row level security;
alter table public.lesson_plans enable row level security;
alter table public.daily_assignments enable row level security;
alter table public.worksheets enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.portfolio_subject_tags enable row level security;
alter table public.review_packets enable row level security;
alter table public.reviewer_profiles enable row level security;
alter table public.reviewer_assignments enable row level security;
alter table public.reviews enable row level security;
alter table public.review_findings enable row level security;
alter table public.umbrella_enrollments enable row level security;
alter table public.guardian_agreements enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.reading_logs enable row level security;
alter table public.progress_snapshots enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.documents enable row level security;
alter table public.payments_placeholder enable row level security;

drop policy if exists "families readable by members and reviewers" on public.families;
create policy "families readable by members and reviewers"
on public.families for select
using (public.can_access_family(id) or public.can_review_family(id));

drop policy if exists "families writable by members and admins" on public.families;
create policy "families writable by members and admins"
on public.families for insert
with check (
  public.can_manage_umbrella_records()
  or exists (
    select 1
    from public.households
    where households.id = families.household_id
      and public.is_household_member(households.id)
  )
);

drop policy if exists "families updatable by members and admins" on public.families;
create policy "families updatable by members and admins"
on public.families for update
using (public.can_access_family(id) or public.can_manage_umbrella_records())
with check (public.can_access_family(id) or public.can_manage_umbrella_records());

drop policy if exists "subject areas readable by authenticated users" on public.subject_areas;
create policy "subject areas readable by authenticated users"
on public.subject_areas for select
using (auth.uid() is not null);

drop policy if exists "lesson plans readable by family and reviewers" on public.lesson_plans;
create policy "lesson plans readable by family and reviewers"
on public.lesson_plans for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "lesson plans writable by family" on public.lesson_plans;
create policy "lesson plans writable by family"
on public.lesson_plans for insert
with check (public.can_access_family(family_id));

drop policy if exists "lesson plans updatable by family and admins" on public.lesson_plans;
create policy "lesson plans updatable by family and admins"
on public.lesson_plans for update
using (public.can_access_family(family_id) or public.can_manage_umbrella_records())
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "daily assignments readable by family and reviewers" on public.daily_assignments;
create policy "daily assignments readable by family and reviewers"
on public.daily_assignments for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "daily assignments writable by family" on public.daily_assignments;
create policy "daily assignments writable by family"
on public.daily_assignments for insert
with check (public.can_access_family(family_id));

drop policy if exists "daily assignments updatable by family and admins" on public.daily_assignments;
create policy "daily assignments updatable by family and admins"
on public.daily_assignments for update
using (public.can_access_family(family_id) or public.can_manage_umbrella_records())
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "worksheets readable by family and reviewers" on public.worksheets;
create policy "worksheets readable by family and reviewers"
on public.worksheets for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "worksheets writable by family" on public.worksheets;
create policy "worksheets writable by family"
on public.worksheets for insert
with check (public.can_access_family(family_id));

drop policy if exists "worksheets updatable by family and admins" on public.worksheets;
create policy "worksheets updatable by family and admins"
on public.worksheets for update
using (public.can_access_family(family_id) or public.can_manage_umbrella_records())
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "portfolio items readable by family and reviewers" on public.portfolio_items;
create policy "portfolio items readable by family and reviewers"
on public.portfolio_items for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "portfolio items writable by family" on public.portfolio_items;
create policy "portfolio items writable by family"
on public.portfolio_items for insert
with check (public.can_access_family(family_id));

drop policy if exists "portfolio items updatable by family and admins" on public.portfolio_items;
create policy "portfolio items updatable by family and admins"
on public.portfolio_items for update
using (public.can_access_family(family_id) or public.can_manage_umbrella_records())
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "portfolio subject tags readable by family and reviewers" on public.portfolio_subject_tags;
create policy "portfolio subject tags readable by family and reviewers"
on public.portfolio_subject_tags for select
using (public.can_access_family(family_id) or public.can_manage_umbrella_records() or public.can_review_family(family_id));

drop policy if exists "portfolio subject tags writable by family and reviewers" on public.portfolio_subject_tags;
create policy "portfolio subject tags writable by family and reviewers"
on public.portfolio_subject_tags for insert
with check (public.can_access_family(family_id) or public.can_review_family(family_id));

drop policy if exists "portfolio subject tags updatable by family and reviewers" on public.portfolio_subject_tags;
create policy "portfolio subject tags updatable by family and reviewers"
on public.portfolio_subject_tags for update
using (public.can_access_family(family_id) or public.can_review_family(family_id))
with check (public.can_access_family(family_id) or public.can_review_family(family_id));

drop policy if exists "review packets readable by family and reviewers" on public.review_packets;
create policy "review packets readable by family and reviewers"
on public.review_packets for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "review packets writable by family" on public.review_packets;
create policy "review packets writable by family"
on public.review_packets for insert
with check (public.can_access_family(family_id));

drop policy if exists "review packets updatable by family and reviewers" on public.review_packets;
create policy "review packets updatable by family and reviewers"
on public.review_packets for update
using (public.can_access_family(family_id) or public.can_review_student(student_id))
with check (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "reviewer profiles readable by staff" on public.reviewer_profiles;
create policy "reviewer profiles readable by staff"
on public.reviewer_profiles for select
using (public.can_manage_umbrella_records() or auth.uid() = user_id);

drop policy if exists "reviewer profiles writable by admins" on public.reviewer_profiles;
create policy "reviewer profiles writable by admins"
on public.reviewer_profiles for insert
with check (public.can_manage_umbrella_records());

drop policy if exists "reviewer profiles updatable by admins" on public.reviewer_profiles;
create policy "reviewer profiles updatable by admins"
on public.reviewer_profiles for update
using (public.can_manage_umbrella_records())
with check (public.can_manage_umbrella_records());

drop policy if exists "reviewer assignments readable by staff and families" on public.reviewer_assignments;
create policy "reviewer assignments readable by staff and families"
on public.reviewer_assignments for select
using (
  public.can_manage_umbrella_records()
  or auth.uid() = reviewer_user_id
  or public.can_access_family(family_id)
);

drop policy if exists "reviewer assignments writable by admins" on public.reviewer_assignments;
create policy "reviewer assignments writable by admins"
on public.reviewer_assignments for insert
with check (public.can_manage_umbrella_records());

drop policy if exists "reviewer assignments updatable by admins" on public.reviewer_assignments;
create policy "reviewer assignments updatable by admins"
on public.reviewer_assignments for update
using (public.can_manage_umbrella_records())
with check (public.can_manage_umbrella_records());

drop policy if exists "reviews readable by family and reviewers" on public.reviews;
create policy "reviews readable by family and reviewers"
on public.reviews for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "reviews writable by family and reviewers" on public.reviews;
create policy "reviews writable by family and reviewers"
on public.reviews for insert
with check (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "reviews updatable by family and reviewers" on public.reviews;
create policy "reviews updatable by family and reviewers"
on public.reviews for update
using (public.can_access_family(family_id) or public.can_review_student(student_id))
with check (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "review findings readable by family and reviewers" on public.review_findings;
create policy "review findings readable by family and reviewers"
on public.review_findings for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "review findings writable by family and reviewers" on public.review_findings;
create policy "review findings writable by family and reviewers"
on public.review_findings for insert
with check (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "review findings updatable by family and reviewers" on public.review_findings;
create policy "review findings updatable by family and reviewers"
on public.review_findings for update
using (public.can_access_family(family_id) or public.can_review_student(student_id))
with check (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "umbrella enrollments readable by family and reviewers" on public.umbrella_enrollments;
create policy "umbrella enrollments readable by family and reviewers"
on public.umbrella_enrollments for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "umbrella enrollments writable by admins" on public.umbrella_enrollments;
create policy "umbrella enrollments writable by admins"
on public.umbrella_enrollments for insert
with check (public.can_manage_umbrella_records());

drop policy if exists "umbrella enrollments updatable by admins" on public.umbrella_enrollments;
create policy "umbrella enrollments updatable by admins"
on public.umbrella_enrollments for update
using (public.can_manage_umbrella_records())
with check (public.can_manage_umbrella_records());

drop policy if exists "guardian agreements readable by family and admins" on public.guardian_agreements;
create policy "guardian agreements readable by family and admins"
on public.guardian_agreements for select
using (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "guardian agreements writable by family" on public.guardian_agreements;
create policy "guardian agreements writable by family"
on public.guardian_agreements for insert
with check (public.can_access_family(family_id));

drop policy if exists "attendance logs readable by family and reviewers" on public.attendance_logs;
create policy "attendance logs readable by family and reviewers"
on public.attendance_logs for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "attendance logs writable by family and admins" on public.attendance_logs;
create policy "attendance logs writable by family and admins"
on public.attendance_logs for insert
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "attendance logs updatable by family and admins" on public.attendance_logs;
create policy "attendance logs updatable by family and admins"
on public.attendance_logs for update
using (public.can_access_family(family_id) or public.can_manage_umbrella_records())
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "reading logs readable by family and reviewers" on public.reading_logs;
create policy "reading logs readable by family and reviewers"
on public.reading_logs for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "reading logs writable by family and admins" on public.reading_logs;
create policy "reading logs writable by family and admins"
on public.reading_logs for insert
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "reading logs updatable by family and admins" on public.reading_logs;
create policy "reading logs updatable by family and admins"
on public.reading_logs for update
using (public.can_access_family(family_id) or public.can_manage_umbrella_records())
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "progress snapshots readable by family and reviewers" on public.progress_snapshots;
create policy "progress snapshots readable by family and reviewers"
on public.progress_snapshots for select
using (public.can_access_family(family_id) or public.can_review_student(student_id));

drop policy if exists "progress snapshots writable by family and admins" on public.progress_snapshots;
create policy "progress snapshots writable by family and admins"
on public.progress_snapshots for insert
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "ai generation logs readable by family and reviewers" on public.ai_generation_logs;
create policy "ai generation logs readable by family and reviewers"
on public.ai_generation_logs for select
using (
  (family_id is not null and public.can_access_family(family_id))
  or (student_id is not null and public.can_review_student(student_id))
  or public.can_manage_umbrella_records()
);

drop policy if exists "ai generation logs writable by authenticated app users" on public.ai_generation_logs;
create policy "ai generation logs writable by authenticated app users"
on public.ai_generation_logs for insert
with check (
  auth.uid() is not null
  and (
    family_id is null
    or public.can_access_family(family_id)
    or public.can_review_family(family_id)
  )
);

drop policy if exists "audit logs readable by family and reviewers" on public.audit_logs;
create policy "audit logs readable by family and reviewers"
on public.audit_logs for select
using (
  (family_id is not null and public.can_access_family(family_id))
  or (student_id is not null and public.can_review_student(student_id))
  or public.can_manage_umbrella_records()
  or actor_id = auth.uid()
);

drop policy if exists "audit logs writable by authenticated app users" on public.audit_logs;
create policy "audit logs writable by authenticated app users"
on public.audit_logs for insert
with check (
  auth.uid() is not null
  and (
    family_id is null
    or public.can_access_family(family_id)
    or public.can_review_family(family_id)
    or public.can_manage_umbrella_records()
  )
);

drop policy if exists "documents readable by family and reviewers" on public.documents;
create policy "documents readable by family and reviewers"
on public.documents for select
using (
  public.can_access_family(family_id)
  or (student_id is not null and public.can_review_student(student_id))
  or public.can_manage_umbrella_records()
);

drop policy if exists "documents writable by family and admins" on public.documents;
create policy "documents writable by family and admins"
on public.documents for insert
with check (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "payments placeholder readable by family and admins" on public.payments_placeholder;
create policy "payments placeholder readable by family and admins"
on public.payments_placeholder for select
using (public.can_access_family(family_id) or public.can_manage_umbrella_records());

drop policy if exists "payments placeholder writable by admins" on public.payments_placeholder;
create policy "payments placeholder writable by admins"
on public.payments_placeholder for insert
with check (public.can_manage_umbrella_records());

insert into storage.buckets (id, name, public)
values ('portfolio-evidence', 'portfolio-evidence', false)
on conflict (id) do nothing;

drop policy if exists "portfolio evidence upload by family" on storage.objects;
create policy "portfolio evidence upload by family"
on storage.objects for insert
with check (
  bucket_id = 'portfolio-evidence'
  and auth.uid() is not null
  and exists (
    select 1
    from public.families
    where families.id::text = split_part(name, '/', 1)
      and public.can_access_family(families.id)
  )
);

drop policy if exists "portfolio evidence read by family and reviewers" on storage.objects;
create policy "portfolio evidence read by family and reviewers"
on storage.objects for select
using (
  bucket_id = 'portfolio-evidence'
  and exists (
    select 1
    from public.families
    where families.id::text = split_part(name, '/', 1)
      and (public.can_access_family(families.id) or public.can_review_family(families.id))
  )
);

drop policy if exists "portfolio evidence update by family" on storage.objects;
create policy "portfolio evidence update by family"
on storage.objects for update
using (
  bucket_id = 'portfolio-evidence'
  and exists (
    select 1
    from public.families
    where families.id::text = split_part(name, '/', 1)
      and public.can_access_family(families.id)
  )
)
with check (
  bucket_id = 'portfolio-evidence'
  and exists (
    select 1
    from public.families
    where families.id::text = split_part(name, '/', 1)
      and public.can_access_family(families.id)
  )
);

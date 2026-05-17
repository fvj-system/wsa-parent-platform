create table if not exists public.field_quests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  description text not null,
  location_type text not null,
  exact_location text,
  state_code text,
  county_name text,
  latitude double precision,
  longitude double precision,
  difficulty_level text not null default 'easy',
  estimated_time text not null,
  age_range text not null,
  subject_tags text[] not null default '{}'::text[],
  checklist_json jsonb not null default '[]'::jsonb,
  clue_text text,
  requires_photo boolean not null default false,
  requires_note boolean not null default false,
  badge_name text not null,
  badge_description text not null,
  linked_class_id uuid references public.classes(id) on delete set null,
  is_backyard_friendly boolean not null default false,
  is_park_quest boolean not null default false,
  is_creek_water boolean not null default false,
  is_history boolean not null default false,
  is_animal boolean not null default false,
  is_easy_young_kids boolean not null default false,
  status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists field_quests_status_updated_idx
  on public.field_quests (status, updated_at desc);

create index if not exists field_quests_state_county_idx
  on public.field_quests (state_code, county_name, status);

create table if not exists public.field_quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.field_quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status text not null default 'completed'
    check (status in ('completed')),
  checklist_progress jsonb not null default '[]'::jsonb,
  note text,
  photo_path text,
  photo_url text,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists field_quest_completions_student_quest_unique_idx
  on public.field_quest_completions (student_id, quest_id);

create index if not exists field_quest_completions_household_completed_idx
  on public.field_quest_completions (household_id, completed_at desc);

create table if not exists public.field_quest_events (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid references public.field_quests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  household_id uuid references public.households(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  event_type text not null
    check (event_type in ('page_view', 'start', 'completion', 'signup_click', 'signup_completed', 'class_click', 'app_open_click')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists field_quest_events_quest_type_created_idx
  on public.field_quest_events (quest_id, event_type, created_at desc);

alter table public.activity_completions
  add column if not exists source_field_quest_id uuid references public.field_quests(id) on delete set null;

alter table public.portfolio_entries
  add column if not exists source_field_quest_id uuid references public.field_quests(id) on delete set null;

drop index if exists activity_completions_field_quest_unique_idx;
create unique index if not exists activity_completions_field_quest_unique_idx
  on public.activity_completions (student_id, source_field_quest_id)
  where source_field_quest_id is not null;

drop index if exists portfolio_entries_field_quest_unique_idx;
create unique index if not exists portfolio_entries_field_quest_unique_idx
  on public.portfolio_entries (student_id, source_field_quest_id)
  where source_field_quest_id is not null;

alter table public.activity_completions
  drop constraint if exists activity_completions_activity_type_check;

alter table public.activity_completions
  add constraint activity_completions_activity_type_check
  check (
    activity_type in (
      'daily_adventure',
      'animal_of_the_day',
      'week_planner',
      'lesson_generator',
      'nature_discovery',
      'in_person_class',
      'field_quest'
    )
  );

alter table public.field_quests enable row level security;
alter table public.field_quest_completions enable row level security;
alter table public.field_quest_events enable row level security;

drop policy if exists "field quests readable by everyone" on public.field_quests;
create policy "field quests readable by everyone"
on public.field_quests for select
using (status = 'published');

drop policy if exists "field quest completions readable by household" on public.field_quest_completions;
create policy "field quest completions readable by household"
on public.field_quest_completions for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "field quest completions writable by household" on public.field_quest_completions;
create policy "field quest completions writable by household"
on public.field_quest_completions for insert
to authenticated
with check (
  public.is_household_member(household_id)
  and auth.uid() = user_id
);

drop policy if exists "field quest completions updatable by household" on public.field_quest_completions;
create policy "field quest completions updatable by household"
on public.field_quest_completions for update
to authenticated
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

drop policy if exists "field quest events insertable by everyone" on public.field_quest_events;
create policy "field quest events insertable by everyone"
on public.field_quest_events for insert
with check (true);

insert into public.badges (name, description, category, icon, criteria_json)
select seed.name, seed.description, 'Field Quest', 'compass', jsonb_build_object('source', 'field_quest')
from (
  values
    ('Creek Detective', 'Completed the Creek Detective Field Quest and documented what was found near the water.', 'Earned by finishing the Creek Detective Quest.'),
    ('Camouflage Scout', 'Completed the Camouflage Scout Field Quest and noticed how creatures blend into the world around them.', 'Earned by finishing the Camouflage Scout Quest.'),
    ('Maryland Turtle Tracker', 'Completed the Maryland Turtle Tracker Field Quest and recorded turtle clues with care.', 'Earned by finishing the Maryland Turtle Tracker Quest.'),
    ('Junior Naturalist Starter', 'Completed the Junior Naturalist Starter Field Quest and built a first real outdoor field record.', 'Earned by finishing the Junior Naturalist Starter Quest.')
) as seed(name, description, criteria)
where not exists (
  select 1
  from public.badges
  where badges.name = seed.name
);

insert into public.field_quests (
  slug,
  title,
  short_description,
  description,
  location_type,
  exact_location,
  state_code,
  county_name,
  latitude,
  longitude,
  difficulty_level,
  estimated_time,
  age_range,
  subject_tags,
  checklist_json,
  clue_text,
  requires_photo,
  requires_note,
  badge_name,
  badge_description,
  is_backyard_friendly,
  is_park_quest,
  is_creek_water,
  is_history,
  is_animal,
  is_easy_young_kids,
  status
)
select *
from (
  values
    (
      'creek-detective-quest',
      'Creek Detective Quest',
      'Follow the water, notice signs of life, and document what the creek is teaching your family.',
      'This Field Quest turns a creek walk into a simple science-and-language mission. Families look for moving water clues, animal evidence, and one sketch-worthy detail, then save a short field record for homeschool documentation.',
      'Creek walk or park trail',
      'Any safe creek edge, shallow stream access point, or family-friendly waterside trail',
      'MD',
      'St. Mary''s',
      38.2853,
      -76.6355,
      'moderate',
      '35-50 minutes',
      '6-14',
      array['Science','Language Arts','Physical Education','creek/water','park quest'],
      jsonb_build_array(
        jsonb_build_object('id', 'water-clue', 'label', 'Find one clue that shows how the water is moving.'),
        jsonb_build_object('id', 'life-sign', 'label', 'Notice one sign of animal or insect life near the creek.'),
        jsonb_build_object('id', 'quiet-observation', 'label', 'Stay quiet for one minute and write or tell what changed.'),
        jsonb_build_object('id', 'family-photo', 'label', 'Take one proof photo of the place or your discovery.')
      ),
      'Look where water slows down, where tracks gather, or where plants lean toward the light.',
      true,
      true,
      'Creek Detective',
      'Completed the Creek Detective Field Quest and documented what was found near the water.',
      false,
      true,
      true,
      false,
      true,
      false,
      'published'
    ),
    (
      'camouflage-scout-quest',
      'Camouflage Scout Quest',
      'Train your eyes to spot colors, shapes, and patterns that help living things hide.',
      'This quick Field Quest helps young naturalists slow down and look carefully. Families search for colors, patterns, and shapes that help plants, insects, birds, or other animals blend into the world around them.',
      'Backyard, trail edge, or schoolyard',
      'Any place with leaves, bark, grass, fences, stones, or layered natural textures',
      'MD',
      'Calvert',
      38.5393,
      -76.5863,
      'easy',
      '20-30 minutes',
      '4-10',
      array['Science','Art','Language Arts','animal quest','backyard friendly','easy for young kids'],
      jsonb_build_array(
        jsonb_build_object('id', 'same-color', 'label', 'Find something living that almost matches its background.'),
        jsonb_build_object('id', 'pattern-match', 'label', 'Describe one pattern that helps it hide.'),
        jsonb_build_object('id', 'draw-it', 'label', 'Sketch or photograph the hidden object or creature.'),
        jsonb_build_object('id', 'say-why', 'label', 'Explain why camouflage would help it stay safe.')
      ),
      'Try bark, leaves, fence posts, dry grass, or shadowy places first.',
      true,
      true,
      'Camouflage Scout',
      'Completed the Camouflage Scout Field Quest and noticed how creatures blend into the world around them.',
      true,
      false,
      false,
      false,
      true,
      true,
      'published'
    ),
    (
      'maryland-turtle-tracker-quest',
      'Maryland Turtle Tracker Quest',
      'Look for shells, basking spots, and wetland clues while learning how to observe turtles safely.',
      'This Maryland-focused Field Quest helps families notice turtle habitat, identify safe observation zones, and build a careful field record without disturbing wildlife. It works well before or after a wetland trip, park visit, or turtle-themed class.',
      'Pond, marsh, or wetland boardwalk',
      'Any legal public place where turtles might bask near logs, rocks, or calm water edges',
      'MD',
      'Anne Arundel',
      39.0438,
      -76.6413,
      'moderate',
      '30-45 minutes',
      '6-14',
      array['Science','Social Studies','Art','animal quest','creek/water','park quest'],
      jsonb_build_array(
        jsonb_build_object('id', 'habitat', 'label', 'Find one place where a turtle could bask or hide.'),
        jsonb_build_object('id', 'respect', 'label', 'Write or say one safety rule for observing turtles without touching them.'),
        jsonb_build_object('id', 'evidence', 'label', 'Capture one photo or drawing tied to turtle habitat clues.'),
        jsonb_build_object('id', 'maryland-connection', 'label', 'Record one thing this habitat tells you about Maryland wildlife.')
      ),
      'Look for sunny logs, still water, safe distance viewing spots, and shell-shaped shadows.',
      true,
      true,
      'Maryland Turtle Tracker',
      'Completed the Maryland Turtle Tracker Field Quest and recorded turtle clues with care.',
      false,
      true,
      true,
      false,
      true,
      false,
      'published'
    ),
    (
      'junior-naturalist-starter-quest',
      'Junior Naturalist Starter Quest',
      'A gentle starter mission for families who want one simple outdoor win today.',
      'This beginner-friendly Field Quest helps families build a first real outdoor learning record. It mixes noticing, movement, drawing, and speaking so even young children can finish it and feel proud of the result.',
      'Backyard or neighborhood green space',
      'Any safe outdoor place with a patch of sky, ground, and one living thing to observe',
      'MD',
      'Charles',
      38.5222,
      -77.0268,
      'easy',
      '15-25 minutes',
      '4-9',
      array['Science','Language Arts','Art','Physical Education','backyard friendly','easy for young kids'],
      jsonb_build_array(
        jsonb_build_object('id', 'living-thing', 'label', 'Find one living thing to watch closely.'),
        jsonb_build_object('id', 'move-body', 'label', 'Walk the area together and notice one sound, one color, and one texture.'),
        jsonb_build_object('id', 'draw-or-photo', 'label', 'Take a photo or make a quick sketch.'),
        jsonb_build_object('id', 'tell-story', 'label', 'Say or write one sentence about what you learned.')
      ),
      'Start with the easiest thing to notice first: a leaf, bug, bird, flower, or patch of sky.',
      true,
      true,
      'Junior Naturalist Starter',
      'Completed the Junior Naturalist Starter Field Quest and built a first real outdoor field record.',
      true,
      false,
      false,
      false,
      true,
      true,
      'published'
    )
) as seed(
  slug,
  title,
  short_description,
  description,
  location_type,
  exact_location,
  state_code,
  county_name,
  latitude,
  longitude,
  difficulty_level,
  estimated_time,
  age_range,
  subject_tags,
  checklist_json,
  clue_text,
  requires_photo,
  requires_note,
  badge_name,
  badge_description,
  is_backyard_friendly,
  is_park_quest,
  is_creek_water,
  is_history,
  is_animal,
  is_easy_young_kids,
  status
)
where not exists (
  select 1
  from public.field_quests
  where field_quests.slug = seed.slug
);

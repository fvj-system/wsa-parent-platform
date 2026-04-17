alter table public.students
  add column if not exists reading_level text;

update public.students
set reading_level = 'reads small books with a little help'
where reading_level is null;

alter table public.students
  alter column reading_level set default 'reads small books with a little help';

alter table public.students
  alter column reading_level set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_reading_level_check'
      and conrelid = 'public.students'::regclass
  ) then
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
          'reads any book without help'
        )
      );
  end if;
end
$$;

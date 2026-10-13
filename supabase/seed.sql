-- SAMPLE DATA FOR THE DEMO
-- Run this ONCE in the Supabase dashboard: SQL Editor -> paste -> Run.
-- It is safe to run again; it never creates duplicates.
--
-- BEFORE YOU RUN IT, change the two values just below:
--   v_programme    the programme code your students have (to see yours, run:
--                  select distinct programme_code from fieldnotes.students;)
--   v_admin_email  the email of an account you created in Supabase
--                  (Authentication -> Users -> Add user). That account becomes the admin.
--
-- What it does:
--   1. Switches on student course registration (the Register page is locked until this is on)
--   2. Adds a term, three courses, and a class for each course
--   3. Adds assessments and a published exam time for each class
--   4. Makes your admin account an admin
-- Note: the admin login only works once at least one class exists, which step 2 provides.

do $$
declare
  v_programme   text := 'SCS';            -- <-- change me
  v_admin_email text := 'admin@example.com';  -- <-- change me
  v_term        uuid;
  v_course      uuid;
  v_offering    uuid;
  c             record;
begin
  -- 1. Turn on registration
  insert into fieldnotes.registry_configuration (id, registration_submission_enabled)
  values (true, true)
  on conflict (id) do update
    set registration_submission_enabled = true, updated_at = now();

  -- 2. One term
  insert into fieldnotes.academic_terms (label) values ('Semester 1')
  on conflict (label) do nothing;
  select id into v_term from fieldnotes.academic_terms where label = 'Semester 1';

  -- 2-3. Three courses, each with a class, two assessments and an exam time
  for c in
    select * from (values
      ('SCS101', 'Introduction to Programming'),
      ('SCS102', 'Database Systems'),
      ('SCS103', 'Web Development')
    ) as t(code, name)
  loop
    insert into fieldnotes.courses (code, name) values (c.code, c.name)
    on conflict (code) do nothing;
    select id into v_course from fieldnotes.courses where code = c.code;

    insert into fieldnotes.course_offerings (course_id, term_id, programme_code, credits)
    values (v_course, v_term, v_programme, 10)
    on conflict (course_id, term_id, programme_code) do nothing;
    select id into v_offering from fieldnotes.course_offerings o
      where o.course_id = v_course and o.term_id = v_term and o.programme_code = v_programme;

    insert into fieldnotes.assessments (offering_id, label, kind, max_score)
    select v_offering, 'Coursework 1', 'coursework', 30
    where not exists (
      select 1 from fieldnotes.assessments a
      where a.offering_id = v_offering and a.label = 'Coursework 1');
    insert into fieldnotes.assessments (offering_id, label, kind, max_score)
    select v_offering, 'Final exam', 'exam', 70
    where not exists (
      select 1 from fieldnotes.assessments a
      where a.offering_id = v_offering and a.label = 'Final exam');

    insert into fieldnotes.exam_sessions (offering_id, starts_at, ends_at, venue, published)
    select
      v_offering,
      date_trunc('day', now() + interval '30 days') + interval '9 hours',
      date_trunc('day', now() + interval '30 days') + interval '12 hours',
      'Main Hall',
      true
    where not exists (
      select 1 from fieldnotes.exam_sessions e where e.offering_id = v_offering);
  end loop;

  -- 4. Make the chosen account an admin
  insert into fieldnotes_private.staff_assignments (auth_user_id, role)
  select u.id, 'admin' from auth.users u where u.email = v_admin_email
  on conflict do nothing;
  if not exists (select 1 from auth.users where email = v_admin_email) then
    raise notice 'No Supabase user has the email %. Create it under Authentication -> Users, then run this again.', v_admin_email;
  end if;
end $$;

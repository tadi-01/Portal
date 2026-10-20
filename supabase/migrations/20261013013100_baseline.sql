-- Fieldnotes final-state baseline for a fresh Supabase database.
-- Creates the final admin/student authorization model directly.

-- Development foundation. No fixture/personal data and no public signup provisioning.
-- Deliberately fail on existing names: inspect remote schema before applying.
begin;

create schema fieldnotes;
create schema fieldnotes_private;
revoke all on schema fieldnotes, fieldnotes_private from public, anon, authenticated;
grant usage on schema fieldnotes, fieldnotes_private to authenticated, service_role;

create table fieldnotes.students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete restrict,
  student_number text not null unique check (length(trim(student_number)) > 0),
  display_name text not null check (length(trim(display_name)) > 0),
  programme_code text not null,
  created_at timestamptz not null default now(),
  programme_name text,
  academic_year text,
  account_balance numeric(18,2) not null default 0,
  part integer check (part > 0),
  semester integer check (semester > 0),
  registration_status text
);
-- A null auth_user_id is an imported student awaiting account provisioning.
-- Only the trusted registry provisioning service may create/change that mapping.
create table fieldnotes.academic_terms (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  starts_on date,
  ends_on date,
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);
create table fieldnotes.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);
create table fieldnotes.course_offerings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references fieldnotes.courses(id),
  term_id uuid not null references fieldnotes.academic_terms(id),
  programme_code text not null,
  credits numeric not null check (credits > 0),
  unique (course_id, term_id, programme_code)
);
create table fieldnotes.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references fieldnotes.students(id),
  offering_id uuid not null references fieldnotes.course_offerings(id),
  unique (student_id, offering_id),
  unique (id, offering_id)
);
create table fieldnotes_private.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id),
  role text not null check (role = 'admin'),
  offering_id uuid references fieldnotes.course_offerings(id),
  check (offering_id is null),
  unique nulls not distinct (auth_user_id, role, offering_id)
);
create table fieldnotes.assessments (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references fieldnotes.course_offerings(id),
  label text not null,
  kind text not null check (kind in ('coursework', 'exam')),
  max_score numeric not null check (max_score > 0),
  unique (id, offering_id)
);
create table fieldnotes.marks (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references fieldnotes.course_offerings(id),
  enrollment_id uuid not null,
  assessment_id uuid not null,
  score numeric not null check (score >= 0),
  state text not null default 'draft' check (state in ('draft', 'submitted', 'approved')),
  submitted_by uuid references auth.users(id),
  submitted_at timestamptz,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  foreign key (enrollment_id, offering_id) references fieldnotes.enrollments(id, offering_id),
  foreign key (assessment_id, offering_id) references fieldnotes.assessments(id, offering_id),
  unique (enrollment_id, assessment_id),
  check ((state = 'draft' and submitted_by is null and submitted_at is null and approved_by is null and approved_at is null)
    or (state = 'submitted' and submitted_by is not null and submitted_at is not null and approved_by is null and approved_at is null)
    or (state = 'approved' and submitted_by is not null and submitted_at is not null and approved_by is not null and approved_at is not null))
);
-- Released snapshots only; draft/submitted/approved marks NEVER appear here automatically.
-- No client INSERT/UPDATE/DELETE grants. Publication RPC remains disabled below.
create table fieldnotes.released_results (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null unique references fieldnotes.enrollments(id),
  grade text not null,
  score numeric not null,
  released_at timestamptz not null,
  released_by uuid not null references auth.users(id),
  registry_rule_version text not null check (length(trim(registry_rule_version)) > 0)
);
create table fieldnotes.account_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references fieldnotes.students(id),
  occurred_on date not null,
  description text not null,
  transaction_type text not null,
  currency text not null check (currency in ('USD', 'ZIG')),
  amount numeric(18,2) not null,
  balance numeric(18,2) not null,
  source_reference text not null unique
);
create table fieldnotes.resources (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references fieldnotes.course_offerings(id),
  title text not null,
  url text not null check (url ~ '^https://[^[:space:]]+$'),
  published boolean not null default false
);
create table fieldnotes.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references fieldnotes.course_offerings(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  venue text not null,
  published boolean not null default false
);
create table fieldnotes_private.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  mark_id uuid not null references fieldnotes.marks(id),
  action text not null,
  occurred_at timestamptz not null default now()
);

create index enrollments_offering_idx on fieldnotes.enrollments(offering_id);
create index transactions_student_idx on fieldnotes.account_transactions(student_id);
create index assignments_user_offering_idx on fieldnotes_private.staff_assignments(auth_user_id, offering_id);
create index marks_offering_idx on fieldnotes.marks(offering_id);

-- Definer helpers live outside exposed API schemas; no editable JWT metadata is trusted.
create function fieldnotes_private.student_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from fieldnotes.students where auth_user_id = (select auth.uid())
$$;
create function fieldnotes_private.assigned(offering uuid, roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from fieldnotes_private.staff_assignments a
    where a.auth_user_id = (select auth.uid()) and a.role = 'admin')
$$;
create function fieldnotes_private.enrolled(offering uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from fieldnotes.enrollments e
    where e.offering_id = offering and e.student_id = fieldnotes_private.student_id())
$$;
create function fieldnotes_private.owns_enrollment(enrollment uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from fieldnotes.enrollments e
    where e.id = enrollment and e.student_id = fieldnotes_private.student_id())
$$;
revoke all on all functions in schema fieldnotes_private from public, anon, authenticated;
grant execute on function fieldnotes_private.student_id(),
  fieldnotes_private.assigned(uuid,text[]), fieldnotes_private.enrolled(uuid),
  fieldnotes_private.owns_enrollment(uuid) to authenticated;

-- Enable RLS for EVERY new table before granting any browser access.
do $$
declare relation record;
begin
  for relation in select schemaname, tablename from pg_tables
    where schemaname in ('fieldnotes', 'fieldnotes_private')
  loop
    execute format('alter table %I.%I enable row level security', relation.schemaname, relation.tablename);
    execute format('revoke all on table %I.%I from public, anon, authenticated', relation.schemaname, relation.tablename);
  end loop;
end $$;
grant select on all tables in schema fieldnotes to authenticated;
-- Trusted server operations require the service key; it never belongs in the frontend.
grant all on all tables in schema fieldnotes, fieldnotes_private to service_role;
grant usage, select on all sequences in schema fieldnotes_private to service_role;

create policy student_self on fieldnotes.students for select to authenticated
  using (auth_user_id = (select auth.uid()));
create policy enrollment_self on fieldnotes.enrollments for select to authenticated
  using (student_id = fieldnotes_private.student_id()
    or fieldnotes_private.assigned(offering_id, array['admin']));
create policy offering_access on fieldnotes.course_offerings for select to authenticated
  using (fieldnotes_private.enrolled(id)
    or fieldnotes_private.assigned(id, array['admin']));
create policy course_access on fieldnotes.courses for select to authenticated
  using (exists (select 1 from fieldnotes.course_offerings o where o.course_id = fieldnotes.courses.id));
create policy term_access on fieldnotes.academic_terms for select to authenticated
  using (exists (select 1 from fieldnotes.course_offerings o where o.term_id = fieldnotes.academic_terms.id));
create policy assessment_staff on fieldnotes.assessments for select to authenticated
  using (fieldnotes_private.assigned(offering_id, array['admin']));
create policy assessment_student on fieldnotes.assessments for select to authenticated
  using (fieldnotes_private.enrolled(offering_id));
create policy marks_staff on fieldnotes.marks for select to authenticated
  using (fieldnotes_private.assigned(offering_id, array['admin']));
create policy marks_student on fieldnotes.marks for select to authenticated
  using (
    state = 'approved'
    and exists (
      select 1 from fieldnotes.enrollments
      where id = fieldnotes.marks.enrollment_id
        and student_id = fieldnotes_private.student_id()
    )
  );
create policy results_self on fieldnotes.released_results for select to authenticated
  using (fieldnotes_private.owns_enrollment(enrollment_id));
create policy transactions_self on fieldnotes.account_transactions for select to authenticated
  using (student_id = fieldnotes_private.student_id());
create policy resources_access on fieldnotes.resources for select to authenticated
  using ((published and fieldnotes_private.enrolled(offering_id))
    or fieldnotes_private.assigned(offering_id, array['admin']));
create policy exams_access on fieldnotes.exam_sessions for select to authenticated
  using ((published and fieldnotes_private.enrolled(offering_id))
    or fieldnotes_private.assigned(offering_id, array['admin']));

-- Owner explicitly keeps these operations unavailable until registry rules exist.
-- Not switchable with a client-editable flag or incomplete JSON configuration.
create function fieldnotes.submit_registration() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode = 'P0001', message = 'REGISTRY_CONFIGURATION_REQUIRED';
end $$;
create function fieldnotes.publish_results() returns void
language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode = 'P0001', message = 'REGISTRY_CONFIGURATION_REQUIRED';
end $$;
revoke all on all functions in schema fieldnotes from public, anon, authenticated;
grant execute on function fieldnotes.submit_registration(), fieldnotes.publish_results() to authenticated;

comment on schema fieldnotes is 'Fieldnotes development portal: expose via Data API only after migration/policy validation.';
comment on schema fieldnotes_private is 'Never expose this schema through the Data API.';
commit;


begin;

-- Raw marks only; no invented grade scale or weighted-grade calculation.
-- All writes go through checked functions. Direct table DML is not granted.
create function fieldnotes.save_mark(target_enrollment uuid, target_assessment uuid, raw_score numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  offering uuid;
  maximum numeric;
  mark_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception using errcode = '42501', message = 'NOT_AUTHORIZED';
  end if;
  select a.offering_id, a.max_score into offering, maximum
    from fieldnotes.assessments a where a.id = target_assessment for share;
  if offering is null or not fieldnotes_private.assigned(offering, array['admin']) then
    raise exception using errcode = '42501', message = 'NOT_AUTHORIZED';
  end if;
  if not exists (select 1 from fieldnotes.enrollments e where e.id = target_enrollment and e.offering_id = offering) then
    raise exception using errcode = '42501', message = 'NOT_AUTHORIZED';
  end if;
  if raw_score is null or raw_score < 0 or raw_score > maximum or raw_score::text in ('NaN','Infinity','-Infinity') then
    raise exception using errcode = '22023', message = 'INVALID_SCORE';
  end if;
  insert into fieldnotes.marks (offering_id, enrollment_id, assessment_id, score)
    values (offering, target_enrollment, target_assessment, raw_score)
    on conflict (enrollment_id, assessment_id) do update set score = excluded.score
    where fieldnotes.marks.state = 'draft'
    returning id into mark_id;
  if mark_id is null then
    raise exception using errcode = 'P0001', message = 'MARK_LOCKED';
  end if;
  insert into fieldnotes_private.audit_events (actor_id, mark_id, action)
    values ((select auth.uid()), mark_id, 'save_draft');
  return mark_id;
end $$;

create function fieldnotes.submit_mark(target_mark uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare entry fieldnotes.marks%rowtype;
begin
  select * into entry from fieldnotes.marks where id = target_mark for update;
  if entry.id is null or not fieldnotes_private.assigned(entry.offering_id, array['admin']) then
    raise exception using errcode = '42501', message = 'NOT_AUTHORIZED';
  end if;
  if entry.state <> 'draft' then
    raise exception using errcode = 'P0001', message = 'INVALID_MARK_TRANSITION';
  end if;
  update fieldnotes.marks set state = 'submitted', submitted_by = (select auth.uid()), submitted_at = now()
    where id = target_mark;
  insert into fieldnotes_private.audit_events (actor_id, mark_id, action)
    values ((select auth.uid()), target_mark, 'submit');
end $$;

create function fieldnotes.approve_mark(target_mark uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare entry fieldnotes.marks%rowtype;
begin
  select * into entry from fieldnotes.marks where id = target_mark for update;
  if entry.id is null or not fieldnotes_private.assigned(entry.offering_id, array['admin']) then
    raise exception using errcode = '42501', message = 'NOT_AUTHORIZED';
  end if;
  if entry.state <> 'submitted' then
    raise exception using errcode = 'P0001', message = 'INVALID_MARK_TRANSITION';
  end if;
  update fieldnotes.marks set state = 'approved', approved_by = (select auth.uid()), approved_at = now()
    where id = target_mark;
  insert into fieldnotes_private.audit_events (actor_id, mark_id, action)
    values ((select auth.uid()), target_mark, 'approve');
end $$;

revoke all on function fieldnotes.save_mark(uuid,uuid,numeric),
  fieldnotes.submit_mark(uuid), fieldnotes.approve_mark(uuid) from public, anon, authenticated;
grant execute on function fieldnotes.save_mark(uuid,uuid,numeric),
  fieldnotes.submit_mark(uuid), fieldnotes.approve_mark(uuid) to authenticated;
commit;


begin;
create table fieldnotes_private.login_attempts (
  subject_hash text primary key,
  window_started timestamptz not null,
  attempts integer not null
);
alter table fieldnotes_private.login_attempts enable row level security;
revoke all on fieldnotes_private.login_attempts from public, anon, authenticated;
grant all on fieldnotes_private.login_attempts to service_role;

-- Only the server may resolve student numbers to Auth identities. This endpoint
-- enforces an atomic per-number attempt budget, including unknown numbers.
create function fieldnotes.resolve_student_login(student_number_input text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare attempt_count integer;
begin
  if length(trim(student_number_input)) not between 1 and 80 then return null; end if;
  delete from fieldnotes_private.login_attempts where window_started < now() - interval '2 hours';
  insert into fieldnotes_private.login_attempts values (md5(trim(student_number_input)),now(),1)
    on conflict (subject_hash) do update set
      window_started = case when fieldnotes_private.login_attempts.window_started < now() - interval '10 minutes' then now() else fieldnotes_private.login_attempts.window_started end,
      attempts = case when fieldnotes_private.login_attempts.window_started < now() - interval '10 minutes' then 1 else fieldnotes_private.login_attempts.attempts+1 end
    returning attempts into attempt_count;
  -- Return null, rather than raise: the counter increment must remain committed.
  if attempt_count > 10 then return null; end if;
  return (select auth_user_id from fieldnotes.students where student_number=trim(student_number_input));
end $$;
revoke all on function fieldnotes.resolve_student_login(text) from public, anon, authenticated;
grant execute on function fieldnotes.resolve_student_login(text) to service_role;

create function fieldnotes.my_staff_assignments()
returns table (role text, offering_id uuid)
language sql stable security definer set search_path = '' as $$
  select a.role,a.offering_id from fieldnotes_private.staff_assignments a where a.auth_user_id=(select auth.uid())
$$;
create function fieldnotes.staff_roster(target_offering uuid)
returns table (enrollment_id uuid, student_number text, display_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not fieldnotes_private.assigned(target_offering,array['admin']) then
    raise exception using errcode='42501',message='NOT_AUTHORIZED';
  end if;
  return query select e.id,s.student_number,s.display_name
    from fieldnotes.enrollments e join fieldnotes.students s on s.id=e.student_id
    where e.offering_id=target_offering order by s.student_number;
end $$;
create function fieldnotes.save_resource(target_offering uuid, resource_title text, resource_url text, is_published boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  if not fieldnotes_private.assigned(target_offering,array['admin']) then
    raise exception using errcode='42501',message='NOT_AUTHORIZED';
  end if;
  if length(trim(resource_title)) not between 1 and 200 or length(resource_url)>2048
    or resource_url !~ '^https://[^[:space:]]+$' then
    raise exception using errcode='22023',message='INVALID_RESOURCE';
  end if;
  insert into fieldnotes.resources (offering_id,title,url,published)
    values (target_offering,trim(resource_title),resource_url,is_published) returning id into result_id;
  return result_id;
end $$;
revoke all on function fieldnotes.my_staff_assignments(),fieldnotes.staff_roster(uuid),
  fieldnotes.save_resource(uuid,text,text,boolean) from public, anon, authenticated;
grant execute on function fieldnotes.my_staff_assignments(),fieldnotes.staff_roster(uuid),
  fieldnotes.save_resource(uuid,text,text,boolean) to authenticated;
commit;


begin;

create or replace function fieldnotes_private.assigned(offering uuid, roles text[])
returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from fieldnotes_private.staff_assignments a
    where a.auth_user_id = (select auth.uid())
      and a.role = 'admin'
  )
$$;

create or replace function fieldnotes.my_staff_assignments()
returns table (role text, offering_id uuid)
language sql stable security definer set search_path = '' as $$
  select 'admin'::text, o.id
  from fieldnotes.course_offerings o
  where exists (
    select 1
    from fieldnotes_private.staff_assignments a
    where a.auth_user_id = (select auth.uid())
      and a.role = 'admin'
  )
  order by o.id
$$;

create or replace function fieldnotes.staff_roster(target_offering uuid)
returns table (enrollment_id uuid, student_number text, display_name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not fieldnotes_private.assigned(target_offering, array['admin']) then
    raise exception using errcode='42501',message='NOT_AUTHORIZED';
  end if;
  return query
    select e.id, s.student_number, s.display_name
    from fieldnotes.enrollments e
    join fieldnotes.students s on s.id = e.student_id
    where e.offering_id = target_offering
    order by s.student_number;
end $$;

create or replace function fieldnotes.save_resource(
  target_offering uuid,
  resource_title text,
  resource_url text,
  is_published boolean
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  if not fieldnotes_private.assigned(target_offering, array['admin']) then
    raise exception using errcode='42501',message='NOT_AUTHORIZED';
  end if;
  if length(trim(resource_title)) not between 1 and 200
    or length(resource_url) > 2048
    or resource_url !~ '^https://[^[:space:]]+$' then
    raise exception using errcode='22023',message='INVALID_RESOURCE';
  end if;
  insert into fieldnotes.resources (offering_id,title,url,published)
    values (target_offering,trim(resource_title),resource_url,is_published)
    returning id into result_id;
  return result_id;
end $$;

create or replace function fieldnotes.approve_mark(target_mark uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare entry fieldnotes.marks%rowtype;
begin
  select * into entry from fieldnotes.marks where id = target_mark for update;
  if entry.id is null or not fieldnotes_private.assigned(entry.offering_id, array['admin']) then
    raise exception using errcode = '42501', message = 'NOT_AUTHORIZED';
  end if;
  if entry.state <> 'submitted' then
    raise exception using errcode = 'P0001', message = 'INVALID_MARK_TRANSITION';
  end if;
  update fieldnotes.marks
  set state = 'approved', approved_by = (select auth.uid()), approved_at = now()
  where id = target_mark;
  insert into fieldnotes_private.audit_events (actor_id, mark_id, action)
    values ((select auth.uid()), target_mark, 'approve');
end $$;

commit;


begin;

create or replace function fieldnotes_private.require_admin()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from fieldnotes_private.staff_assignments
    where auth_user_id = (select auth.uid()) and role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'NOT_AUTHORIZED';
  end if;
end $$;

create or replace function fieldnotes.admin_upsert_term(
  target_id uuid, term_label text, start_date date, end_date date
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  perform fieldnotes_private.require_admin();
  if length(trim(term_label)) not between 1 and 120
    or (end_date is not null and start_date is not null and end_date < start_date) then
    raise exception using errcode = '22023', message = 'INVALID_TERM';
  end if;
  insert into fieldnotes.academic_terms (id, label, starts_on, ends_on)
    values (coalesce(target_id, gen_random_uuid()), trim(term_label), start_date, end_date)
  on conflict (id) do update set label = excluded.label, starts_on = excluded.starts_on, ends_on = excluded.ends_on
  returning id into result_id;
  return result_id;
end $$;

create or replace function fieldnotes.admin_upsert_course(
  target_id uuid, course_code text, course_name text
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  perform fieldnotes_private.require_admin();
  if length(trim(course_code)) not between 1 and 30 or length(trim(course_name)) not between 1 and 200 then
    raise exception using errcode = '22023', message = 'INVALID_COURSE';
  end if;
  insert into fieldnotes.courses (id, code, name)
    values (coalesce(target_id, gen_random_uuid()), upper(trim(course_code)), trim(course_name))
  on conflict (id) do update set code = excluded.code, name = excluded.name
  returning id into result_id;
  return result_id;
end $$;

create or replace function fieldnotes.admin_upsert_offering(
  target_id uuid, target_course uuid, target_term uuid, target_programme text, target_credits numeric
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  perform fieldnotes_private.require_admin();
  if target_course is null or target_term is null or length(trim(target_programme)) not between 1 and 80
    or target_credits is null or target_credits <= 0 then
    raise exception using errcode = '22023', message = 'INVALID_OFFERING';
  end if;
  insert into fieldnotes.course_offerings (id, course_id, term_id, programme_code, credits)
    values (coalesce(target_id, gen_random_uuid()), target_course, target_term, upper(trim(target_programme)), target_credits)
  on conflict (id) do update set course_id = excluded.course_id, term_id = excluded.term_id,
    programme_code = excluded.programme_code, credits = excluded.credits
  returning id into result_id;
  return result_id;
end $$;

create or replace function fieldnotes.admin_upsert_assessment(
  target_id uuid, target_offering uuid, assessment_label text, assessment_kind text, maximum numeric
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  perform fieldnotes_private.require_admin();
  if target_offering is null or length(trim(assessment_label)) not between 1 and 120
    or assessment_kind not in ('coursework', 'exam') or maximum is null or maximum <= 0 then
    raise exception using errcode = '22023', message = 'INVALID_ASSESSMENT';
  end if;
  insert into fieldnotes.assessments (id, offering_id, label, kind, max_score)
    values (coalesce(target_id, gen_random_uuid()), target_offering, trim(assessment_label), assessment_kind, maximum)
  on conflict (id) do update set offering_id = excluded.offering_id, label = excluded.label,
    kind = excluded.kind, max_score = excluded.max_score
  returning id into result_id;
  return result_id;
end $$;

create or replace function fieldnotes.admin_upsert_exam(
  target_id uuid, target_offering uuid, start_time timestamptz, end_time timestamptz,
  exam_venue text, is_published boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  perform fieldnotes_private.require_admin();
  if target_offering is null or start_time is null or end_time is null or end_time <= start_time
    or length(trim(exam_venue)) not between 1 and 200 then
    raise exception using errcode = '22023', message = 'INVALID_EXAM_SESSION';
  end if;
  insert into fieldnotes.exam_sessions (id, offering_id, starts_at, ends_at, venue, published)
    values (coalesce(target_id, gen_random_uuid()), target_offering, start_time, end_time, trim(exam_venue), is_published)
  on conflict (id) do update set offering_id = excluded.offering_id, starts_at = excluded.starts_at,
    ends_at = excluded.ends_at, venue = excluded.venue, published = excluded.published
  returning id into result_id;
  return result_id;
end $$;

create or replace function fieldnotes.admin_delete_resource(target_resource uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform fieldnotes_private.require_admin();
  delete from fieldnotes.resources where id = target_resource;
end $$;

create or replace function fieldnotes.admin_publish_mark(target_mark uuid, result_grade text)
returns void language plpgsql security definer set search_path = '' as $$
declare entry fieldnotes.marks%rowtype;
begin
  perform fieldnotes_private.require_admin();
  select * into entry from fieldnotes.marks where id = target_mark for update;
  if entry.id is null or entry.state <> 'approved' or length(trim(result_grade)) not between 1 and 20 then
    raise exception using errcode = '22023', message = 'INVALID_PUBLICATION';
  end if;
  insert into fieldnotes.released_results (enrollment_id, grade, score, released_at, released_by, registry_rule_version)
    select entry.enrollment_id, trim(result_grade), entry.score, now(), (select auth.uid()), 'admin-published'
  on conflict (enrollment_id) do update set grade = excluded.grade, score = excluded.score,
    released_at = excluded.released_at, released_by = excluded.released_by;
end $$;

revoke all on function fieldnotes_private.require_admin(),
  fieldnotes.admin_upsert_term(uuid,text,date,date),
  fieldnotes.admin_upsert_course(uuid,text,text),
  fieldnotes.admin_upsert_offering(uuid,uuid,uuid,text,numeric),
  fieldnotes.admin_upsert_assessment(uuid,uuid,text,text,numeric),
  fieldnotes.admin_upsert_exam(uuid,uuid,timestamptz,timestamptz,text,boolean),
  fieldnotes.admin_delete_resource(uuid),
  fieldnotes.admin_publish_mark(uuid,text)
from public, anon, authenticated;
grant execute on function fieldnotes.admin_upsert_term(uuid,text,date,date),
  fieldnotes.admin_upsert_course(uuid,text,text),
  fieldnotes.admin_upsert_offering(uuid,uuid,uuid,text,numeric),
  fieldnotes.admin_upsert_assessment(uuid,uuid,text,text,numeric),
  fieldnotes.admin_upsert_exam(uuid,uuid,timestamptz,timestamptz,text,boolean),
  fieldnotes.admin_delete_resource(uuid),
  fieldnotes.admin_publish_mark(uuid,text)
to authenticated;

commit;


begin;

create table if not exists fieldnotes.registry_configuration (
  id boolean primary key default true check (id),
  grade_calculation_enabled boolean not null default false,
  result_publication_enabled boolean not null default false,
  registration_submission_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
alter table fieldnotes.registry_configuration enable row level security;

create or replace function fieldnotes.admin_save_registry_configuration(
  enable_grade_calculation boolean,
  enable_result_publication boolean,
  enable_registration_submission boolean
) returns void language plpgsql security definer set search_path = '' as $$
begin
  perform fieldnotes_private.require_admin();
  insert into fieldnotes.registry_configuration
    (id, grade_calculation_enabled, result_publication_enabled, registration_submission_enabled, updated_at, updated_by)
  values (true, enable_grade_calculation, enable_result_publication, enable_registration_submission, now(), (select auth.uid()))
  on conflict (id) do update set
    grade_calculation_enabled = excluded.grade_calculation_enabled,
    result_publication_enabled = excluded.result_publication_enabled,
    registration_submission_enabled = excluded.registration_submission_enabled,
    updated_at = excluded.updated_at,
    updated_by = excluded.updated_by;
end $$;

create or replace function fieldnotes.registry_capability(capability text)
returns boolean language sql security definer set search_path = '' as $$
  select case capability
    when 'grade_calculation' then coalesce((select grade_calculation_enabled from fieldnotes.registry_configuration where id), false)
    when 'result_publication' then coalesce((select result_publication_enabled from fieldnotes.registry_configuration where id), false)
    when 'registration_submission' then coalesce((select registration_submission_enabled from fieldnotes.registry_configuration where id), false)
    else false
  end
$$;

create or replace function fieldnotes.admin_publish_mark(target_mark uuid, result_grade text)
returns void language plpgsql security definer set search_path = '' as $$
declare entry fieldnotes.marks%rowtype;
begin
  perform fieldnotes_private.require_admin();
  if not fieldnotes.registry_capability('result_publication') then
    raise exception using errcode = 'P0001', message = 'REGISTRY_CONFIGURATION_REQUIRED';
  end if;
  select * into entry from fieldnotes.marks where id = target_mark for update;
  if entry.id is null or entry.state <> 'approved' or length(trim(result_grade)) not between 1 and 20 then
    raise exception using errcode = '22023', message = 'INVALID_PUBLICATION';
  end if;
  insert into fieldnotes.released_results (enrollment_id, grade, score, released_at, released_by, registry_rule_version)
    select entry.enrollment_id, trim(result_grade), entry.score, now(), (select auth.uid()), 'registry-configured'
  on conflict (enrollment_id) do update set grade = excluded.grade, score = excluded.score, released_at = excluded.released_at, released_by = excluded.released_by;
end $$;

create or replace function fieldnotes.submit_registration() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not fieldnotes.registry_capability('registration_submission') then
    raise exception using errcode = 'P0001', message = 'REGISTRY_CONFIGURATION_REQUIRED';
  end if;
end $$;

create or replace function fieldnotes.publish_results() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not fieldnotes.registry_capability('result_publication') then
    raise exception using errcode = 'P0001', message = 'REGISTRY_CONFIGURATION_REQUIRED';
  end if;
end $$;

revoke all on fieldnotes.registry_configuration from public, anon, authenticated;
grant execute on function fieldnotes.admin_save_registry_configuration(boolean, boolean, boolean) to authenticated;
grant execute on function fieldnotes.registry_capability(text) to authenticated;
grant execute on function fieldnotes.submit_registration(), fieldnotes.publish_results() to authenticated;
commit;


begin;

create table if not exists fieldnotes.registration_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references fieldnotes.students(id) on delete cascade,
  offering_id uuid not null references fieldnotes.course_offerings(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  unique (student_id, offering_id)
);
alter table fieldnotes.registration_requests enable row level security;

create or replace function fieldnotes.registration_offerings()
returns table (offering_id uuid, course_code text, course_name text, term_label text, credits numeric, selected boolean)
language sql security definer set search_path = '' as $$
  select o.id, c.code, c.name, t.label, o.credits,
    exists (select 1 from fieldnotes.registration_requests r
      where r.offering_id = o.id and r.student_id = fieldnotes_private.student_id()
        and r.status in ('draft', 'submitted', 'approved'))
  from fieldnotes.course_offerings o
  join fieldnotes.courses c on c.id = o.course_id
  join fieldnotes.academic_terms t on t.id = o.term_id
  where o.programme_code = (select s.programme_code from fieldnotes.students s
    where s.id = fieldnotes_private.student_id());
$$;

create or replace function fieldnotes.set_registration_choice(target_offering uuid, selected boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (not fieldnotes.registry_capability('registration_submission')) then
    raise exception using errcode = 'P0001', message = 'REGISTRY_CONFIGURATION_REQUIRED';
  end if;
  if selected then
    insert into fieldnotes.registration_requests(student_id, offering_id)
    values (fieldnotes_private.student_id(), target_offering)
    on conflict (student_id, offering_id) do update set status = 'draft', submitted_at = null;
  else
    delete from fieldnotes.registration_requests
    where student_id = fieldnotes_private.student_id() and offering_id = target_offering and status = 'draft';
  end if;
end $$;

create or replace function fieldnotes.submit_registration()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not fieldnotes.registry_capability('registration_submission') then
    raise exception using errcode = 'P0001', message = 'REGISTRY_CONFIGURATION_REQUIRED';
  end if;
  update fieldnotes.registration_requests
  set status = 'submitted', submitted_at = now()
  where student_id = fieldnotes_private.student_id() and status = 'draft';
  update fieldnotes.students set registration_status = 'Submitted'
  where id = fieldnotes_private.student_id();
end $$;

create or replace function fieldnotes.admin_registration_requests()
returns table (request_id uuid, student_number text, student_name text, programme_code text, course_code text, course_name text, term_label text, credits numeric, status text, submitted_at timestamptz)
language sql security definer set search_path = '' as $$
  select r.id, s.student_number, s.display_name, s.programme_code, c.code, c.name, t.label, o.credits, r.status, r.submitted_at
  from fieldnotes.registration_requests r
  join fieldnotes.students s on s.id = r.student_id
  join fieldnotes.course_offerings o on o.id = r.offering_id
  join fieldnotes.courses c on c.id = o.course_id
  join fieldnotes.academic_terms t on t.id = o.term_id
  where exists (select 1 from fieldnotes_private.staff_assignments a
    where a.auth_user_id = (select auth.uid()) and a.role = 'admin');
$$;

create or replace function fieldnotes.admin_review_registration(target_request uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare r fieldnotes.registration_requests%rowtype;
begin
  perform fieldnotes_private.require_admin();
  if decision not in ('approved', 'rejected') then raise exception using errcode = '22023', message = 'INVALID_DECISION'; end if;
  select * into r from fieldnotes.registration_requests where id = target_request for update;
  if r.id is null then raise exception using errcode = '22023', message = 'REQUEST_NOT_FOUND'; end if;
  update fieldnotes.registration_requests set status = decision, reviewed_at = now(), reviewed_by = auth.uid() where id = r.id;
  if decision = 'approved' then
    insert into fieldnotes.enrollments(student_id, offering_id) values (r.student_id, r.offering_id) on conflict do nothing;
    update fieldnotes.students set registration_status = 'Registered' where id = r.student_id;
  elsif decision = 'rejected' then
    update fieldnotes.students set registration_status = 'Not registered' where id = r.student_id;
  end if;
end $$;

grant execute on function fieldnotes.registration_offerings(), fieldnotes.set_registration_choice(uuid, boolean),
  fieldnotes.submit_registration(), fieldnotes.admin_registration_requests(),
  fieldnotes.admin_review_registration(uuid, text) to authenticated;
commit;

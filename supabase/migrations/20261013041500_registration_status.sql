begin;

create or replace function fieldnotes.admin_review_registration(target_request uuid, decision text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  r fieldnotes.registration_requests%rowtype;
begin
  perform fieldnotes_private.require_admin();
  if decision not in ('approved', 'rejected') then
    raise exception using errcode = '22023', message = 'INVALID_DECISION';
  end if;
  select * into r
  from fieldnotes.registration_requests
  where id = target_request
  for update;
  if r.id is null then
    raise exception using errcode = '22023', message = 'REQUEST_NOT_FOUND';
  end if;
  update fieldnotes.registration_requests
  set status = decision, reviewed_at = now(), reviewed_by = auth.uid()
  where id = r.id;
  if decision = 'approved' then
    insert into fieldnotes.enrollments(student_id, offering_id)
    values (r.student_id, r.offering_id)
    on conflict do nothing;
    update fieldnotes.students
    set registration_status = 'Registered'
    where id = r.student_id;
  else
    update fieldnotes.students
    set registration_status = 'Not registered'
    where id = r.student_id;
  end if;
end $$;

commit;

-- Hosted development smoke test. Synthetic rows and role switches are rolled back.
-- This checks the real auth.uid()/Postgres RLS boundary, not JWT signature validation.
begin;
insert into auth.users (id) values
  ('f6000000-0000-4000-8000-000000000001'),
  ('f6000000-0000-4000-8000-000000000002');
insert into fieldnotes.students (id,auth_user_id,student_number,display_name,programme_code) values
  ('f6000000-0000-4000-8000-000000000011','f6000000-0000-4000-8000-000000000001','ISOLATION-TEST-A','Synthetic A','TEST'),
  ('f6000000-0000-4000-8000-000000000012','f6000000-0000-4000-8000-000000000002','ISOLATION-TEST-B','Synthetic B','TEST');
insert into fieldnotes.account_transactions (student_id,occurred_on,description,transaction_type,currency,amount,balance,source_reference) values
  ('f6000000-0000-4000-8000-000000000011','2000-01-01','Synthetic test','TEST','USD',1,1,'ISOLATION-TEST-A'),
  ('f6000000-0000-4000-8000-000000000012','2000-01-01','Synthetic test','TEST','USD',2,2,'ISOLATION-TEST-B');

set local role authenticated;
set local request.jwt.claims = '{"sub":"f6000000-0000-4000-8000-000000000001","role":"authenticated"}';
do $$
begin
  if (select count(*) from fieldnotes.students) <> 1
    or not exists (select 1 from fieldnotes.students where student_number='ISOLATION-TEST-A') then
    raise exception 'FAIL: A cannot positively read only A';
  end if;
  if (select count(*) from fieldnotes.account_transactions) <> 1
    or exists (select 1 from fieldnotes.account_transactions where source_reference='ISOLATION-TEST-B') then
    raise exception 'FAIL: A ledger isolation';
  end if;
  begin
    update fieldnotes.students set display_name='Tampered' where student_number='ISOLATION-TEST-B';
    raise exception 'FAIL: update was permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from fieldnotes.account_transactions where source_reference='ISOLATION-TEST-B';
    raise exception 'FAIL: delete was permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into fieldnotes.account_transactions (student_id,occurred_on,description,transaction_type,currency,amount,balance,source_reference)
      values ('f6000000-0000-4000-8000-000000000012','2000-01-01','Tampered','TEST','USD',0,0,'ISOLATION-BAD');
    raise exception 'FAIL: insert was permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    perform fieldnotes.submit_registration();
    raise exception 'FAIL: registration was permitted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'REGISTRY_CONFIGURATION_REQUIRED' then raise; end if;
  end;
  begin
    perform fieldnotes.publish_results();
    raise exception 'FAIL: publication was permitted';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'REGISTRY_CONFIGURATION_REQUIRED' then raise; end if;
  end;
end $$;

set local request.jwt.claims = '{"sub":"f6000000-0000-4000-8000-000000000002","role":"authenticated"}';
do $$
begin
  if (select count(*) from fieldnotes.students) <> 1
    or not exists (select 1 from fieldnotes.students where student_number='ISOLATION-TEST-B') then
    raise exception 'FAIL: B cannot positively read only B';
  end if;
end $$;

set local request.jwt.claims = '{}';
do $$
begin
  if exists (select 1 from fieldnotes.students) or exists (select 1 from fieldnotes.account_transactions) then
    raise exception 'FAIL: missing identity received records';
  end if;
end $$;

set local role anon;
do $$
begin
  begin
    perform * from fieldnotes.students;
    raise exception 'FAIL: anonymous select was permitted';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
select 'PASS: hosted student read/write isolation; anonymous denial; configuration gates; synthetic rows rolled back' as result;

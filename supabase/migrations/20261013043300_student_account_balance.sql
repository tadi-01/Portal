begin;

alter table fieldnotes.students
  add column if not exists account_balance numeric(18,2) not null default 0;

commit;

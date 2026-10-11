select jsonb_build_object(
  'portal_tables', (select count(*) from pg_tables where schemaname in ('fieldnotes','fieldnotes_private')),
  'tables_without_rls', (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname in ('fieldnotes','fieldnotes_private') and c.relkind='r' and not c.relrowsecurity),
  'auth_identity_count', (select count(*) from auth.users),
  'student_count', (select count(*) from fieldnotes.students),
  'migration_versions', (select jsonb_agg(version order by version) from supabase_migrations.schema_migrations),
  'anonymous_can_read_students', has_table_privilege('anon','fieldnotes.students','SELECT'),
  'authenticated_can_change_assignments', has_table_privilege('authenticated','fieldnotes_private.staff_assignments','INSERT')
) as postflight;

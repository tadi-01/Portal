-- Read-only metadata inspection; no student data or credential values.
select jsonb_build_object(
  'server_version', current_setting('server_version'),
  'portal_schemas_exist', exists (
    select 1 from pg_namespace where nspname in ('fieldnotes','fieldnotes_private')
  ),
  'public_tables', coalesce((select jsonb_agg(tablename order by tablename)
    from pg_tables where schemaname = 'public'), '[]'::jsonb),
  'migration_history_exists', to_regclass('supabase_migrations.schema_migrations') is not null,
  'auth_identity_count', (select count(*) from auth.users)
) as preflight;

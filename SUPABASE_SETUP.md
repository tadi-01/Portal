# Supabase connection setup

This is an optional connection layer, not a migration of the demo login or student records.

1. Create or select your Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` to the project's HTTPS URL and `VITE_SUPABASE_PUBLISHABLE_KEY` to its `sb_publishable_...` key from the project's Connect dialog.
4. Restart `npm run dev`. Hosting environments need these variables at build time and a rebuild after changes.

The client is created lazily and reused. Leaving both values blank keeps the existing demo working. Calling the client without complete configuration produces an actionable error.

```ts
import { getSupabaseClient, checkSupabaseConnection } from '@/lib/supabase'

await checkSupabaseConnection() // read-only Auth settings request, 10-second timeout
const supabase = getSupabaseClient()
// Use this client for your project's Auth/database calls once its schema is ready.
```

The check confirms the Auth endpoint responds successfully; it does not verify database tables, user permissions, or student data integration. No live project was provisioned or tested as part of this setup.

All VITE_ variables are public in the built browser application. Only publishable keys belong here. Never use secret/service_role keys. Enable Row Level Security and appropriate user-specific policies before connecting student tables. The current demo sign-in does not create a Supabase session: it cannot authorize access to protected database rows.

Before replacing the demo store, define the student/course/result/payment schema, provision real authentication, map users to their own student records, and test cross-user access denial. Do not simply grant anonymous access to student records.

References: [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys), [JavaScript client](https://supabase.com/docs/reference/javascript/initializing).

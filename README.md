# Fieldnotes

Fieldnotes is a Vue 3 and TypeScript student portal with a separate Supabase-
backed admin workspace.

## Requirements

- Node.js `^22.18.0 || >=24.12.0`
- A linked Supabase development project

## Run locally

On Windows, use `npm.cmd` if PowerShell blocks `npm`:

```powershell
Copy-Item .env.example .env.local
# Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:5173`.

## Roles and routes

- Student login: `/login`
- Admin login: `/staff/login`
- Student workspace: `/`
- Admin workspace: `/staff`

There are only two application roles: `student` and `admin`. Admins perform
teaching, review, approval and resource-management duties across all configured
courses. Role assignment is performed through trusted Supabase management tools,
never from the browser.

See [PRESENTATION.md](PRESENTATION.md) for the architecture, user journeys,
demonstration checklist and current limitations.

## Supabase development setup

1. Authenticate the Supabase CLI:

   ```powershell
   npx.cmd supabase login
   ```

2. Link the intended development project:

   ```powershell
   npx.cmd supabase link --project-ref <project-reference>
   ```

3. Preview and apply migrations:

   ```powershell
   npx.cmd supabase db push --linked --dry-run
   npx.cmd supabase db push --linked
   ```

4. Deploy the student login function:

   ```powershell
   npx.cmd supabase functions deploy student-login --use-api
   ```

The private `fieldnotes_private` schema must remain unexposed. Never place a
secret or service-role key in `.env.local` under a `VITE_*` name.

## Verification

```powershell
npm.cmd run lint:check
npm.cmd run type-check
npm.cmd run build
```

## Repository layout

```text
src/                         Vue application
scripts/                     Trusted local provisioning helpers
supabase/migrations/         Database schema and authorization baseline
supabase/functions/          Supabase Edge Functions
supabase/checks/             Hosted database checks
public/                      Static assets
```

Do not commit `.env.local`, service keys, `dist`, `node_modules` or other
generated files.

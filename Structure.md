# Project Structure

Fieldnotes is a Vue 3 student portal with a separate admin workspace. The
frontend uses TypeScript, Vite, Vue Router, Pinia and Supabase.

## Repository map

```text
Portal/
├── .github/
│   └── workflows/
│       └── ci.yml                 Continuous integration workflow
├── public/                        Static files served as-is
├── scripts/                       Trusted local administration helpers
│   ├── provision-student.mjs     Provision a student account in development
│   ├── supabase-admin.mjs        Shared trusted Supabase admin utilities
│   └── verify-supabase-access.mjs Verify hosted Supabase access
├── src/                           Frontend application source
│   ├── assets/styles/
│   │   └── design-system.css      Shared visual language and responsive styles
│   ├── components/layout/
│   │   └── PortalShell.vue        Shared portal navigation and page shell
│   ├── lib/
│   │   ├── registrationStatus.ts  Registration-status presentation helpers
│   │   ├── resourceUrl.ts         Resource URL validation
│   │   └── supabase.ts            Browser Supabase client
│   ├── router/
│   │   ├── index.ts               Route definitions and access guards
│   │   └── returnPath.ts          Safe post-login return-path handling
│   ├── services/
│   │   └── portal.ts               Typed Supabase reads and student sign-in
│   ├── stores/
│   │   └── studentPortalStore.ts  Authentication and student portal state
│   ├── types/
│   │   └── database.ts             Database and RPC TypeScript types
│   ├── views/                      Student and admin pages
│   │   ├── DashboardView.vue       Student dashboard
│   │   ├── CoursesView.vue         Enrolled courses
│   │   ├── ScheduleView.vue        Published exam calendar and list
│   │   ├── RegisterView.vue        Student registration workflow
│   │   ├── GradesView.vue          Published results
│   │   ├── AssessmentView.vue      Coursework status
│   │   ├── ResourcesView.vue       Published learning resources
│   │   ├── PaymentsView.vue        Account transactions
│   │   ├── LoginView.vue            Student login
│   │   ├── StaffLoginView.vue       Admin login
│   │   ├── StaffView.vue            Admin content and registry management
│   │   ├── NotFoundView.vue         Fallback route
│   │   └── App.vue / main.ts        Application root and bootstrap
├── supabase/
│   ├── checks/                     Hosted database verification queries
│   │   ├── preflight.sql
│   │   ├── postflight.sql
│   │   └── isolation.sql
│   ├── functions/
│   │   └── student-login/
│   │       └── index.ts            Edge Function for student-number login
│   ├── migrations/
│   │   └── 20261012000000_baseline.sql
│   │                                Squashed database schema, RLS and RPCs
│   └── config.toml                 Local Supabase project configuration
├── .env.example                    Required public environment variables
├── index.html                      Vite HTML entry point
├── package.json                    Scripts and dependencies
├── package-lock.json               Locked dependency versions
├── tsconfig*.json                  TypeScript project configuration
├── vite.config.ts                  Vite configuration and source alias
├── README.md                       Setup and usage guide
├── PRESENTATION.md                 Demonstration and architecture guide
└── Structure.md                    This structure reference
```

## Frontend responsibilities

The application has two workspaces:

- **Student workspace**: dashboard, courses, registration, exam planner,
  resources, coursework and published results.
- **Admin workspace**: course and term catalogue, assessments, exams, marks,
  resources, registration requests and registry settings.

`studentPortalStore.ts` loads the authenticated user's permitted data and
exposes it to the views. `portal.ts` contains the typed data-access layer.
Database authorization remains the source of truth; route guards are only a
navigation convenience.

## Supabase responsibilities

The single baseline migration contains the database objects that were
previously distributed across multiple migrations. It defines:

- `fieldnotes` application tables
- `fieldnotes_private` trusted authorization/provisioning objects
- Row-level security policies
- Admin and student RPC functions
- Registration, marks, resources and exam workflows

The private schema must remain unexposed through the browser API. Trusted
scripts may use service-role credentials, but secrets must never be placed in
`VITE_*` variables.

## Generated and local-only files

The following are local or generated and should not be treated as source
structure:

- `node_modules/`
- `dist/`
- `.env.local`
- `supabase/.temp/`

The repository intentionally has no `tests/` directory after the minimal
project cleanup. Validation is performed with:

```powershell
npm.cmd run lint:check
npm.cmd run type-check
npm.cmd run build
```

## Database migration note

`20261012000000_baseline.sql` is intended for a fresh database. The linked
hosted project already has the historical migration records, so replacing its
migration history requires an explicit reconciliation step before running
`supabase db push`.

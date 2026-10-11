# Fieldnotes presentation

## Overview

Fieldnotes is a student portal for academic records, courses, results, payments,
resources and examination schedules. It also provides a separate admin workspace
for managing course resources and mark workflows.

The application is built with Vue 3, TypeScript, Pinia, Vue Router, Vite and
Supabase.

## Roles

The application has two roles:

- **Student** signs in with a student number and password and can view only their
  own protected records and published content.
- **Admin** signs in with an email and password at `/staff/login`. Admins have
  global access to configured courses and can enter marks, submit marks, approve
  marks and manage course resources.

Authorization is enforced by Supabase Auth, PostgreSQL row-level security and
security-definer database functions. The frontend does not assign roles.

## Main user journeys

### Student

1. Open `/login`.
2. Sign in with a student number and password.
3. Review the dashboard, courses, results, payments, schedule and resources.
4. Sign out when finished.

### Admin

1. Open `/staff/login`.
2. Sign in with an admin email and password.
3. Select a configured course.
4. View the roster, enter raw marks, submit marks for approval and approve
   submitted marks.
5. Add HTTPS course resources when required.

## Architecture

- `src/views/` contains student and admin pages.
- `src/stores/studentPortalStore.ts` manages authentication and portal state.
- `src/services/portal.ts` contains typed Supabase data access.
- `src/lib/supabase.ts` creates the browser client using only the publishable key.
- `supabase/migrations/` contains the database schema, RLS policies and workflow
  functions.
- `supabase/functions/student-login/` exchanges a student number and password
  for a Supabase Auth session without exposing the student's email.
- `scripts/` contains local, trusted provisioning and verification helpers.

## Data protection

- Student records are mapped to Supabase Auth identities.
- Students can read only their own records and published content for enrolled
  courses.
- Admin operations are checked in the database, not only in route guards.
- The private `fieldnotes_private` schema is not exposed through the browser API.
- Secret and service-role keys must never be placed in `VITE_*` variables.
- `.env.local`, generated output and `node_modules` are excluded from source
  control.

## Current limitations

Grade calculation, result publication and registration submission remain blocked
until the registry supplies the required rules and configuration. The current
database and UI intentionally report these capabilities as unavailable rather
than inventing academic results.

The application currently uses one Supabase browser session per browser profile.
Use separate browser profiles or an incognito window when testing student and
admin sessions at the same time.

## Demonstration checklist

1. Start the development server.
2. Demonstrate student sign-in and personal-record isolation.
3. Demonstrate admin sign-in and course selection.
4. Enter and submit a mark as admin.
5. Approve the submitted mark as admin.
6. Demonstrate that unpublished marks are not visible to students.
7. Add a published HTTPS resource and verify it appears in the student workspace.
8. Show the unavailable-state messaging for registry-dependent features.

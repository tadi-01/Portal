# Fieldnotes

A student workspace built with Vue 3, TypeScript, Pinia, Vue Router and Vite. The independent editorial design retains the original student data and application logic.

## Run

Requires Node.js `^22.18.0 || >=24.12.0`. On Windows use `npm.cmd` if PowerShell blocks `npm.ps1`.

```sh
npm install
npm run dev
npm run build
```

See [PRESENTATION_NOTES.md](PRESENTATION_NOTES.md) for the architecture, data flow, demo walkthrough, design decisions and current prototype limitations.

The application uses in-memory sample records and demo authentication. It has no connected backend, persistent storage, registration submission or payment integration. A client-side route guard requires demo sign-in before portal navigation. This is not server-side access control.

## Optional Supabase connection

Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md). The reusable client supports a project URL and publishable key through an ignored `.env.local` file. The existing demo remains usable without configuration. Supabase authentication and database-backed student records are not yet wired to the UI.

## Repository and deployment

Run `npm run lint:check` and `npm run build` before publishing source. GitHub Actions repeats these checks on pushes and pull requests. Build output is `dist/`; configure your web host to rewrite unknown application routes to `index.html`. Repository privacy does not make a deployed website private.

The error `src refspec main does not match any` means there is no local commit/branch ref to push (this checkout initially had no commits). Once the first commit exists, use `git push -u origin main`. Confirm the destination is the intended private repository first.

Only `.env.example` belongs in Git. Never commit `.env.local`, service keys, generated build output or `node_modules`. The retained demo student record includes personal details: review or replace these before inviting collaborators or deploying the app. See [RELEASE_READINESS.md](RELEASE_READINESS.md) for the inspection findings.

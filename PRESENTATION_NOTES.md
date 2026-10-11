# Fieldnotes — project presentation notes

## The project in one sentence
Fieldnotes is a student portal prototype that brings academic records, registered courses, account entries and semester guidance into one Vue application.

## Opening explanation
“I redesigned the original institution-style portal as an independent student workspace. The main change is the information layout: semester essentials come first, courses form a reading list, and personal details sit in an expandable record. I retained the existing Vue, TypeScript, Pinia and Vue Router architecture and the original data and calculations.”

## Technology and responsibilities
- Vue 3 renders the pages using Single File Components: template for markup, script setup for logic, and CSS for presentation.
- TypeScript describes data shapes and checks code before the production build.
- Pinia holds shared reactive state. Every page reads the same student record rather than keeping separate copies.
- Vue Router maps URLs to page components without full-page reloads. Route components are loaded on demand with dynamic imports.
- Vite serves the development app and produces the production assets.
- Plain CSS provides layout, responsive behavior, typography and design tokens. No new UI framework or dependency was introduced.

## Read the code in this order
1. `src/main.ts`: creates the Vue application, registers Pinia and the router, and imports the shared stylesheet.
2. `src/App.vue`: mounts the shared portal shell.
3. `src/components/layout/PortalShell.vue`: wordmark, numbered navigation, account action, main route outlet and footer.
4. `src/router/index.ts`: nine route definitions and browser title updates.
5. `src/stores/studentPortalStore.ts`: student, courses, payments, examination results, authentication functions and computed GPA.
6. `src/views/CoursesView.vue`: a small example of local input state and computed filtering.
7. `src/views/GradesView.vue`: grade-prefix filtering and the shared GPA.
8. `src/assets/styles/design-system.css`: reusable visual rules and mobile breakpoints.

## Data flow to explain
A page reads the Pinia store. Vue renders that data in the template. Input bindings (`v-model`) update local reactive values. Computed properties derive new lists automatically when those values change. `v-for` renders each record, using a stable key so Vue can track it.

Course search converts the query and the combined course code/name to lowercase, then uses `includes`. Grade filtering uses `startsWith`, so A includes both A and A-minus. Neither filter changes the underlying dataset.

GPA is credit-weighted: sum of (grade points × credits), divided by total credits. The current dataset produces 3.64 from 240.4 weighted points / 66 credits. The store returns two decimal places and handles an empty result list as 0.00. Filtering displayed results does not change the overall GPA.

## A five-minute demonstration
1. Open `/login`. Explain the split introduction and sign-in form. Submit incorrect credentials to show the validation message, then sign in with student number `N02530064B` and password `portal123`.
2. Show the overview: registration status, six courses, GPA and fees balance. Expand “Your student record”. All figures come from the shared store.
3. Open My courses. Search `web`, then `SCS2114`, then an unmatched term. Explain case-insensitive computed filtering and the empty state.
4. Open Results. Select A grades, then C grades (no matching results), then All grades. Point out that overall GPA remains 3.64.
5. Open Account. Explain separate ZiG and USD ledgers and negative payment entries. “Print statement” invokes the browser print dialog, where supported browsers can save a PDF; it is not a server PDF service.
6. Show Registration, Coursework, Exam planner and Study room. Explain their current limitations honestly.
7. Resize the browser. Navigation scrolls horizontally, page columns stack, and wide tables scroll within their containers.

## Why this design is different
The Fieldnotes identity uses paper-colored backgrounds, dark ink text, serif headings, fine dividing rules and a restrained rust accent. The overview has a reading-desk structure and a semester note panel. Pages use different structures appropriate to their content: a ledger for finance, a checklist for registration, and clear publication states for coursework and exams. Numbered navigation replaces the original institutional sidebar. External generated avatars and decorative emoji have been removed.

Accessibility includes a skip link, visible keyboard focus, labeled form fields, a login error alert, semantic navigation and headings, reduced-motion support and responsive tables. These choices should still receive user testing; they are not a claim of audited compliance.

## What works and what is a prototype
Working: navigation, demo credential checking, logout state, course search, grade filtering, computed GPA, expandable personal record and browser printing.

Prototype limitations:
- All records are hardcoded in a client-side store. There is no API, database or persistence.
- Authentication is a frontend demonstration, not security. The password is visible in source and the UI. A Vue Router guard redirects signed-out visitors to login and signed-in visitors away from login to the overview. Navigation tabs and the account header appear only after sign-in. This frontend guard is not server-side security. Refreshing resets in-memory authentication.
- Registration does not submit or modify course selections. The checklist links to records for review.
- Coursework and exam schedule have no published dataset.
- Learning platform and library destinations are not configured. They are explicitly labeled instead of exposing dead links.
- Account entries are read-only. There is no payment gateway and no actual payment processing.
- The retained sample student data should be replaced with fictional records before a public demonstration or deployment.

## Likely presentation questions
**Why Pinia instead of passing props everywhere?** The same student and course data are used across unrelated route pages. A shared store keeps them consistent.

**Why computed properties?** They express derived values declaratively and update when their reactive dependencies change.

**Did the redesign change the business logic?** The store, login comparison, GPA formula, original data, search and grade filtering remain. The changes primarily concern page structure, navigation, copy and styling. Browser printing and record expansion are small interface additions.

**How would this become production-ready?** Replace mock data with authenticated APIs, enforce permissions on the server, implement persistent registration and payment services, configure resource destinations, and add integration tests. Client-side route guards alone would not secure student data.

## Run and validate
Use a Node version supported by `package.json` (`^22.18.0 || >=24.12.0`).

```sh
npm install
npm run dev
npm run build
```

On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`. `npm run build` runs Vue/TypeScript checking and the Vite production build. Generated output is placed in `dist`. Serve that output with SPA fallback to `index.html` for direct nested routes.


## Verification for this redesign
Production build and Vue/TypeScript checks passed. Direct store checks passed for valid/invalid login, logout, GPA (3.64), and representative course/grade dataset filtering. Browser visual and interaction checks remain unverified because the local preview connection was unavailable.

## Optional Supabase capability
The optional client in `src/lib/supabase.ts` reads a project URL and publishable key from Vite environment variables. See `SUPABASE_SETUP.md`. This does not replace the demo login or connect student records to a database.

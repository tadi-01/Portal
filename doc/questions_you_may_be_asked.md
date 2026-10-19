# Questions You May Be Asked (FAQ & Defense Prep)

This document provides answers to common architectural, technical, and security questions that may arise during project reviews, evaluations, or defense presentations.

---

## 1. System Architecture & Tech Stack

### Why did you use Supabase instead of building a separate custom backend (e.g. Express, Django, FastAPI)?
- **BaaS (Backend-as-a-Service) Efficiency**: Supabase provides a production-grade PostgreSQL database, built-in Authentication, and instant Auto-generated REST APIs out of the box.
- **Security at the Database Layer**: Rather than duplicating access control logic in an intermediate API layer, security is enforced directly within the database engine using PostgreSQL Row-Level Security (RLS). This eliminates entire classes of authorization bypass bugs.
- **Serverless Simplicity**: For custom server-side requirements (such as authenticating students via their student number), serverless Deno Edge Functions handle execution without the operational overhead of managing and scaling a 24/7 dedicated server.

### Why Vue 3, Vite, and Pinia?
- **Vue 3 Composition API**: Enables modular, clean, and type-safe separation of business logic, state, and UI components (`<script setup lang="ts">`).
- **Vite**: Provides lightning-fast Hot Module Replacement (HMR) during development and highly optimized Rollup-based production builds.
- **Pinia**: Offers an intuitive, lightweight, type-safe global store for managing active user session state, student profile data, and cached portal queries across views.

---

## 2. Authentication & Authorization

### Students log in with a student number, but Supabase Auth requires an email. How does that work?
- Supabase Auth natively registers identities using standard email/password credentials.
- When a student enters their student number and password on the login screen, the request is posted to a custom Supabase Edge Function ([`supabase/functions/student-login/index.ts`](../supabase/functions/student-login/index.ts)).
- The Edge Function securely executes a database function (`resolve_student_login`) to resolve the student number to the student's internal authentication identity.
- It verifies the password against Supabase Auth server-side and returns the authenticated JWT session directly to the client.
- **The student's underlying recovery email is never exposed to the client-side browser.**

### How are passwords stored and secured?
- Passwords are never stored in plaintext or in any custom database table.
- Supabase Auth handles credential storage internally using industry-standard, salted one-way hashing algorithms (such as bcrypt/Argon2).
- Neither developers, administrators, nor database queries have access to readable passwords.

### How does the system distinguish between a Student and an Admin/Staff member?
- Staff roles are recorded in a protected schema: `fieldnotes_private.staff_assignments`.
- Database procedures and views verify the calling user's JWT ID against this private table via PostgreSQL security definer functions.
- On the frontend, client-side route guards in `router/index.ts` inspect the user's role and restrict access to `/staff` routes, while the database itself strictly refuses unauthorized RPC calls regardless of frontend manipulation.

---

## 3. Data Security & Database Design

### What is Row-Level Security (RLS) and why is it important here?
- **Row-Level Security (RLS)** is a native PostgreSQL security feature where access control policies are evaluated per table row.
- Even if a malicious user inspects network calls and directly queries the Supabase REST endpoint with their JWT token, the database engine filters rows so that the student can **only** read and modify their own records (e.g. their own course registrations, exam timetables, and published grades).
- Security does not depend on the frontend code behaving correctly; it is guaranteed by the database.

### What is the four-stage marks publishing pipeline?
To prevent accidental or unapproved release of examination and assessment results, marks undergo a strict four-stage lifecycle:
```text
draft  --->  submitted  --->  approved  --->  published
```
1. **Draft**: Entered by the instructor/grader; completely invisible to students.
2. **Submitted**: Finalized by the instructor and sent for departmental review.
3. **Approved**: Verified by the academic administrator or department head.
4. **Published**: Explicitly published. Only at this stage are records copied/made visible to the student results table.

### Why is the database organized in a custom `fieldnotes` schema instead of the default `public` schema?
- Organizing portal tables within a dedicated `fieldnotes` schema keeps the application domain isolated from default Supabase system objects and extensions.
- Administrative tables and sensitive lookup routines are stored in `fieldnotes_private`, which is completely hidden from the exposed API gateway.

---

## 4. Deployment & Hosting

### Why is a `vercel.json` file needed when deploying to Vercel?
- The frontend is a Single Page Application (SPA) using HTML5 `createWebHistory` mode.
- When a user refreshes the browser directly on a nested route (such as `/login`, `/courses`, or `/staff`), the web server looks for a physical file at that path unless told otherwise.
- `vercel.json` defines a rewrite rule (`/(.*) -> /index.html`) instructing Vercel to route all requests back to `index.html` so Vue Router can take over client-side navigation.

### Why is `.npmrc` with `legacy-peer-deps=true` included?
- The project leverages Vue Router v5, while the `@vercel/analytics` package specifies a peer dependency expecting vue-router v4.
- Adding `legacy-peer-deps=true` in `.npmrc` instructs npm to ignore peer dependency conflicts during automated CI/CD builds on Vercel, allowing clean builds without warnings or installation halts.

---

## 5. Development & Project Integrity

### Who wrote the code and how was it developed?
- Be straightforward and transparent:
  > *"The initial codebase architecture and boilerplate were developed with AI assistance and industry templates. I systematically reviewed, refactored, and tested the code, implemented custom deployment configurations, debugged dependency and schema issues, configured the Supabase database migrations and edge functions, and verified end-to-end functionality across roles."*

# Fieldnotes - Student Portal

A student portal with database intergration. Students log in with their student number to see their courses,
results, payments, exam timetable and study resources. An admin logs in separately to
approve registrations, publish marks and add resources.

**Built with**


| Tool       | What it does here                                                  |
| ------------ | -------------------------------------------------------------------- |
| Vue 3      | Draws the pages the user sees                                      |
| Vue Router | Decides which page appears for which web address                   |
| Pinia      | Holds the logged-in user's data so every page can share it         |
| Supabase   | The database (PostgreSQL), the login system and the security rules |

## Run it

You need Node.js 22.18 or newer. On Windows, if PowerShell blocks `npm`, use `npm.cmd`.

```powershell
Copy-Item .env.example .env.local
# open .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

Open http://localhost:5173. To check that everything compiles: `npm run build`.

## Set up the database (once)

1. Create a project at supabase.com and copy its URL and publishable key into `.env.local`
   (find them under **Project Settings -> API**). Restart `npm run dev` afterwards.
2. Install the tables, rules and functions:

```powershell
npx supabase login
npx supabase link --project-ref <your-project-reference>
npx supabase db push --linked
npx supabase functions deploy student-login --use-api
```

The project reference is the 20 letters at the start of your project URL.

3. **Expose the `fieldnotes` schema.** Now that `db push` created the schema, make it accessible to the portal. In the Supabase dashboard go to **Project Settings -> API**, add `fieldnotes` to **Exposed schemas**, and save. Skip this and every page fails with an "invalid schema" error.
4. In the Supabase dashboard go to **Authentication -> Users -> Add user** and create the
   admin account (an email and a password). Tick **Auto Confirm User**, otherwise the login
   can fail with an unconfirmed-email error.
5. Open `supabase/seed.sql`, change the two values at the top (the programme code and the
   admin email), then paste it into the dashboard's **SQL Editor** and press Run. It adds a
   term, three courses, assessments and exam times, switches on registration, and makes your
   user an admin. It is safe to run twice.
6. Create a student login. Save a small file **outside the project folder**, for example
   `student.json`:

```json
{
  "email": "student@example.com",
  "password": "student123",
  "studentNumber": "N02612345X",
  "name": "Alex Taylor",
  "programmeCode": "SCS",
  "programmeName": "Computer Science",
  "academicYear": "2026",
  "part": 1,
  "semester": 1,
  "accountBalance": 0
}
```

`programmeCode` must be the same programme code used by the course offerings.

7. Then run:

```powershell
node scripts/provision-student.mjs --development --input C:\path\to\student.json
```

Repeat with different details for more students.

## Folder Structure

```ini
Portal/
├── src/
│   ├── views/                  one file per page; StaffView.vue is the admin page
│   ├── components/layout/      PortalShell.vue - the header and menu every page shares
│   ├── router/index.ts         which address shows which page, and who may open it
│   ├── stores/                 studentPortalStore.ts - login and the data pages display
│   ├── services/portal.ts      the functions that ask Supabase for data
│   ├── lib/supabase.ts         the connection to Supabase
│   ├── types/database.ts       a description of the tables, so mistakes are caught early
│   ├── assets/styles/          colours and layout shared by all pages
│   ├── App.vue, main.ts        where the app starts
├── supabase/
│   ├── migrations/             the database: tables, security rules and functions
│   ├── seed.sql                sample courses and the admin account (step 4 above)
│   ├── functions/student-login/ lets students log in with a student number
│   └── config.toml             Supabase settings (keeps the login function reachable)
├── doc/                        setup guide, presenter notes, and defense FAQs
├── scripts/                    creates student logins (step 5 above)
├── .env.example                the two settings you must provide
└── package.json, vite.config.ts, index.html, tsconfig*.json, env.d.ts, public/
```

## How it works

**A student logs in and sees their results.**

1. The student types a student number and password on `LoginView.vue`.
2. The page calls `login()` in the store, which calls `studentSignIn()` in `services/portal.ts`.
3. Supabase logins use an email, not a student number. So the `student-login` function
   (in `supabase/functions`) looks up the email for that student number, signs in, and hands
   back a session. The browser never sees the email.
4. The store then calls `readStudentData()`, which reads the tables (courses, results,
   payments...) from Supabase.
5. **The database filters the rows.** A rule called *row-level security* (RLS) in the
   migration means each student can only read their own rows, however the request is made.
6. Pages such as `GradesView.vue` simply display what the store holds.

**The admin side works the same way, with one difference:** its buttons call *database
functions* (`supabase.rpc(...)`). Each function first checks "is this user an admin?" and
refuses if not. So even if a student typed the admin address, they are sent back to the
student pages, and even if they forced the request, the database would refuse it.

**Marks go through four steps** so nothing reaches a student by accident:

```sh
draft  ->  submitted  ->  approved  ->  published
(admin only, invisible)                 (copied to the table students can read)
```

## Demonstration

Use two browser windows, one normal and one private/incognito, because one browser holds
only one Supabase login at a time.

1. **Student window** - open `/login`, sign in, look at the dashboard. Open *Registration*,
   tick CS101 and CS102, press Submit.
2. **Admin window** - open `/staff/login`, sign in. On *Registrations* approve both requests.
   (Approving is what enrols the student.)
3. **Marks & results** - choose CS101, enter a score for the student, press Submit, then
   Approve, type a grade such as `B`, press Publish.
4. **Resources** - add a title and an https link, tick *Show to enrolled students*.
5. **Student window** - refresh. *My courses* now lists the enrolled courses, *Results*
   shows the published grade, *Study room* shows the link.
6. **Show the security** - as the student, try opening `/staff` (you are sent back). In
   Supabase's table editor, point out that the data lives in real tables.

## Documentation & Defense Preparation

For in-depth guides, presentation resources, and defense FAQs, refer to the documentation in [`doc/`](doc/):

- **[Setup &amp; Deployment Guide](doc/Setup.md)**: Full steps for Supabase database setup and Vercel hosting.
- **[Presenter Notes &amp; Demo Script](doc/presenter_notes.md)**: Presentation outline, timeline, and dual-window live demo walkthrough.
- **[Questions You May Be Asked](doc/questions_you_may_be_asked.md)**: Technical, architectural, and security answers for defense preparation.

## Proposed Future Work

- **Administrative Management Interfaces**: UI screens for staff to schedule academic terms, manage course offerings, create assessments, and publish exam timetables directly from the portal.
- **Automated Academic Grading & GPA**: Automated calculation of weighted course marks and Grade Point Averages (GPA) upon exam score publishing.
- **Interactive Coursework Modules**: Online coursework submission and rubric-based feedback delivery directly within the portal.
- **Payment Gateway Integration**: Self-service student tuition and fee payment processing via external payment gateways (e.g., Stripe, Paynow) with automated receipt generation.

---

Never commit `.env.local`, any secret or service-role key, or private student details.

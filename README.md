# Fieldnotes - Student Portal

A student portal with database intergration. Students log in with their student number to see their courses,
results, payments, exam timetable and study resources. An admin logs in separately to
approve registrations, publish marks and add resources.

**Built with**

| Tool | What it does here |
| --- | --- |
| Vue 3 | Draws the pages the user sees |
| Vue Router | Decides which page appears for which web address |
| Pinia | Holds the logged-in user's data so every page can share it |
| Supabase | The database (PostgreSQL), the login system and the security rules |

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

2. **Expose the `fieldnotes` schema.** The portal keeps its tables in a schema called
   `fieldnotes`, and Supabase hides custom schemas by default. In **Project Settings -> API**,
   add `fieldnotes` to **Exposed schemas** and save. Skip this and every page fails with an
   "invalid schema" error.

3. Install the tables, rules and functions:

```powershell
npx supabase login
npx supabase link --project-ref <your-project-reference>
npx supabase db push --linked
npx supabase functions deploy student-login --use-api
```

The project reference is the 20 letters at the start of your project URL.

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
  "password": "ChooseAPassword1",
  "studentNumber": "N0001",
  "name": "Tadiwa Example",
  "programme": "GENERAL"
}
```

`programme` must be the same programme code you used in the seed. Then run:

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
├── scripts/                    creates student logins (step 5 above)
├── .env.example                the two settings you must provide
└── package.json, vite.config.ts, index.html, tsconfig*.json, env.d.ts, CNAME, public/
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

## Questions you may be asked

- **Why Supabase?** It provides a hosted PostgreSQL database, user login and security rules
   together, so there is no separate backend server to build and run.
- **What is row-level security?** A rule inside the database that decides which rows each
   user may read or change. It means security does not depend on the web page behaving.
- **How are passwords stored?** We never store them. Supabase's login system stores a
   one-way hash.
- **Why does the login use a function?** Students know their student number, but Supabase
   logs in with email. The function translates one into the other on the server.
- **Who wrote the code?** Be direct: the starting code was generated with AI, then you
   reviewed it, simplified it and learned how it works. Say which parts you can explain.

## What is not finished

- Admin screens for creating courses, terms, assessments and exam times were removed to
   keep the admin page small. This data is added with `seed.sql` or the Supabase dashboard.
   (The database functions for them still exist and could get screens later.)
- The grade is typed by the admin; there is no automatic grade or GPA calculation, and the
   *Coursework* page is a placeholder.
- _Account_ (payments) is read-only. Rows must be added to the `account_transactions`
   table by hand.
- A browser keeps one Supabase login, so use a private window to test two roles at once.

Never commit `.env.local`, any secret or service-role key, or a student details file.

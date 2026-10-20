# Deployment & Setup Guide

This guide details how to set up the **Supabase** backend and deploy the **Fieldnotes Student Portal** to **Vercel**.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (version `^22.18.0` or `>=24.12.0`)
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account
- A GitHub / GitLab repository containing this project

---

## 1. Supabase Backend Setup

### 1.1 Create the Project

1. Log in to [supabase.com](https://supabase.com) and click **New Project**.
2. Set a name and strong database password, then choose your region.
3. Once provisioned, navigate to **Project Settings -> API** and copy:
   - **Project URL** (e.g. `https://abcdefghijklmnopqrst.supabase.co`)
   - **Publishable / Anon Key**
   - **Project Reference ID** (the 20-character identifier at the start of your URL, e.g., `abcdefghijklmnopqrst`).

### 1.2 Deploy Database Migrations & Edge Function

Open PowerShell or your terminal in the project directory:

```powershell
# Log in to Supabase CLI
npx.cmd supabase login

# Link this repository to your remote project
npx.cmd supabase link --project-ref <your-project-reference>

# Push the database schema, tables, and RLS policies
npx.cmd supabase db push --linked

# Deploy the student-login Edge Function
npx.cmd supabase functions deploy student-login --use-api
```

### 1.3 Expose the `fieldnotes` Schema

> [!IMPORTANT]
> The portal stores its tables and views in a custom PostgreSQL schema named `fieldnotes`. Supabase hides custom schemas by default. Now that `db push` has created the schema in PostgreSQL, expose it to the API:

1. In the Supabase dashboard, go to **Project Settings -> API**.
2. Scroll to **Exposed schemas**.
3. Select `fieldnotes` from the list and click **Save**.

### 1.4 Create the Admin Account

1. Go to **Authentication -> Users** in the Supabase dashboard.
2. Click **Add user -> Create user**.
3. Enter your admin email and password.
4. **Check "Auto Confirm User"** (if not confirmed, login will be rejected).

### 1.5 Seed Initial Data

1. Open [`supabase/seed.sql`](../supabase/seed.sql) in your code editor.
2. At the top of the file (lines 20-21), set your values:

   ```sql
   v_programme   text := 'SCS';               -- Your academic programme code
   v_admin_email text := 'admin@example.com'; -- The admin email you created in step 1.4
   ```
3. Copy the entire file contents.
4. In the Supabase dashboard, go to **SQL Editor**, paste the script, and click **Run**.
   *(This enables course registration, adds semester terms, sample courses, assessments, and promotes your user to admin)*.

### 1.6 Provision a Student Account

Create a small JSON file outside the project directory (e.g., `C:\temp\student.json`):

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

Run the provision script from the project root:

```powershell
node scripts/provision-student.mjs --development --input C:\temp\student.json
```

---

## 2. Vercel Frontend Deployment

### 2.1 Push to Git

Ensure all changes are committed and pushed to your remote repository:

```powershell
git add .
git commit -m "Prepare for Vercel deployment"
git push origin master
```

### 2.2 Import to Vercel

1. Log in to [vercel.com](https://vercel.com) and click **Add New... -> Project**.
2. Select your Git repository and click **Import**.
3. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 2.3 Add Environment Variables

Under the **Environment Variables** section on Vercel, add:


| Key                             | Value                                    | Description                          |
| --------------------------------- | ------------------------------------------ | -------------------------------------- |
| `VITE_SUPABASE_URL`             | `https://<your-project-ref>.supabase.co` | Your Supabase project URL            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `<your-publishable-key>`                 | Supabase anon/publishable public key |

### 2.4 Deploy

Click **Deploy**. Vercel will install dependencies, build the Vue 3 app, and provide your live production URL.

---

## Key Deployment Files Included in the Project

- **[`.npmrc`](../.npmrc)**: Configures `legacy-peer-deps=true` so `@vercel/analytics` and `vue-router` install cleanly during Vercel's build step.
- **[`vercel.json`](../vercel.json)**: Configures SPA rewrites (`/(.*) -> /index.html`) to prevent 404 errors when refreshing on client-side routes like `/login` or `/staff`.

---

## 3. Verification & Testing

Because a browser keeps one active Supabase authentication session at a time, use two windows to test:

1. **Student Login**:
   - Open normal browser window to `/login`.
   - Log in with Student Number (e.g., `N02512345X`) and the password you provisioned.
   - Go to **Registration**, select courses, and submit.
2. **Staff / Admin Login**:
   - Open an **Incognito / Private** window to `/staff/login`.
   - Log in with the admin email and password.
   - Go to **Registrations** to approve the student's enrollment, and **Marks & Results** to publish grades.

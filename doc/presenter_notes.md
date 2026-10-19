# Presenter Notes: Fieldnotes Student Portal

A structured walkthrough guide, presentation timeline, and live demonstration script for presenting the **Fieldnotes Student Portal**.

---

## 1. Project Overview & Elevator Pitch (1 Minute)

> *"Good morning/afternoon. Today I am presenting **Fieldnotes**, a modern, cloud-native Student Portal designed for higher education institutions. It provides students with a unified dashboard to manage course registrations, view published examination results, access timetables, and find study resources. Simultaneously, academic administrators have an administrative portal to review and approve registrations, manage marks through a strict multi-tier audit pipeline, and distribute learning materials—all backed by enterprise-grade security."*

### Key Selling Points:
- **Serverless BaaS Architecture**: Built with Vue 3, TypeScript, and Pinia, backed by Supabase (PostgreSQL, Supabase Auth, and Deno Edge Functions).
- **Defense-in-Depth Security**: Access control is not left to the frontend; PostgreSQL Row-Level Security (RLS) ensures students can strictly only view their own academic records.
- **Student Number Authentication**: A dedicated serverless Edge Function translates institutional student numbers (`N02512345X`) into secure authentication sessions without exposing user emails.

---

## 2. Recommended Presentation Timeline (8 - 10 Minutes)

| Time | Segment | Focus |
| --- | --- | --- |
| **0:00 - 1:30** | Introduction & Problem Statement | Current academic portal challenges, goals of Fieldnotes |
| **1:30 - 3:30** | Architecture & Security Overview | Vue 3 + Vite, Pinia, Supabase, RLS, Edge Functions |
| **3:30 - 7:30** | **Live Demonstration** | Dual-window demo (Student vs Staff workflow) |
| **7:30 - 8:30** | Future Roadmap | Automated grading, online payments, coursework submissions |
| **8:30 - 10:00**| Q & A | Answering technical & architectural questions |

---

## 3. Step-by-Step Live Demonstration Script

> [!TIP]
> **Setup Before You Begin**:
> - Open **Window 1 (Standard browser)** at `/login`.
> - Open **Window 2 (Incognito / Private browser)** at `/staff/login`.
> - (Optional) Have the Supabase Dashboard open in a background tab to showcase real-time database updates.

### Phase 1: Student Experience (Window 1)
1. **Login**:
   - Enter Student Number: `N02512345X`
   - Enter Password: `Password123!`
   - *Talking point*: Explain that students log in directly with their student number, powered by a custom Edge Function.
2. **Dashboard Overview**:
   - Highlight the clean, responsive interface, upcoming exams, and account summary.
3. **Course Registration**:
   - Navigate to the **Registration** tab.
   - Select available courses (e.g., `CS101` and `CS102`) and click **Submit Registration**.
   - Show that the registration enters a `submitted` / `pending approval` status.

### Phase 2: Administrative Approval & Grading (Window 2 - Incognito)
1. **Admin Login**:
   - Log in using your admin email and password.
2. **Approve Registrations**:
   - Navigate to the **Registrations** tab.
   - Point out Alex Taylor (`N02512345X`) with pending requests.
   - Click **Approve**.
   - *Talking point*: Approving the request automatically generates an active enrollment record in the database.
3. **Four-Stage Marks Pipeline**:
   - Navigate to **Marks & Results**.
   - Select `CS101`, pick the assessment (e.g. *Final Exam*), and enter a score for the student.
   - Demonstrate the audit trail progression:
     $$\text{Draft} \longrightarrow \text{Submitted} \longrightarrow \text{Approved} \longrightarrow \text{Published}$$
   - Assign a letter grade (e.g., `A`) and click **Publish**.
   - *Talking point*: Unapproved or draft marks are completely hidden from students until explicitly approved and published.
4. **Publish Resources**:
   - In **Resources**, add a study link (e.g. `https://example.edu/cs101-notes`), title it *"Lecture 1 Notes"*, check **Show to enrolled students**, and save.

### Phase 3: Immediate Student Reflection (Back to Window 1)
1. **Refresh the Student Portal**:
   - Show **My Courses**: `CS101` and `CS102` now appear as active enrolled courses.
   - Show **Results**: The published grade `A` is now visible on the student's transcript.
   - Show **Study Room**: The newly published lecture resource link appears automatically.

### Phase 4: Proving Security & Role Separation
1. **Attempt Unauthorized Navigation**:
   - In the Student browser, manually type `/staff` into the address bar.
   - Show that the Vue Router navigation guard immediately redirects the student back to the student dashboard.
   - *Talking point*: Even if a malicious user bypasses the frontend router and attempts direct API calls, PostgreSQL Row-Level Security and RPC privilege checks reject the transaction at the database engine level.

---

## 4. Key Takeaways & Conclusion

- **High Reliability**: No fragile monolithic backend server; serverless architecture minimizes server downtime and hosting costs.
- **Maintainable & Modern**: Clean TypeScript definitions, modular Pinia stores, and componentized Vue 3 views.
- **Enterprise-Grade Authorization**: Real-world audit workflows (four-stage grading) and database-level RLS.

---

## 5. Defense & FAQ Reference

For comprehensive technical answers to questions examiners or interviewers may ask regarding:
- Why Supabase vs Express?
- How RLS policies protect sensitive rows
- How student number translation works in Edge Functions
- How password security and hashing are handled

Refer directly to [`doc/questions_you_may_be_asked.md`](./questions_you_may_be_asked.md).

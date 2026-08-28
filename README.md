# GivePulse — Blood Donation Platform

A bilingual (EN/BN) blood donation platform: donor discovery, blood bank
inventories with reservations, blood requests, an AI-style compatibility &
safety checker, real-time messaging, medical test reports, donation history,
donor complaints/blacklisting, and an admin dashboard with charts.

The project has two parts:

- **`/` (this folder)** — the React + Vite frontend
- **`/server`** — a Node.js + Express backend backed by **Postgres**
  (works with a free [Supabase](https://supabase.com) database) — a real,
  permanent database, not localStorage and not a local file.

## 1. Create a free Supabase database

1. Go to [supabase.com](https://supabase.com), sign up (no credit card),
   and create a new project.
2. In the project, go to **Project Settings → Database → Connection
   string → URI**, and copy it. It looks like:
   `postgres://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres`
3. Copy `server/.env.example` to `server/.env` and paste that connection
   string in as `DATABASE_URL` (with your real password filled in).

## 2. Run the backend

```bash
cd server
npm install
npm run seed    # creates the tables and seeds 1000 donors + 100 blood banks
npm start       # starts the API on http://localhost:4000
```

`DATABASE_URL` is required for both of these — there's no local-file
fallback. Every environment (your laptop, a teammate's laptop, production)
talks to the same real Postgres database, so nothing is ever lost when a
server restarts. Re-running `npm run seed` wipes the database and
regenerates the seed data from scratch, so only run it when you actually
want a clean slate.

## 3. Run the frontend

In a second terminal, from the project root:

```bash
npm install
npm run dev
```

Open the printed local URL (usually http://localhost:5173). It talks to the
backend at `http://localhost:4000/api` by default. To point it somewhere
else (e.g. a deployed backend), create a `.env` file:

```
VITE_API_URL=https://your-backend.example.com/api
VITE_SOCKET_URL=https://your-backend.example.com
```

## Logins

- **Admin:** `rimonkhan0403@gmail.com` / `232002091`
- **Seeded donors:** any of the 1000 seeded accounts, e.g.
  `<firstname>.<lastname><n>@example.com` (see `server/db/seed.js`) with
  password `donor12345`
- Anyone can also register their own account from the app — new accounts
  go straight into the real Postgres database and are never wiped, only a
  manual re-seed removes them.

## What changed from a plain frontend prototype

This project was migrated from a localStorage-only prototype to a real
client/server app:

- **Real backend & database.** Every read/write goes through the Express
  API and is stored in Postgres (`server/db/connection.js`), not the browser.
  Nothing is lost on refresh, browser change, or `localStorage.clear()`.
- **Auth.** JWT + bcrypt-hashed passwords (`server/routes/auth.js`,
  `server/middleware/auth.js`).
- **Unique donor IDs.** Every account gets a permanent `GP-XXXXXX` donor
  code (`nextDonorCode()` in `server/db/connection.js`) the moment they
  register. The compatibility checker, messaging, and admin views all key
  off this ID — never off the name — so two donors who happen to share a
  name are never mixed up.
- **Mandatory onboarding.** `RequireOnboarding` (in
  `src/components/RequireOnboarding.jsx`) routes any signed-in non-admin
  user straight to `/profile` then `/reports` until both their personal
  details and at least one medical report are saved, before they can reach
  the rest of the app.
- **Medical reports.** Users can add as many reports as they like and
  delete any of them (`server/routes/reports.js`, `src/pages/Reports.jsx`).
  There's a one-click "AI analysis" of everything a user has saved
  (`analyzeDonorReports` in `server/utils/safetyAssessment.js`).
- **AI compatibility checker.** Rule-based safety assessment
  (`server/utils/safetyAssessment.js`) that always ends with: *"I am an AI,
  and I can sometimes make mistakes. Please consult a qualified doctor or
  blood-bank medical officer before making a final decision."* (shown in
  both English and Bangla).
- **Faster, real-time messaging.** Socket.io (`server/socket.js`) pushes
  new messages to both participants instantly instead of the client
  polling. Sending is optimistic in the UI so it feels instant even before
  the server confirms.
- **Blood bank reservations.** Reserving a unit decrements stock and
  auto-releases back to stock after 3 hours if unused; the server sweeps
  expired holds every minute (`server/routes/bloodBanks.js`).
- **Near me / All requests.** Blood requests are auto-tagged with the
  requester's own division at creation time, so the "Near me" tab on
  `/requests` can filter without asking anyone to re-type their location.
- **Honest report verification.** Choosing "No specific test" needs
  nothing further. Picking an actual test (HIV, Hepatitis B, etc.)
  requires a date, a result, **and** a real uploaded file (image or PDF,
  stored as base64 in Postgres, not just a filename) before it can be
  saved — this is what stops someone from just typing in a fake clean
  result (`server/routes/reports.js`, `GET /api/reports/:id/file`).
- **National ID (NID) on profile.** Required on the profile form
  (`src/pages/Profile.jsx`), stored per donor, and never shown to other
  users — only used for identity and, if a complaint is confirmed, admin
  moderation.
- **Complaints & blacklisting.** Any signed-in user can file a complaint
  against a donor from that donor's profile page, with a required proof
  image (again, the real file, not just a name). Complaints are visible
  **only** to admins at `/admin/complaints`
  (`server/routes/complaints.js`). From there an admin can dismiss it,
  blacklist the donor (by NID, so the same person can't just make a new
  account to dodge the ban — enforced in `POST /api/donors/me`), or
  permanently delete the donor's account. Blacklisted donors disappear
  from the public directory but remain visible to admins.
- **Profile save UX.** Saving shows a "Saved successfully" confirmation,
  the edit form is replaced with a read-only summary of what was just
  saved, and an "Edit" button switches back into edit mode.

## Deploying for free (Supabase + Render + Vercel)

The backend uses Postgres via the `pg` driver, and works with a free
Supabase database. Since step 1 above already has you create that
database and put its connection string in `server/.env`, the same
`DATABASE_URL` is what production uses too — the exact same code, no
local-file fallback, no data loss on restart.

1. **Push this repo to GitHub** (see below).
2. You already created a Supabase project and have its `DATABASE_URL`
   from step 1 above.
3. **Deploy the backend to Render** (render.com, free, no card):
   New → Web Service → connect your GitHub repo → Root Directory: `server`
   → Build Command: `npm install` → Start Command: `npm start`. Add
   environment variables: `DATABASE_URL` (your Supabase connection string
   — use the **Connection pooling** URI from Supabase, not the direct one,
   since Render's free tier works better with pooled connections),
   `JWT_SECRET` (any long random string), `CORS_ORIGIN` (your Vercel URL,
   added after step 4).
4. **Seed the production database once**, from your own machine:
   `cd server && npm run seed` — it writes straight to Supabase since
   that's what `DATABASE_URL` already points to.
5. **Deploy the frontend to Vercel** (vercel.com, free, no card): New
   Project → import the repo → Root Directory: the project root (not
   `server`) → add `VITE_API_URL` = `https://your-render-url.onrender.com/api`
   and `VITE_SOCKET_URL` = `https://your-render-url.onrender.com`.
6. Go back to Render and set `CORS_ORIGIN` to your Vercel URL, then
   redeploy the backend.
7. **Keep your database from auto-pausing.** Supabase's free tier pauses
   a project after 7 days with zero real database activity (this doesn't
   delete anything, but it does mean the next request is slow until you
   click "Restore" in the Supabase dashboard). This repo already includes
   `.github/workflows/keep-alive.yml`, which pings a real query on your
   backend twice a week — just add one repo secret to activate it: on
   GitHub, go to this repo's **Settings → Secrets and variables →
   Actions → New repository secret**, name it `BACKEND_URL`, and set it
   to your Render URL (e.g. `https://givepulse.onrender.com`, no
   trailing slash).

Render's free web service sleeps after inactivity (cold start on the next
request, ~30-60s) — that's normal for free tiers and doesn't affect your
data, since it's stored in Supabase, not on Render's disk.

## About the `npm audit` warning

`npm audit` may flag issues in `react-router`'s **RSC / server-action
mode** (a server-rendered framework feature). GivePulse's frontend is a
plain client-side SPA using `BrowserRouter`, `Routes`, `Link`, and
`useNavigate` — none of the vulnerable code paths are used.

# Switchboard

**MacroFactor for career execution.**

Switchboard is a mobile-first web app that helps software engineering candidates stay consistent during a job search. Instead of juggling spreadsheets, notes apps, and LeetCode tabs, you log DSA practice, track applications, manage projects, and review daily progress in one calm, action-oriented workspace.

## Philosophy

- **Execution over planning** — small daily actions compound; the dashboard shows what matters today.
- **One place for momentum** — DSA, applications, and projects share the same rhythm and goals.
- **Spaced repetition for problems** — revisit scheduling is built in, not bolted on.
- **Minimal UI** — dark, MacroFactor-inspired design; detail lives on dedicated pages, not cluttered dashboards.

---

## Current MVP (V2)

### Dashboard (`/dashboard`)

The home screen shows:

- **Hero** — date, title, and daily tagline.
- **Progress carousel** — swipe (or use dots) between **Today**, **This week**, and **This month**.
- **Gauge** — completed vs target for the active period, with per-metric tracker bars (DSA, Applications, Projects).
- **Action cards** — shortcuts to Activity, DSA, Applications, and Projects with live metrics.

First-time users are prompted to set daily goals.

### DSA (`/dashboard/dsa`)

- **Today's progress** — problems solved vs daily goal; revisits completed vs due today.
- **Upcoming revisits** — spaced-repetition queue with due dates.
- **Tracked problems** — searchable list of all logged problems; tap for detail.

Problem detail pages support view, edit (via Quick Add sheet), mark reviewed, and delete.

### Applications (`/dashboard/applications`)

Tabbed pipeline by stage:

| Status | Meaning |
|--------|---------|
| **Wishlist** | Roles you plan to apply to |
| **Applied** | Submitted applications |
| **OA** | Online assessment stage |
| **Interview** | Interview loop |
| **Offer** | Offer received |
| **Rejected** | Closed / rejected |

Each application stores company, role, job ID, URL, notes, and optional **resume** (PDF/DOC/DOCX via Supabase Storage). Detail pages support edit, resume download/replace/remove, and delete.

### Projects (`/dashboard/projects`)

Portfolio and interview-story work containers with status **Active**, **Paused**, or **Completed**, plus next step and notes.

### Activity (`/dashboard/activity`)

Chronological log of everything you've done — filter by today, yesterday, this week, or a custom date; search across entries.

### Profile (`/dashboard/more`)

Account info, goal settings link, and logout. Admins also see an Admin link.

### Goal system (`/dashboard/goals`)

Set daily targets:

- DSA problems solved
- Applications submitted
- Project sessions

Goals drive dashboard gauge targets and tracker bars.

### Quick Add (FAB)

Floating action button opens a unified bottom sheet (mobile) or centered modal (desktop) to create:

| Tab | Creates |
|-----|---------|
| **DSA** | Problem with topic/pattern, confidence, notes, revisit schedule |
| **Application** | Application (resume upload when status is past wishlist) |
| **Project** | Project with status and next step |
| **Note** | Tagged note (stored in `Note` model) |

The same sheet opens in **edit mode** from detail pages, with fields pre-filled and primary action **Save changes**.

### Admin (`/dashboard/admin`)

Admin-only user management (create users). Requires `role: ADMIN`.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Custom CSS (`app/globals.css`) — dark MacroFactor-inspired design |
| ORM | [Prisma](https://www.prisma.io/) |
| Database | PostgreSQL ([Supabase](https://supabase.com/)) |
| File storage | Supabase Storage (resumes) |
| Auth | Cookie-based JWT sessions (`jose` + `bcryptjs`) |
| Validation | Zod (API request bodies) |
| Icons | Lucide React |
| Deployment | [Vercel](https://vercel.com/) (recommended) |

---

## Folder structure

```
app/
  api/                    # REST API routes (auth, CRUD, goals, progress, admin)
  dashboard/              # Authenticated app pages
  login/ signup/          # Auth pages
  globals.css             # Global styles
  layout.tsx              # Root layout

components/
  activity/               # Activity feed UI
  applications/           # Application workspace + detail
  dashboard/              # Shell nav, macro dashboard, action cards, goals
  dsa/                    # DSA workspace + problem detail
  projects/               # Projects workspace + detail
  quick-add/              # Unified EntrySheet (create + edit)
  AdminPanel.tsx          # Admin user management
  DashboardClient.tsx     # Quick Add FAB
  LoginForm.tsx SignupForm.tsx LogoutButton.tsx

lib/
  auth.ts                 # Session JWT helpers
  db.ts                   # Prisma client singleton
  macro-dashboard.ts      # Dashboard data aggregation
  action-dashboard.ts     # Action card metrics
  progress-metrics.ts     # Gauge / period progress math
  goals.ts                # User goals defaults + types
  problem-utils.ts        # DSA helpers, revisit queue, serialization
  applications-utils.ts   # Pipeline status helpers
  projects-utils.ts       # Project stats
  activity.ts             # Server-side activity logging
  activity-utils.ts       # Activity feed filtering + categories
  review-schedule.ts      # Spaced repetition date math
  resume-storage.ts       # Supabase resume upload/delete
  resume-utils.ts         # Resume filename helpers
  supabase-admin.ts       # Supabase service client
  period-utils.ts         # Date range helpers
  dashboard-utils.ts      # Shared formatting
  user-display.ts         # Display name helper

prisma/
  schema.prisma           # Database schema
  migrations/             # SQL migrations
  seed.ts                 # Dev seed (admin + demo user, no sample data)

scripts/
  dev.mjs                 # Local dev server helper
```

### Where to find things

| Concern | Location |
|---------|----------|
| UI components | `components/` |
| Page routes | `app/dashboard/` |
| API routes | `app/api/` |
| Business logic | `lib/` |
| Database schema | `prisma/schema.prisma` |
| Styles | `app/globals.css` |

---

## Database (Prisma models)

### `User`

Account with email/password auth and role (`USER` or `ADMIN`). Owns all user data.

### `UserGoals`

One row per user — daily targets for DSA, applications, and project sessions. Drives dashboard gauge math.

### `Problem`

DSA problem log: name (unique per user), topic, pattern, confidence (1–5), notes, `lastPracticed`, `nextReview`, `revisitCount`. Powers spaced repetition and DSA metrics.

### `Application`

Job application: company + role (unique per user), status pipeline, job metadata, notes, optional resume fields (`resumeFileName`, `resumeStoragePath`, `resumeUploadedAt`).

### `Project`

Work container: title, status (`ACTIVE` | `PAUSED` | `COMPLETED`), `nextStep`, notes.

### `Note`

Quick-captured notes with title, body, and tag. Created via Quick Add.

### `Activity`

Append-only event log (`label` + timestamp). Every meaningful action writes here; powers the Activity page and dashboard progress calculations.

**Relationships:** `User` → one-to-many on all entity tables; `User` → optional one `UserGoals`.

---

## Dashboard logic

### Goals

Stored in `UserGoals`. Defaults (if unset): 3 DSA/day, 2 applications/day, 1 project session/day.

### Daily / weekly / monthly progress

`lib/progress-metrics.ts` classifies `Activity` rows by label prefix:

- **DSA** — `Solved …`
- **Applications** — `Applied to …` or status moves to APPLIED
- **Projects** — `Started/Updated/Completed project …`

Counts are summed per period (day, week, month). Targets scale from daily goals (weekly = daily × days elapsed in week, etc.).

### Gauge

`completed / target` → percentage for the semi-circle gauge. **Remaining** and **Target** flank the gauge. Tracker bars below show per-metric progress with green/orange accents.

### Action cards

`lib/action-dashboard.ts` builds live subtitles: today's activity count, DSA review queue size, active applications, active projects.

---

## DSA system

### Problem tracking

Log via Quick Add or edit from detail. Fields: name, topic/pattern, confidence, notes.

### Confidence

1–5 scale; influences default revisit interval when no explicit schedule is chosen.

### Revisit scheduling

`lib/review-schedule.ts` supports presets (tomorrow → 1 month) or custom date. `nextReview` drives the upcoming revisits list.

### Mark reviewed

Detail page **Mark Reviewed** PATCH increments `revisitCount`, updates `lastPracticed`, and schedules the next review from current confidence.

### Spaced repetition

Problems due today appear in DSA today's progress. Future revisits appear in **Upcoming Revisits**, sorted by date.

---

## Applications

### Pipeline

Statuses: `WISHLIST` → `APPLIED` → `OA` → `INTERVIEW` → `OFFER` / `REJECTED`.

### Resume uploads

When status is not wishlist, Quick Add and edit support resume upload. Files go to Supabase Storage bucket `resumes` at path `{userId}/{applicationId}/resume.{ext}`. Max 5 MB; PDF/DOC/DOCX only.

API: `POST` upload, `GET` download, `DELETE` remove.

### Legacy URLs

`/dashboard/applications/{status}` redirects to `?tab={status}` for bookmark compatibility.

---

## Projects

### Status

- **Active** — current focus
- **Paused** — on hold
- **Completed** — done

Detail page supports pause, resume, complete, edit, and delete.

### Philosophy

Projects are lightweight containers — one **next step** field keeps focus on the next action, not task hierarchies.

---

## Quick Add flows

All create paths go through `POST /api/progress` with a `type` discriminator.

### DSA (`type: "problem"`)

Splits `topicPattern` on `/` into topic + pattern. Sends `reviewPreset` or `customReviewDate`. Creates or updates by normalized problem name.

### Application (`type: "application"`)

Creates application row. Resume uploads separately to `/api/applications/{id}/resume` after create when applicable.

### Project (`type: "project"`)

Creates project with title, status, next step, notes.

### Note (`type: "note"`)

Creates `Note` row.

### Edit mode

`EntrySheet` PATCHes `/api/problems/{id}`, `/api/applications/{id}`, or `/api/projects/{id}` depending on entity.

---

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Prisma connection (use Supabase pooler URL in production) |
| `DIRECT_URL` | Yes | Direct Postgres URL for migrations |
| `SESSION_SECRET` | Yes | JWT signing secret for session cookies |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side storage access for resumes |
| `APP_URL` | No | Public origin used in password reset links (falls back to `VERCEL_URL`, then the request host) |
| `RESEND_API_KEY` | No | [Resend](https://resend.com/) key for password reset email. Unset in dev ⇒ the reset link is printed to the server console instead of emailed |
| `MAIL_FROM` | No | From address for outgoing mail (default: `Switchboard <onboarding@resend.dev>`) |
| `ADMIN_EMAIL` | No | Seed script admin email (default: `admin@switchboard.local`) |
| `ADMIN_PASSWORD` | No | Seed script admin password |

### Password reset

> **Dormant until mail is configured.** The flow works end to end, but with no `RESEND_API_KEY` the link is only
> printed to the server console — so the "Forgot password?" link is deliberately **not** shown on the login page.
> Add it back to `.auth-card-actions` in `app/login/page.tsx` once Resend is set up.

`/forgot-password` emails a one-time link to `/reset-password?token=…`. Tokens are stored as SHA-256 hashes in
`AuthToken` (keyed by `purpose`), expire after 60 minutes, and are single-use — requesting a new link invalidates the
previous one.
Resetting or changing a password stamps `User.passwordChangedAt`, which `getSession()` compares against the session
JWT's `iat` to sign out every other device. Signed-in users can change their password at
`/dashboard/password` (requires the current password).

Rate limiting on these endpoints (`lib/rate-limit.ts`) is an in-memory fixed window: it is per-instance and resets on
cold start, so treat it as a deterrent rather than a guarantee.

Copy `.env.example` to `.env.local` for local development.

---

## Local development

### Prerequisites

- Node.js 18+
- PostgreSQL (or Supabase project)
- Supabase Storage bucket named `resumes` (public or with service-role access)

### Install

```bash
npm install
```

### Database

```bash
# Apply schema
npm run db:push

# Seed admin + demo user (no sample data)
npm run db:seed
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed logins (development only)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@switchboard.local` | `admin1234` (or `ADMIN_PASSWORD`) |
| User | `user@switchboard.local` | `user1234` |

Change these before any shared or production environment.

### Other scripts

| Script | Purpose |
|--------|---------|
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

---

## Production deployment

### GitHub

Push to your repository. Vercel connects to GitHub for automatic deploys.

### Vercel

1. Import the repository in Vercel.
2. Set all required environment variables (see above).
3. Build command: `npm run build` (runs `prisma generate` via `postinstall`).
4. Ensure `SESSION_SECRET` is a strong random string.
5. Set `NODE_ENV=production` (Vercel sets this automatically).

### Supabase

1. Create a Postgres database; copy `DATABASE_URL` (pooler) and `DIRECT_URL`.
2. Create a Storage bucket: **`resumes`**
3. Copy `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (server only — never `NEXT_PUBLIC_`).

### Database migrations

For production, prefer `prisma migrate deploy` over `db push` once migration history is established.

### Pre-deploy checklist

- [ ] Rotate `SESSION_SECRET`, `ADMIN_PASSWORD`, and Supabase keys
- [ ] Remove or restrict seed credentials
- [ ] Verify resume bucket permissions
- [ ] Run `npm run build` locally
- [ ] Test auth, Quick Add, resume upload, and dashboard on staging URL

---

## API routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/logout` | Sign out |
| POST | `/api/auth/forgot-password` | Email a password reset link (always `{ ok: true }`) |
| POST | `/api/auth/reset-password` | Consume a reset token and set a new password |
| POST | `/api/auth/change-password` | Change password while signed in |
| POST | `/api/progress` | Quick Add create |
| PATCH/DELETE | `/api/problems/[id]` | Update/delete problem; `action: "revisit"` |
| PATCH/DELETE | `/api/applications/[id]` | Update/delete application |
| GET/POST/DELETE | `/api/applications/[id]/resume` | Resume download/upload/remove |
| PATCH/DELETE | `/api/projects/[id]` | Update/delete project |
| PUT | `/api/goals` | Save user goals |
| GET/POST | `/api/admin/users` | List/create users (admin) |

---

## License

Private — all rights reserved.

<<<<<<< HEAD
# switchboard
=======
# Switchboard

Mobile-first job-switch tracker for SDE 1 preparation.

## What it tracks

- DSA and system design topics, difficulty, confidence, solved count, and targets
- Job applications with role, source, status, notes, and next step
- Interview rounds with schedule, focus area, and outcome
- Weekly goals and quick notes
- Role-based access with one admin and many users
- Public user sign-up for normal candidate accounts

## Tech stack

- Next.js App Router
- React and TypeScript
- SQLite for local zero-setup development
- PostgreSQL-ready Prisma data model for deployment
- Prisma ORM
- Cookie-based JWT sessions
- Minimal black-and-white responsive UI

## Run locally

1. Install dependencies:

```bash
pnpm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Create tables and seed demo users:

```bash
pnpm db:push
pnpm db:seed
```

4. Start the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Seed logins

- Admin: `admin@switchboard.local` / `admin1234`
- User: `user@switchboard.local` / `user1234`

Change these in `.env` before using this beyond local development.
>>>>>>> 9a03478 (first commit for the project basic prj)

# Penny

**Problem:** Personal finance apps feel like homework — too many categories and too little sense of where the month is going.

**Solution:** One-line spending, a plain-English monthly pulse, and a **forecast** for month-end total (including subscriptions) so you can act before the month ends.

## Stack

- Next.js (App Router), TypeScript, Tailwind, shadcn/ui
- Supabase (Postgres, Auth magic link, Row Level Security)
- Resend (email)
- Vercel Cron (`vercel.json`) for weekly digest and monthly wrap-up

## Run locally

1. Copy `.env.example` to `.env.local` and fill in values from the Supabase dashboard (Settings → API) and [Resend](https://resend.com).

2. Apply the SQL from the product spec in the Supabase SQL editor (tables, RLS, `handle_new_user` trigger).

3. Install and dev:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with a magic link at `/login`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

## Cron jobs (production)

Configure `CRON_SECRET` in Vercel and match the `Authorization: Bearer <CRON_SECRET>` check used by `/api/notifications/digest` and `/api/notifications/monthly`. Schedules are defined in `vercel.json`.

## CI

GitHub Actions runs lint, typecheck, and build on push and pull requests.

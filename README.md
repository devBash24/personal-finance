# Personal Finance OS

A monthly-based personal finance tracker with Supabase Auth, Drizzle ORM, and optional AI insights.

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**
- **Supabase** (Auth + Postgres)
- **Drizzle ORM** + **drizzle-kit**
- **Zustand** (state), **SWR** (data fetching/cache), **shadcn-style UI** + **Tailwind v4**, **Recharts**

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
   - `DATABASE_URL` — Supabase Postgres connection string (Connection Pooler)
   - `OPENAI_API_KEY` — (optional) for AI insights

3. **Database**

   - Run migrations: `npm run db:migrate` (requires `DATABASE_URL`).
   - If you already have the initial schema applied, run only the latest migration (e.g. `drizzle/0001_*.sql`) manually in the Supabase SQL Editor if `db:migrate` fails.
   - Optional: run `drizzle/supabase_profile_trigger.sql` in the Supabase SQL Editor to auto-create profiles on signup.

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, then use the dashboard.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` / `npm run start` — production
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — run migrations
- `npm run db:studio` — Drizzle Studio

## Features

- **Auth**: Email/password + magic link (Supabase)
- **Income**: Primary (gross, tax, NIS, other deductions) + additional sources (e.g. side gig); net auto-calculated. Income is copied from the previous month when none exists; you can adjust it.
- **Expenses**: Categories (seeded), add/edit/delete per month
- **Savings**: Accounts, initial balance, monthly contributions
- **Goals**: Savings goals with target amount and optional target date; link one or more savings accounts to track progress.
- **Changes**: Month-over-month comparison (income, expenses, savings, subscriptions) with deltas; last 6 or 12 months.
- **Subscriptions**: Recurring amounts, billing day, active/paused
- **Debts**: Principal, interest, monthly payment
- **Overview**: KPIs, income vs expenses, expense breakdown, trends, savings growth (Recharts)
- **AI Insights**: Optional, rate-limited; requires `OPENAI_API_KEY`

Dashboard data uses **SWR** for caching; switching tabs or adding/editing items avoids full reloads and shows cached data with background revalidation.

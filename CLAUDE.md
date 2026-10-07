# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A private two-user PWA (used mainly on iPhone) for Fairy (manager, `Role.MANAGER`) and Fome (creator, `Role.CREATOR`) to run brand content jobs: brief/timeline, storyline, Details of Work, quotations/invoices/receipts, payslips, timesheets, tax filings, a calendar feed, check-in/out and push notifications. The UI and all user-facing strings are in Thai. The README (in Thai) has the full setup and deploy steps.

Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Prisma 7 on Postgres (`@prisma/adapter-pg`), Supabase Storage, `@react-pdf/renderer`, deployed on Vercel.

## Commands

Node 22+ is required (`.nvmrc`); `prisma dev` won't run on older Node.

```bash
npx prisma dev --detach --name forfairyandfome   # local Postgres, runs in the background
npx prisma db push                               # sync schema into the local DB
npx tsx prisma/seed.ts                           # seed the two users (PINs 1414 / 2828)
npm run dev                                      # http://localhost:3000
npm run lint
npm run build                                    # also the typecheck
```

`npm install` runs `prisma generate` (postinstall). Re-run `npx prisma generate` after editing the schema. The client is generated into `src/generated/prisma` (gitignored) and imported from `@/generated/prisma/client` and `@/generated/prisma/enums`, not `@prisma/client`.

There is no test suite. Verify changes by running the app (`.claude/launch.json` has a `forfairyandfome-dev` config).

## Schema changes

There is no `prisma/migrations` directory. Locally the schema is pushed with `prisma db push`. For production, each schema change also gets a hand-written SQL file in `prisma/manual/` named `YYYY-MM-DD-<topic>.sql`. The commit message then says "Production needs prisma/manual/<file>.sql applied." Write the SQL so existing rows stay valid (defaults and backfills).

## Architecture

- **Routing.** `src/app/(app)/` holds every authenticated page, and its `layout.tsx` calls `requireCurrentUser()`. `src/app/login/` is the PIN pad. `src/app/api/` holds the route handlers: auth, PDF exports, the ICS calendar feed, the iOS widget, cron jobs and dev uploads.
- **Auth has two layers.** `src/proxy.ts` is Next 16's middleware. It only verifies the JWT cookie signature (`src/lib/session.ts`, `jose`) and never touches the DB. Real authorization is in `src/lib/auth.ts` (`requireSession` / `requireCurrentUser`), which every server action and page must call. `/api/calendar/[token]` and `/api/widget/[token]` authenticate with a per-user token in the URL. `/api/cron/*` checks `Bearer ${CRON_SECRET}`. The schedules are in `vercel.json`.
- **Mutations are Server Actions.** They live in `*-actions.ts` / `actions.ts` files next to the routes that use them. They read `FormData`, call `requireCurrentUser()`, write through `prisma` (`src/lib/prisma.ts`), send push via `src/lib/push.ts` (`notifyOtherUsers` / `notifyUsersByRole`, sent in `after()`), then call `revalidatePath` / `redirect`. Validation errors are thrown as Thai-language `Error`s. The Server Action body limit is 20 MB because photos are uploaded through actions.
- **Time zone.** Everything is in Bangkok time. Use the helpers in `src/lib/timezone.ts` (`bangkokDateKey`, `bangkokDayRange`, …), which pass an explicit `timeZone` to Intl. Don't rely on the process TZ: Vercel reserves `TZ`, and `src/instrumentation.ts` only sets it as a best effort.
- **Numbering.** Job numbers are a per-month sequence (`Job.monthlySeq`, `src/lib/job-number.ts`). Document numbers are `PREFIX-YYYYMMDD-NNN`, shared across `Document` (QT/INV/RC), `Payslip` (PS) and `Timesheet` (TS) (`src/lib/doc-number.ts`).
- **Job kind and status.** `JobKind.FREE` jobs have no documents and stop before `PAID`. Use `jobStatusesFor(kind)` in `src/lib/job-kind.ts` rather than `JOB_STATUS_ORDER` directly. Enum-to-Thai-label maps live in `src/lib/*` (`JOB_STATUS_LABEL`, `JOB_KIND_LABEL`, …).
- **Storage.** `src/lib/storage.ts` uses Supabase Storage (bucket `attachments`) when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. Otherwise it writes to local disk under `.data/uploads`, served by `/api/uploads/[...path]` (dev only).
- **PDFs.** `src/lib/pdf/*-document.tsx` are react-pdf components rendered by the `/api/**/pdf` routes. Use the static Sarabun TTFs in `src/lib/fonts`, because variable fonts break react-pdf layout. In PDF templates, always use `SafeText` (`src/lib/pdf/safe-text.tsx`) instead of react-pdf's `<Text>`. Plain `<Text>` can silently drop the last glyph of some Thai strings.
- **PWA.** `src/app/manifest.ts` and `public/sw.js` handle push. `next.config.ts` sets `deploymentId` so that a stale, suspended iOS PWA reloads after a deploy instead of calling Server Action IDs that no longer exist. `scriptable/` holds an iOS Scriptable widget that reads `/api/widget/[token]`.

## Environment

`DATABASE_URL`, `AUTH_SECRET`, `TZ=Asia/Bangkok`, `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (prod), `CRON_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (web push).

## Commit style

The subject is an imperative sentence describing the user-visible change. The body is plain prose explaining the before and after in product terms, using the Thai UI terms where they apply (e.g. งานปกติ / งานฟรี). Call out any `prisma/manual/*.sql` that production needs.

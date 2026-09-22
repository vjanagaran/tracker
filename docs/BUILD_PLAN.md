# Build plan

Work the phases in order. Each has a definition of done — do not move on until
it holds. Read `docs/PROJECT_SPEC.md` first.

**Status (18 Sep 2026):** phases 0–9 are implemented in the repo. Remaining
work is listed at the bottom; do not reopen a phase without a reason.

---

## Phase 0 — Foundation

- [x] Scaffold Next.js 16 + TypeScript + Tailwind 4, `src/` directory, App Router
- [x] Enable React Compiler in `next.config.ts`
- [x] Create the Supabase project; link the CLI (`npx supabase link`)
- [x] Apply the migrations in `supabase/migrations/`
- [x] Generate `src/lib/database.types.ts`
- [x] Build both Supabase clients and the session proxy (`src/proxy.ts`)
- [ ] Deploy an empty shell to Vercel with env vars set

**Done when:** a deployed page reads the signed-in user's name from `profiles`.

---

## Phase 1 — Auth and profile

- [x] Sign-in page (email + password)
- [x] Invite acceptance flow from the emailed link
- [x] Profile page: name, phone, photo
- [x] App shell — sidebar on desktop, bottom tabs on mobile
- [x] Route protection: unauthenticated hits redirect to sign-in

Also shipped: forgot-password and reset-password.

**Done when:** a new user accepts an invite, sets a password, lands in the app,
and the signup trigger has already created their two wheels plus the eight WOL
spokes.

**Verify the guarantee:** sign in as user A, try to read user B's wheel through
the client. It must come back empty. This is the whole product promise — test it
now, not later. Covered by `npm run test:rls`.

---

## Phase 2 — Wheel and scoring

- [x] Radar SVG component: eight or more axes, three overlaid polygons, labels
- [x] Score grid, editable, 0–10
- [x] Cycle picker; **New cycle** calling `create_wheel_cycle`
- [x] Prefilled values visually distinct until touched
- [x] WOB spoke management: add, rename, reorder, disable
- [x] Disable rather than delete — surface the trigger's message if a delete is
      attempted, do not swallow it
- [x] Empty state for a business wheel with no spokes

**Done when:** a member creates a Sep cycle, edits three spokes, reloads, and
sees exactly what they saved. Creating an Oct cycle prefills from Sep.

The radar is the hardest component and the most valuable. Build it first, alone,
against fixed data, before wiring it to the database. `/radar` is that
standalone preview (hardcoded scores, no auth).

---

## Phase 3 — Focus areas and action plans

- [x] Spoke detail page
- [x] Focus area CRUD: issue, one-year goal, five-year goal
- [x] Action plan CRUD with its paired challenge
- [x] Plan status: Active, Completed, Dropped
- [x] Navigate from a spoke on the wheel into its detail

**Done when:** the Health spoke from the founder's own sheet can be entered end
to end — two focus areas, six action plans, each with its challenge.

---

## Phase 4 — Tasks

- [x] Task list, open items sorted by `target_on`
- [x] Create and edit: title, tag, both dates, status
- [x] Link to one or more action plans, searchable across both wheels
- [x] Inline status change with optimistic update
- [x] Notes on a task
- [x] Completed and cancelled behind a disclosure
- [x] Legible when screen-shared: no truncated titles, no horizontal scroll

There is no task delete. That was not in the spec.

**Done when:** status changes persist and `completed_on` is stamped by the
database. Confirm by moving a task to Completed and back and checking the column
clears.

---

## Phase 5 — Boards, meetings, dashboard

- [x] Boards list for the member
- [x] Board page: counts table from `board_velocity`
- [x] Meeting calendar; chairman can add and move meetings
- [x] Window defaults from `meeting_window`
- [x] Superadmin: create boards, manage rosters, invite by email
- [x] Invite server action using the secret key — server-only, zod-validated

Also shipped: meeting agenda field and edit UI; resend invite; add an existing
member to a board. Meeting notes are set at create only. Meeting status
(Completed / Cancelled) has no UI yet.

**Done when:** two members on the same board see identical counts, and neither
can reach the other's task titles through any request.

---

## Phase 6 — Cycles and comparison

- [x] Cycle list, latest first
- [x] Open a past cycle to edit
- [x] Select two cycles and overlay them on one radar
- [x] Movement table: spoke, earlier score, later score, change

**Done when:** an April and a September cycle render together and the shape
difference is readable at a glance. This screen is the argument for the whole
product — give it the polish.

---

## Phase 7 — PWA and mobile

- [x] `manifest.json` with maskable icon entries (name: Holistic Growth Tracker / HGT)
- [ ] Icon PNG files at `public/icons/` (192, 512, maskable, apple-touch)
- [x] `src/sw.ts` via `@serwist/next`, disabled in dev
- [x] Precache the shell; **exclude every authenticated route and Supabase call**
- [x] Offline fallback page
- [x] Install prompt handling
- [x] Layouts at 375px: wheel, grid, task list, dashboard
- [x] Touch targets ≥ 44px; score entry via stepper, not a text field
- [ ] Lighthouse: PWA installable, accessibility ≥ 95

**Done when:** the app installs on an Android phone, opens offline to a sensible
fallback, and every screen works one-handed at 375px.

---

## Phase 8 — Hardening

- [x] RLS test suite: for every table, user A cannot read or write user B's rows
- [x] Confirm superadmin cannot read member content, including via `board_velocity`
- [x] Confirm the spoke delete guard fires
- [x] Confirm a cycle cannot be duplicated within a month
- [x] Rate-limit the invite action
- [x] Error boundaries and empty states on every route
- [ ] Run the RLS suite in CI

`npm test` covers the rate limiter. `npm run test:rls` is the live-project
suite; `npx supabase test db` is the pgTAP companion.

**Done when:** the RLS suite passes and a deliberate attempt to read another
member's data through the client fails on every table.

---

## Phase 9 — Dashboard

- [x] `/dashboard` as the landing screen; every post-auth redirect points at it
- [x] Dashboard first in the sidebar and in the mobile tab bar
- [x] Next meeting card reading the member's own row from `board_velocity`
- [x] Task buckets: due today first, then overdue, then next seven days
- [x] Mini radar per wheel with the latest cycle's period
- [x] Needs a plan — rated 4 or below with no active action plan
- [x] Recent notes
- [x] Day buckets recomputed in the browser, so "today" is the member's day

No migration, no new `SECURITY DEFINER` function, no change to `board_velocity`.
Every card reads the member's own rows under the existing policies.

**Done when:** a member with an overdue task, an unrated business wheel and
three notes sees all of it on one screen, and a member in another timezone sees
their own day rather than the server's.

---

## Phase 10 — Morning note

- [x] `profiles.timezone`, `morning_note_on` (default false), `morning_note_sent_on`
- [x] Profile: opt-in + timezone. Board does not see these
- [x] Compose: toward spokes, due today first, overdue as Later, meeting only if today
- [x] Skip send when the day is empty
- [x] Subject from spokes, never from a count
- [x] Resend + Vercel cron at 07:00 local via an hourly tick
- [x] Fourth secret-key use documented: cron reads the member's own rows

**Done when:** an opted-in member with a task due today in Asia/Kolkata receives
one mail at 07:00 IST that names the spoke, and a quiet day sends nothing.

---

## Remaining

1. Add the PWA icon files the manifest already names.
2. Run Lighthouse (installable + accessibility ≥ 95) and keep the result.
3. Confirm the Vercel (or equivalent) deploy and env vars.
4. Wire `npm run test:rls` into CI once a secret-bearing runner exists.
5. Decide whether `/radar` stays public once the app is in members' hands.

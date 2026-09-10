# Personal Board — project specification

Working name: **PB**. A peer-accountability platform for entrepreneur boards that
run the Wheel of Life / Wheel of Business practice on a fortnightly review cycle.

This document is the single source of truth for the build. Read it fully before
writing code. `docs/BUILD_PLAN.md` has the phased task list.

---

## 1. The practice this software serves

A **board** is a small group of entrepreneurs — typically six to nine — who meet
every alternate Thursday on a video call. Each member keeps two wheels:

- **Wheel of Life (WOL)** — eight fixed areas of life, self-rated out of ten.
- **Wheel of Business (WOB)** — the functions of *their own* business, spokes
  they define themselves.

A wheel only rolls if the spokes are equal. Balance across areas is the goal, so
the ratings are not measurements to be validated — they are the member's own
honest read, used to point the planning somewhere.

Each spoke breaks into **focus areas** (the issue as it stands today, plus where
it should be in one year and in five). Each focus area holds **action plans**,
and every action plan is paired with the **challenge** standing in its way.

Between meetings, members work a **task list**. A task may be tagged WOL, WOB or
Open, and may point at one or more action plans — both optional. Open means
situational work that belongs to no plan, and it is counted honestly rather than
hidden.

At the meeting, each member shares their own screen and walks their list. The
board sees two numbers per member: finished since the last meeting, and open now.

### Non-negotiables

1. **All ratings are self-rated.** Nothing is derived, averaged or rolled up. The
   WOB wheel never computes the Business spoke on the WOL wheel.
2. **Wheels, plans and tasks belong to the person, not the board.** A member on
   two boards has one WOL, one WOB and one task list. Moving between boards
   carries the full history.
3. **Everything below `wheels` is private.** No member, chairman or superadmin
   can read another person's wheels, scores, plans or tasks. Sharing happens by
   screen share, in the moment, under the member's control.
4. **Boards are independent tenants.** Any number of them, no data crossing.

---

## 2. Roles

| Role | Can do | Cannot do |
|---|---|---|
| Superadmin | Create boards, manage rosters, invite members | Read any member's wheels, plans or tasks — including counts |
| Chairman | Everything a director can, plus manage that board's meeting calendar | Read any other member's content |
| Director | Own wheels, plans, tasks. See the board roster, calendar, and the counts dashboard | Read or edit anyone else's content |

Nobody can edit another member's record. There is no administrative override.

---

## 3. Data model

Migrations are in `supabase/migrations/`. Read them before touching the schema.

```
profiles          one per auth user; the only shared personal data
boards            tenant. name, cadence_days, meeting_weekday
board_members     roster. role, status, joined_on, left_on
meetings          calendar per board

wheels            (user_id, type WOL|WOB) — one of each per person
spokes            name, sort_order, is_predefined, is_active
wheel_cycles      one per wheel per month-year; period is the 1st of the month
spoke_scores      (cycle_id, spoke_id) score_now, target_1y, target_5y — nullable

focus_areas       current_issue, goal_1y, goal_5y
action_plans      description + challenge (one pair), status

tasks             title, tag, status, planned_start_on, target_on, completed_on
task_action_plans many-to-many, optional
task_notes        append-only
```

### Rules the database enforces, not the UI

- `wheel_cycles.period` must be the first of a month; one cycle per wheel per month.
- A spoke with any focus area or past score **cannot be deleted** — a trigger
  raises. Set `is_active = false` instead, so old cycles keep rendering.
- `tasks.completed_on` is stamped by a trigger on status change and cleared when
  status moves away from Completed. Never write it from the client.
- Row-level security keys everything below `wheels` to `user_id = auth.uid()`.

### The one deliberate RLS bypass

`board_velocity(board_id, from, to)` is `SECURITY DEFINER`. It checks the caller
is an active member of the board, then returns **only** user id, name, completed
count and open count. No titles, tags, dates or links ever leave it. Superadmin
gets no exemption. Any change to this function needs careful review.

### Fixed WOL spokes

Seeded from `wol_spoke_templates`, identical system-wide:
Health · Family · Business · Personal Finance · Personal Growth · Fun & Hobby ·
Spiritual pursuits · Giving back

Changing this list is a central act, which is what keeps the life wheel portable
between boards. Members cannot add WOL spokes; anything custom goes on WOB.

### Starting a rating cycle

`create_wheel_cycle(wheel_id, period)` creates the month's cycle and prefills
every active spoke from the most recent earlier cycle, so the member edits only
what moved. Spokes added since the last cycle come through blank.

**UI requirement:** prefilled values must be visually distinct until touched.
Prefill carries the 1-year and 5-year targets forward too, and nobody should
sign off on a target they never reconsidered.

---

## 4. Stack

Versions verified against npm on 10 Sep 2026. Install with `@latest` and let the
lockfile record the real numbers.

| Package | Verified | Role |
|---|---|---|
| `next` | 16.3.4 | App Router, server actions, Turbopack |
| `react` / `react-dom` | 19.2.8 | — |
| `tailwindcss` | 4.3.3 | CSS-first config, no `tailwind.config.js` |
| `@supabase/supabase-js` | 2.85.x | — |
| `@supabase/ssr` | 0.12.5 | Cookie-based sessions |
| `@tanstack/react-query` | latest | Server state |
| `react-hook-form` + `zod` | latest | Forms and validation |
| `@serwist/next` + `serwist` | latest | PWA service worker |
| `date-fns` | latest | Dates |
| `shadcn/ui` | latest | Components (Radix under the hood) |

```bash
npx create-next-app@latest pb-app --typescript --app --tailwind --eslint --src-dir
cd pb-app
npm i @supabase/supabase-js@latest @supabase/ssr@latest \
      @tanstack/react-query@latest react-hook-form@latest zod@latest \
      @hookform/resolvers@latest date-fns@latest
npm i -D @serwist/next@latest serwist@latest supabase@latest
npx shadcn@latest init
```

**No chart library.** The wheel is eight points on a radar — hand-rolled SVG.
A charting dependency costs more than it gives here, and the wheel needs exact
control over the three overlaid polygons.

**No global state library.** TanStack Query for server state, React state for
the rest. Nothing in this app needs Zustand or Redux.

Enable the React Compiler in `next.config.ts` (`reactCompiler: true`) — stable
as of Next 16 — and install `babel-plugin-react-compiler` as a dev dependency.

### Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=              # server only. NEVER expose to the client
```

The secret key is used by exactly one thing: `inviteUserByEmail` in the invite
server action. If it appears anywhere reachable from a client component, that is
a bug.

---

## 5. Routes

```
app/
  (auth)/
    sign-in/page.tsx
    invite/accept/page.tsx
  (app)/
    layout.tsx                  shell: sidebar on desktop, bottom tabs on mobile
    wheel/
      [type]/page.tsx           type = life | business — wheel + score table
      [type]/cycles/page.tsx    cycle list, new cycle, compare two
    spoke/[spokeId]/page.tsx    focus areas + action plans + challenges
    tasks/page.tsx              the to-do list
    boards/page.tsx             boards this member belongs to
    boards/[boardId]/page.tsx   counts dashboard + meeting calendar
  (admin)/
    admin/boards/page.tsx       superadmin: boards and rosters
  api/                          only if something genuinely needs a route handler
```

Server components read data by default. Mutations go through server actions.
TanStack Query is for client-side interactive views — chiefly the task list and
the score grid, where optimistic updates matter.

---

## 6. Screens

The wireframe at `docs/wireframe.html` shows all of these. Open it before
building any screen; it is the agreed design, and the copy in it is the agreed
copy.

### Wheel (`/wheel/life`, `/wheel/business`)
Radar SVG on the left, score grid on the right. Three polygons: today (filled,
solid), one year (solid line), five years (dashed). Below: the cycle this
belongs to, with a picker, plus **New cycle** and **Compare**.

On mobile the radar sits above the grid, full width, and the grid becomes a
stack of rows rather than a table.

Business wheel with no spokes shows an empty state that invites naming the
functions the member runs — not an error, an invitation.

### Spoke detail (`/spoke/[spokeId]`)
Focus areas as cards. Each card: the issue, the one-year and five-year goals,
then action plans as rows with their paired challenge. Inline add for both.

### Tasks (`/tasks`)
Open items sorted by `target_on` ascending. Columns: title, tag, what it works
toward, target date, status. Status is an inline control — changing it saves
immediately and optimistically. Completed and cancelled items live behind a
disclosure.

This screen is shared on a call, so it must be legible at a distance: generous
row height, no truncation of task titles, no horizontal scroll on a laptop.

### Board (`/boards/[boardId]`)
The counts table from `board_velocity`, plus the meeting calendar. Window
defaults to the last meeting → the next one, via `meeting_window`.

### Cycles (`/wheel/[type]/cycles`)
List of cycles, latest first. Select any two to overlay. Open a past cycle to
edit it.

---

## 7. PWA and mobile

Installable, offline-tolerant, mobile-first. Members will update tasks on a
phone between meetings and share a laptop screen during them.

- `public/manifest.json` — name, short_name, icons at 192/512 (maskable
  included), `display: standalone`, theme colour matching the shell.
- `src/sw.ts` with `@serwist/next`, disabled in development.
- **Cache the app shell and static assets only.** Never cache authenticated
  Supabase responses or any route under `(app)`. A stale wheel or a stale task
  list is worse than a spinner, and a cached response served to the wrong
  session is a privacy breach.
- Offline fallback page that states plainly what is unavailable and what still
  works.
- Touch targets 44px minimum. Bottom tab bar on mobile: Life · Business · Tasks
  · Board. Sidebar on desktop.
- Score entry on mobile uses a stepper or a select, never a free-text number
  field — it is a 0–10 value and the keyboard is the wrong tool.

---

## 8. Conventions

- TypeScript strict. No `any`. Database types generated:
  `npx supabase gen types typescript --local > src/lib/database.types.ts`
- Two Supabase clients: `src/lib/supabase/client.ts` (browser) and
  `src/lib/supabase/server.ts` (server, async, reads `cookies()`).
  Middleware refreshes the session — follow the current `@supabase/ssr` guide
  exactly, including the `getAll` / `setAll` cookie shape.
- Server actions live beside the feature, named `actions.ts`, and always
  re-validate input with zod. Never trust a client-supplied `user_id`; take it
  from the session.
- Components under `src/components/`, feature code under `src/features/<name>/`.
- Dates: store `date` for `period`, `planned_start_on`, `target_on`;
  `timestamptz` for everything else. Render in the member's local zone.
- Copy is sentence case, plain verbs, no exclamation marks. An empty screen
  invites an action; an error says what happened and what to do.

---

## 9. Things that are deliberately absent

Do not add these without asking. Each was considered and rejected.

- Cross-member visibility of anything beyond profile, calendar and counts.
- Any derived or averaged score.
- Notifications, reminders or nudges about neglected spokes.
- Anchors or definitions for what a score of 3 means — it is personal reference.
- Assigning tasks to other people.
- A completion-percentage metric. The outcome is a rounder wheel, not a score.

---

## 10. Open items

- Confirm the exact WOB spoke list per founding member during onboarding.
- Icon set and app name for the manifest.
- Whether the chairman keeps meeting-calendar write access — the RLS policy is
  written with it and commented so it can be removed in one line.

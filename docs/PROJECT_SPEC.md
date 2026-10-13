# Holistic Growth Tracker — project specification

Working name: **HGT**. A peer-accountability platform for entrepreneur boards that
run the Wheel of Life / Wheel of Business practice on a fortnightly review cycle.

This document is the single source of truth for the product. Read it fully
before writing code. `docs/BUILD_PLAN.md` has the phased task list and current
build status.

`docs/wireframe.html` drew the original screens: wheel, spoke, task list,
board, meetings, cycles and admin. The Dashboard, the Tasks workspace, Notes,
the wheel Table view and the wheel PDF were built after it. This document
specifies them, and where the two disagree, this document wins.

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
2. **Wheels, plans, tasks and notes belong to the person, not the board.** A member on
   two boards has one WOL, one WOB, one task list and one notes store. Moving
   between boards carries the full history.
3. **Everything below `wheels`, plus notes, is private.** No member, chairman or
   superadmin can read another person's wheels, scores, plans, tasks or notes.
   Sharing happens by screen share, in the moment, or by a PDF the member
   downloads from their own wheel and sends themselves. Either way it is the
   member's act, never the app's.
4. **Boards are independent tenants.** Any number of them, no data crossing.

---

## 2. Roles

| Role | Can do | Cannot do |
|---|---|---|
| Superadmin | Create boards, manage rosters, invite members | Read any member's wheels, plans or tasks — including counts |
| Chairman | Everything a director can, plus manage that board's meeting calendar | Read any other member's content |
| Director | Own wheels, plans, tasks. Invite a friend to the platform (no board). See the board roster, calendar, and the counts dashboard | Read or edit anyone else's content |

A board has **one or more chairmen**, and each has exactly the same access. This
is how a vice-chairman is handled: they are a second chairman, not a separate
role, so there is no third tier to define or defend. The roster marks every
chairman with the same icon. The app refuses a roster change that would leave
a board with no active chairman, and says so ("This board needs a chairman.
Give the role to someone else first.").

Nobody can edit another member's record. There is no administrative override.

---

## 3. Data model

Migrations are in `supabase/migrations/`. Read them before touching the schema.

```
profiles          one per auth user; the only shared personal data
                  name, photo, phone, email, role, company, city, about, links
                  timezone, morning_note_on, morning_note_sent_on are private
                  settings — never shown on /people
boards            tenant. name, cadence_days, meeting_weekday
board_members     roster. role, status, joined_on, left_on. Any number of active
                  chairmen per board (see section 2)
meetings          calendar per board; agenda (planned topics) and notes

wheels            (user_id, type WOL|WOB) — one of each per person
spokes            name, sort_order, is_predefined, is_active
wheel_cycles      one per wheel per month-year; period is the 1st of the month
spoke_scores      (cycle_id, spoke_id) score_now, target_1y, target_5y — nullable

focus_areas       current_issue, goal_1y, goal_5y
action_plans      description + challenge (one pair), status

tasks             title, description, tag, status, priority (high | medium |
                  low | flexi, default flexi), planned_start_on +
                  planned_start_time, target_on + target_time (times optional,
                  and only with their day), completed_on, repeat_every,
                  repeat_until, series_id
task_action_plans many-to-many, optional
task_notes        append-only, specific to that task

notes             personal documents; title, rich body, optional category_id.
                  No task/board/spoke link
note_categories   per-person tree for notes: name, optional description (up to
                  500 characters), parent_id, sort_order
note_comments     append-only, specific to that note (labelled Comments in the
                  UI so they are not confused with task notes)
note_files        inline images and attached files for a note
```

Avatars live in a public `avatars` storage bucket, not in a table. Profile
`photo_url` points at the object. Member photos may appear on the board
velocity table because `profiles` is shared board data; they never come from
`board_velocity`.

Note images and attachments live in a **private** `notes` bucket. Paths are
`{user_id}/{note_id}/{file_id}`. Only the owner can read them.

### Rules the database enforces, not the UI

- `wheel_cycles.period` must be the first of a month; one cycle per wheel per month.
- A spoke with any focus area or past score **cannot be deleted** — a trigger
  raises. Set `is_active = false` instead, so old cycles keep rendering.
- `tasks.completed_on` is stamped by a trigger on status change and cleared when
  status moves away from Completed. Never write it from the client.
- A time of day needs its date: `planned_start_time` only with
  `planned_start_on`, `target_time` only with `target_on`. The next occurrence
  of a repeating task keeps description, priority and both times.
- Priority is a flag the member sets on their own task. It breaks ties in the
  order tasks come due and is never counted, averaged or compared across people.
- A repeating task must have `target_on`. Completing it inserts the next
  occurrence of the same series — one at a time, so the open count stays honest.
  Never write `series_id` from the client; a trigger stamps it.
- A note category cannot sit inside itself or one of its own subcategories —
  a trigger raises. Names are unique among siblings, ignoring case. A note can
  only point at a category its owner owns. Deleting a category leaves its notes
  uncategorised; the app refuses to delete one that still has subcategories.
- Row-level security keys wheels, plans, tasks, notes, note categories and note
  comments to `user_id = auth.uid()`, directly or through the note.

### The one deliberate RLS bypass

`board_velocity(board_id, from, to)` is `SECURITY DEFINER`. It checks the caller
is an active member of the board, then returns **only** user id, name, completed
count and open count. No titles, tags, dates or links ever leave it. Superadmin
gets no exemption. Any change to this function needs careful review.

### Fixed WOL spokes

Seeded from `wol_spoke_templates`, identical system-wide:
Health · Family · Business · Personal Finance · Personal Growth · Fun & Hobby ·
Giving back · Spiritual pursuits

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

The app is already scaffolded. Versions below are what `package.json` records;
the lockfile is authoritative. See `README.md` for setup.

| Package | Installed | Role |
|---|---|---|
| `next` | 16.3.4 | App Router, server actions. Dev runs on Turbopack; `npm run build` passes `--webpack` because the service-worker plugin builds with webpack |
| `react` / `react-dom` | 19.2.8 | — |
| `tailwindcss` | 4.x | CSS-first config, no `tailwind.config.js` |
| `@supabase/supabase-js` | 2.116.x | — |
| `@supabase/ssr` | 0.12.7 | Cookie-based sessions |
| `@tanstack/react-query` | 5.x | Server state |
| `react-hook-form` + `zod` | 7.x / 4.x | Forms and validation |
| `@serwist/next` + `serwist` | 9.x | PWA service worker |
| `date-fns` | 4.x | Dates |
| `shadcn/ui` + `@base-ui/react` + `lucide-react` + `sonner` | 4.x / 1.x / 1.x / 2.x | Components, icons, toasts |
| `@tiptap/*` | 3.x | Rich text in Notes |
| `resend` | 6.x | Morning note mail |
| `jspdf` + `html2canvas` | 4.x / 1.x | Wheel PDF, built in the browser |

**No chart library.** The wheel is eight points on a radar — hand-rolled SVG.
A charting dependency costs more than it gives here, and the wheel needs exact
control over the three overlaid polygons. The PDF reuses that same radar
component; it does not bring a second renderer.

**No global state library.** TanStack Query for server state, React state for
the rest. Nothing in this app needs Zustand or Redux.

React Compiler is on in `next.config.ts` (`reactCompiler: true`).

### Environment

Copy `.env.example` to `.env`. Next also reads `.env.local` if present.

```
NEXT_PUBLIC_APP_URL=              # public origin; invite and reset emails
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=              # server only. NEVER expose to the client
RESEND_API_KEY=                   # morning note only
MORNING_NOTE_FROM=                # e.g. Holistic Growth Tracker <notes@domain>
CRON_SECRET=                      # Bearer token the hourly caller must send
```

`SUPABASE_SECRET_KEY` stays on the server. Current uses:

- `inviteUserByEmail` in the invite and resend-invite actions, and in the
  invite-a-friend action (same call, no board attached)
- `auth.admin.getUserById` in the admin roster loader (email and whether
  the invite was accepted)
- `scripts/rls-suite.ts` for test fixtures
- morning-note cron: list opted-in members and read each one's own tasks
  and meetings, then send them their own digest

If it appears anywhere reachable from a client component, that is a bug. Do not
add another use without asking. The PDF touches no secret and no server: it is
drawn in the browser from rows the member already loaded.

---

## 5. Routes

```
app/
  page.tsx                      signed in → /dashboard; otherwise the sign-in redirect
  (auth)/
    sign-in/page.tsx
    invite/accept/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
  (app)/
    layout.tsx                  shell: sidebar on desktop, bottom tabs on mobile
    dashboard/page.tsx          the landing screen; what is due and what is unrated
    profile/page.tsx            edit own profile; morning-note opt-in; invite a friend
    people/[userId]/page.tsx    co-member profile, read-only
    wheel/
      [type]/page.tsx           type = life | business — Chart (radar + score grid),
                                Table (the whole sheet), Download PDF
      [type]/cycles/page.tsx    cycle list, new cycle, compare two
    spoke/[spokeId]/page.tsx    focus areas + action plans + challenges
    tasks/page.tsx              the to-do list
    notes/layout.tsx            category tree in the middle panel; keeps its open/closed state
    notes/page.tsx              notes of the chosen category, in the right panel
    notes/[noteId]/page.tsx     one note: rich text, files, comments
    boards/page.tsx             boards this member belongs to
    boards/[boardId]/page.tsx   counts dashboard + meeting calendar
  (admin)/
    admin/boards/page.tsx       superadmin: boards
    admin/boards/[boardId]/page.tsx  roster, invite, add existing member
  auth/confirm/route.ts         invite and recovery OTP
  auth/callback/route.ts        PKCE code exchange
  offline/page.tsx              PWA fallback
  radar/page.tsx                hardcoded radar preview; no auth
  api/morning-note/route.ts     hourly tick; Bearer CRON_SECRET; no session
```

There is otherwise no `app/api/` tree. Server components read data by default.
Mutations go through server actions. TanStack Query is for client-side
interactive views — chiefly the task list and the score grid, where optimistic
updates matter. `/radar` is a development preview with wireframe scores, not a
member screen. The morning-note route is the one exception: a scheduler cannot
call a server action.

---

## 6. Screens

The wireframe at `docs/wireframe.html` shows the original screens. Open it
before building any screen it covers; it is the agreed design, and the copy in
it is the agreed copy. Screens it does not cover are specified below.

### Dashboard (`/dashboard`)
Where a signed-in member lands. A launcher and a state of play, never a
scorecard: no wheel average, no completion percentage, nobody else's content.
No page header — the cards name themselves, and the screen should open on
content rather than on a title explaining it.

Five cards. Next meeting, with the member's own two counts read from
`board_velocity` so the dashboard cannot disagree with the board. Hidden when
the member sits on no board — a personal day should not open on the absence of
a group. Tasks, bucketed due today first, then overdue, then the next seven
days. Wheels, one mini radar each with the latest cycle's period. Recent notes.
And **needs a plan** — a spoke the member scored 4 or below in their latest
cycle with no action plan still Active.

That last card is close to the nudges rejected in section 9, and the line is
this: it is a static filter over the member's own ratings, shown only when they
open the screen. It never chases them, never mentions time elapsed, and never
implies a target.

Which day is "today" belongs to the member's clock, not the server's. The task
buckets are computed twice — once on the server for the first paint, once in the
browser through `todayStore` — so a member in any zone sees their own day.

### Wheel (`/wheel/life`, `/wheel/business`)
The header carries the Life / Business switch, a cycle picker, a month input
with **New cycle**, **Compare**, **Download PDF**, and on the business wheel a
settings button that opens spoke management. Two tabs sit under it, Chart (the
default) and Table.

**Chart.** Radar SVG on the left, score grid on the right. Three polygons: today
(filled, solid), one year (solid line), five years (dashed). **Save this
rating** sits under the grid. On mobile the radar sits above the grid, full
width, and the grid becomes a stack of rows rather than a table.

**Table.** The whole sheet in one place, one row per action plan: number, area
(a link to its spoke), Now, 1 year, 5 years, current state, 1-year goal, 5-year
goal, action plan, challenge, and **Tasks**. A spoke with no focus area still
shows its scores; a focus area with no plan shows its goals. On mobile it
becomes a stack per spoke. It is read-only: ratings are edited in Chart, plans
on the spoke page.

The Tasks column reads `done/total`, for example `3/5`: tasks working toward
that plan that are Completed, over those that are not Cancelled. `—` when none.
It is two plain counts. It is never shown as a percentage, never summed to a
spoke or a wheel, and never compared across people. See section 10.

**Download PDF.** One landscape A4 file of the cycle on screen, built in the
browser from the rows the member already loaded, including any rating typed
but not yet saved. Nothing is sent to a server
and nothing is stored. The table comes first, sliced across pages if it is long,
then the radar with its three-column score list on a page of its own. Every page
has a title (`<Name>'s Wheel of Life`), a subtitle (`Sep 2026 | Dt: 22 Sep 2026`)
and a footer with the product name and `page / total`. The file is named
`wheel-of-life-2026-09.pdf`, or `-draft` with no cycle. The button is disabled
for an empty business wheel. This is the supported way to share a wheel outside
a screen share: the member decides what to send, and when. Tasks and notes have
no PDF.

Business wheel with no spokes shows an empty state that invites naming the
functions the member runs — not an error, an invitation.

### Spoke detail (`/spoke/[spokeId]`)
Focus areas as cards. Each card: the issue, the one-year and five-year goals,
then action plans as rows with their paired challenge. Inline add for both.

### Tasks (`/tasks`)
Open items sorted by `target_on` ascending. Columns: title, tag, what it works
toward, target date, status. Repeat (daily, weekly, fortnightly, monthly) is
optional; a repeating task needs a finish-by date. Completing it creates the
next occurrence. Status is an inline control — changing it saves immediately
and optimistically.

Two panels, like Notes. The left one picks what the list shows, and the two
kinds of choice combine:

- **Views:** All, Overdue, Today, Tomorrow, Next 7 days, This month. All of them
  read the finish-by date and list open tasks only; a task with no date appears
  only under All. Today is the member's own calendar day (profile time zone if
  set, else the browser's). Next 7 days is today through six days on. This month
  is the whole calendar month, so it includes dates already past.
- **Wheels, spokes and focus areas:** Wheel of Life and Wheel of Business, each
  expanding to its spokes and their focus areas. A task sits under a focus
  area through the plans it works toward; one task can sit under several, and a
  spoke or wheel counts it once. A task with no plan but tagged Life or
  Business sits under that wheel's **No focus area** row. An untagged task with
  no plan is on no row. Inactive spokes show only while they have tasks.
- **Completed** and **Cancelled** replace the old disclosure. They combine with a
  tree row, not with a date view.

Each row carries a plain count of tasks. Counts follow the other choices, so
with Health chosen the date rows count Health tasks, and with Today chosen the
tree counts what is due today. They are counts, never percentages. Choosing the
chosen tree row again, or Clear focus, drops it. On mobile the list is the
screen; one button opens the views and tree.

**Rows.** A round checkbox completes a task (and reopens a completed one, back to
Not Started). Completing shows a toast with Undo, except for a repeating task:
undoing it would leave two open occurrences, so it has no Undo. Status is a
compact chip with a menu. Dates read in words: Today, Tomorrow, `3 days overdue`,
`Fri 16 Oct`. The optional planned start is a quiet fragment beside the chips
(`Starts tomorrow`, `Starts Fri 16 Oct`, `Started 12 Oct`); it is absent when no
start is set and on closed tasks, so it never takes a column. Overdue is also amber, but the words carry it. With the All view
chosen the open list is grouped Overdue, Today, Tomorrow, Upcoming, No date; a
date view lists flat.

**Wheel chips.** Each task shows one chip per spoke it works toward, labelled
`Life · Health` or `Business · Sales`: green for Life, navy for Business, both
from the existing palette. A task with no plan shows its tag (`Life`,
`Business`) and an untagged open item shows `Open item`, in neutral. The label
carries the meaning; colour only echoes it. Chips are position, never a score.

**Layouts.** List, Board, Week and Calendar, switched from the top right of the
header on every layout, on the open view only.
- Board: a column per open status. Drag a card to change status.
- Week: Monday to Sunday with previous, next and this week; Overdue sits above
  the current week and tasks with no date below it. Drag a task onto a day to
  set its finish-by date.
- Calendar: a month, Monday first, with previous, next and this month. Each day
  names up to three tasks, coloured by wheel, and says `+n more`; choosing a day
  lists its tasks underneath. Drag a task onto a day to set its finish-by date.
  Overdue tasks from before the month and tasks with no date sit below the grid.
  On a phone each day shows a count instead of titles.
- Week and Calendar are date views themselves, so choosing a date row returns to
  List.
- Dragging needs a mouse. The status chip and the edit form do the same on
  keyboard and touch.

**Links.** The view lives in the address: `view` (`completed`, `cancelled`),
`when`, `node` (`wheel:WOL`, `spoke:<id>`, `focus:<id>`, `unlinked:WOB`), `layout`
(`board`, `week`) and `present=1`. Unknown values fall back to the default. The
spoke page links to `/tasks?node=spoke:<id>` with a count of that spoke's open
tasks, and each focus area links to its own. These are the member's own tasks and
counts. The plan picker in the task form browses Wheel, Spoke, Focus area, Plan,
and also searches.

**Meeting mode.** One button enlarges rows and type, hides the left panel and
the detail pane, and widens the list. `Exit meeting mode` returns. It is a
display setting; it shares nothing and sends nothing.

**Detail.** From 1280px wide, opening or adding a task shows its form and notes
in a third column beside the list; below that it slides over as a sheet. The form
keeps an explicit Save: a task needs a title, and a repeating one a finish-by
date, so autosave would store half-finished tasks. The form is grouped as
title and status, Dates (with Today, Tomorrow and In a week shortcuts), Tag, and
Working toward, where plans are found by search or by browsing Wheel, Spoke,
Focus area. Save stays pinned at the bottom while the form scrolls.

**Description, times and priority.** A task has an optional description (plain
text, up to 4,000 characters). Planning to start and Finish by each take an
optional time beside the day; the time input stays off until there is a day, and
clearing the day clears the time. A time is shown on the row after the day
(`Today · 5:30 pm`) and is left off an overdue day, where the words already say
enough. It does not make a task overdue sooner, and nothing reminds the member
of it: reminders are notifications, which this product does not have. Finish by
also offers Today, Tomorrow, This weekend and Next week.

Priority is **High**, **Medium**, **Low** or **Flexi**, each with a flag and a
colour (red, amber, blue, grey) and always its name beside it. Flexi is the
default and means no pressure on when; it shows nothing on a row, so only a
chosen priority adds to it. Tasks come due by day, then time (an untimed task
leads its day), then priority, then title. A flexi task due earlier still comes
before a high one due later. A small marker on the row shows that a description
exists.

**Delete.** Below the notes, after a separator, a red **Delete task** button
asks for confirmation and removes that one task with its notes and plan links.
Deleting an open repeating task ends the repeat, since occurrences are created
when one is completed; the dialog says so and points to completing it instead.
Cancelled is the way to keep an item on record.

Delete exists because duplicates happen in real use: the same task ends up
entered twice. A duplicate is noise, not a record, so the member can remove it
outright. It is not how a task that stopped mattering is closed; that is
Cancelled.

This screen is shared on a call, so it must be legible at a distance: generous
row height, no truncation of task titles, no horizontal scroll on a laptop.

### Notes (`/notes`, `/notes/[noteId]`)
Private document store. Unlinked from tasks, spokes and boards. Rich text,
inline images, and file attachments. Empty copy: **Personal documents stay
here.** Task notes stay on the task.

Three panels. The middle one is the category tree: **All notes** and **No
category** first, then the person's own categories, siblings in the order they
set (move up, move down), each with expand and collapse and a count that
includes its subcategories. A category menu adds a subcategory, edits (rename,
describe or move inside another category), reorders and deletes. A category may
carry a short optional description: it shows under the category's name above its
notes, and as a hover hint on its row in the tree. Drag a note from the list onto
a category, or onto No category, to move it; a toast confirms and offers Undo.
Only the category changes. Dragging needs a mouse: the category picker on the
note itself does the same by keyboard and on a phone. Choosing a category
lists its notes, with those of its subcategories, in the right panel; choosing
a note opens it there. A note has at most one category, picked from the
categories already made; it is optional.

A note carries **Comments**: short dated entries added under the note, never
edited or removed, labelled Comments here and Notes on tasks.

On mobile the tree is the screen; open a category for its notes, then a note
for the editor, with a back link at each step. Desktop sidebar
places Notes next to Tasks. Mobile tabs: Dashboard · Tasks · Notes · Wheel · Board.
Wheel is Life and Business with an in-page switch.

### Board (`/boards/[boardId]`)
The counts table from `board_velocity`, plus the meeting calendar. Window
defaults to the last meeting → the next one, via `meeting_window`. Any chairman
of the board adds and moves meetings and edits the agenda; directors read them.

Each row names the member with photo, a link to their profile, a chairman mark
where it applies, and their email and phone as links. All of that is profile
data, which co-members already share; none of it comes from `board_velocity`.
The two numbers are headed **Finished this fortnight** and **Open now**.

### Profile (`/profile`, `/people/[userId]`)
Edit your own: name, photo, role, company, city, about, links, phone.
Morning note opt-in and timezone live here too — they are not on the
co-member view. Invite a friend lives here as well: email only, no board.
Sign out lives on the edit page.

### Morning note (opt-in mail)
A dashboard in the inbox, not a Todoist chase. Off until the member turns it
on. Sent at 07:00 in their timezone when something is due today, overdue, or
the board meets today. Quiet otherwise.

Subject names the spokes (or Life / Business) of today's work — never a count.
Body: Toward {spokes}, Today (max 4, labeled by tag / spoke / repeat), Later
for overdue, meeting only if it is today, one button to the dashboard. No
scores, no “needs a plan”, no “you haven’t rated.”

`/api/morning-note` expects a tick every hour, with the `CRON_SECRET` Bearer
token. **Nothing calls it yet.** `vercel.json` has no cron, because Vercel Hobby
allows only a daily one and a 07:00 send in every member's zone needs hourly
(Pro, or an outside scheduler). Until one is set up, no morning note goes out.
`morning_note_sent_on` is the member's local date so a double tick in the same
hour does not mail twice.

### Cycles (`/wheel/[type]/cycles`)
List of cycles, latest first. Select any two to overlay. Open a past cycle to
edit it.

---

## 7. PWA and mobile

Installable, offline-tolerant, mobile-first. Members will update tasks on a
phone between meetings and share a laptop screen during them.

- `public/manifest.json` — name **Holistic Growth Tracker**, short_name **HGT**, icons at
  192/512 (maskable included), `display: standalone`, theme colour matching the
  shell. The icon files are in `public/icons/`, with `apple-touch-icon.png`
  alongside.
- `src/sw.ts` with `@serwist/next`, disabled in development.
- **Cache the app shell and static assets only.** Never cache authenticated
  Supabase responses or any route under `(app)`. A stale wheel or a stale task
  list is worse than a spinner, and a cached response served to the wrong
  session is a privacy breach.
- Offline fallback page that states plainly what is unavailable and what still
  works.
- Touch targets 44px minimum. Bottom tab bar on mobile: Dashboard · Tasks · Notes ·
  Wheel · Board. Sidebar on desktop: Dashboard, Tasks, Notes, Life, Business, Board.
- The desktop sidebar is pinned to the viewport. Its top is the member's photo
  and name, which link to Profile. Under Board it lists the member's boards,
  and a superadmin also sees **Boards admin** below a separator. It collapses to
  an icon rail with the button or the `M` key (ignored while typing); the choice
  is remembered in the browser.
- Score entry uses a stepper, never a free-text number field — it is a 0–10
  value and the keyboard is the wrong tool.

---

## 8. Conventions

- TypeScript strict. No `any`. Database types generated from the linked
  project (`--linked`) or a local stack (`--local`):
  `npx supabase gen types typescript --linked > src/lib/database.types.ts`
- Two Supabase clients: `src/lib/supabase/client.ts` (browser) and
  `src/lib/supabase/server.ts` (server, async, reads `cookies()`).
  `src/proxy.ts` refreshes the session (Next 16; there is no `middleware.ts`).
  Follow the current `@supabase/ssr` guide exactly, including the `getAll` /
  `setAll` cookie shape.
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

- Cross-member visibility of anything beyond profile, calendar and counts. That
  includes share links and any in-app way to open another member's content. To
  share a wheel, a member sends the PDF; to share the rest, they share a screen.
- Any derived or averaged score.
- Notifications, reminders or nudges about neglected spokes. The opt-in
  morning note is the one exception, and it still must not mention an
  unrated or low spoke.
- Anchors or definitions for what a score of 3 means — it is personal reference.
- Assigning tasks to other people.
- A completion-percentage metric. The outcome is a rounder wheel, not a score.

---

## 10. Open items

- Confirm the exact WOB spoke list per founding member during onboarding.
- Whether `/radar` stays a public preview once members are on the app.
- Who calls `/api/morning-note` every hour (Vercel Pro cron or an outside
  scheduler). Until then the morning note is built but never sent.
- The `done/total` tally per action plan in the wheel Table and PDF. It is two
  counts, not a percentage, but it sits close to the completion metric rejected
  in section 9. Keep it, or show only the open count the way the Tasks screen does.
- Whether a PDF of Tasks or Notes is ever wanted. Today only the wheel has one.

Chairman calendar write access is decided: every chairman of a board keeps it,
and a vice-chairman is simply a second chairman. The RLS policy is still
commented so it can be removed in one line if that changes.

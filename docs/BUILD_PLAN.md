# Build plan

Work the phases in order. Each has a definition of done — do not move on until
it holds. Read `docs/PROJECT_SPEC.md` first.

---

## Phase 0 — Foundation

- [ ] Scaffold Next.js 16 + TypeScript + Tailwind 4, `src/` directory, App Router
- [ ] Enable React Compiler in `next.config.ts`
- [ ] Create the Supabase project; link the CLI (`npx supabase link`)
- [ ] Run the three migrations in `supabase/migrations/`
- [ ] Generate `src/lib/database.types.ts`
- [ ] Build both Supabase clients and the session middleware
- [ ] Deploy an empty shell to Vercel with env vars set

**Done when:** a deployed page reads the signed-in user's name from `profiles`.

---

## Phase 1 — Auth and profile

- [ ] Sign-in page (email + password)
- [ ] Invite acceptance flow from the emailed link
- [ ] Profile page: name, phone, photo
- [ ] App shell — sidebar on desktop, bottom tabs on mobile
- [ ] Route protection: unauthenticated hits redirect to sign-in

**Done when:** a new user accepts an invite, sets a password, lands in the app,
and the signup trigger has already created their two wheels plus the eight WOL
spokes.

**Verify the guarantee:** sign in as user A, try to read user B's wheel through
the client. It must come back empty. This is the whole product promise — test it
now, not later.

---

## Phase 2 — Wheel and scoring

- [ ] Radar SVG component: eight or more axes, three overlaid polygons, labels
- [ ] Score grid, editable, 0–10
- [ ] Cycle picker; **New cycle** calling `create_wheel_cycle`
- [ ] Prefilled values visually distinct until touched
- [ ] WOB spoke management: add, rename, reorder, disable
- [ ] Disable rather than delete — surface the trigger's message if a delete is
      attempted, do not swallow it
- [ ] Empty state for a business wheel with no spokes

**Done when:** a member creates a Sep cycle, edits three spokes, reloads, and
sees exactly what they saved. Creating an Oct cycle prefills from Sep.

The radar is the hardest component and the most valuable. Build it first, alone,
against fixed data, before wiring it to the database.

---

## Phase 3 — Focus areas and action plans

- [ ] Spoke detail page
- [ ] Focus area CRUD: issue, one-year goal, five-year goal
- [ ] Action plan CRUD with its paired challenge
- [ ] Plan status: Active, Completed, Dropped
- [ ] Navigate from a spoke on the wheel into its detail

**Done when:** the Health spoke from the founder's own sheet can be entered end
to end — two focus areas, six action plans, each with its challenge.

---

## Phase 4 — Tasks

- [ ] Task list, open items sorted by `target_on`
- [ ] Create and edit: title, tag, both dates, status
- [ ] Link to one or more action plans, searchable across both wheels
- [ ] Inline status change with optimistic update
- [ ] Notes on a task
- [ ] Completed and cancelled behind a disclosure
- [ ] Legible when screen-shared: no truncated titles, no horizontal scroll

**Done when:** status changes persist and `completed_on` is stamped by the
database. Confirm by moving a task to Completed and back and checking the column
clears.

---

## Phase 5 — Boards, meetings, dashboard

- [ ] Boards list for the member
- [ ] Board page: counts table from `board_velocity`
- [ ] Meeting calendar; chairman can add and move meetings
- [ ] Window defaults from `meeting_window`
- [ ] Superadmin: create boards, manage rosters, invite by email
- [ ] Invite server action using the secret key — server-only, zod-validated

**Done when:** two members on the same board see identical counts, and neither
can reach the other's task titles through any request.

---

## Phase 6 — Cycles and comparison

- [ ] Cycle list, latest first
- [ ] Open a past cycle to edit
- [ ] Select two cycles and overlay them on one radar
- [ ] Movement table: spoke, earlier score, later score, change

**Done when:** an April and a September cycle render together and the shape
difference is readable at a glance. This screen is the argument for the whole
product — give it the polish.

---

## Phase 7 — PWA and mobile

- [ ] `manifest.json` with maskable icons
- [ ] `src/sw.ts` via `@serwist/next`, disabled in dev
- [ ] Precache the shell; **exclude every authenticated route and Supabase call**
- [ ] Offline fallback page
- [ ] Install prompt handling
- [ ] Full pass at 375px: wheel, grid, task list, dashboard
- [ ] Touch targets ≥ 44px; score entry via stepper, not a text field
- [ ] Lighthouse: PWA installable, accessibility ≥ 95

**Done when:** the app installs on an Android phone, opens offline to a sensible
fallback, and every screen works one-handed at 375px.

---

## Phase 8 — Hardening

- [ ] RLS test suite: for every table, user A cannot read or write user B's rows
- [ ] Confirm superadmin cannot read member content, including via `board_velocity`
- [ ] Confirm the spoke delete guard fires
- [ ] Confirm a cycle cannot be duplicated within a month
- [ ] Rate-limit the invite action
- [ ] Error boundaries and empty states on every route

**Done when:** the RLS suite passes and a deliberate attempt to read another
member's data through the client fails on every table.

---

## Sequencing note

Phases 2 and 4 are the two the members will judge the app by. Phase 5 is what
makes it a board rather than a personal tracker. If time is short, ship 0–4 to
one member for a fortnight of real use before building 5–7 — a cycle of real
usage will change more decisions than another week of building.

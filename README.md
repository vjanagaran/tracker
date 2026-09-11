# Personal Board (PB)

A peer-accountability platform for entrepreneur boards running the Wheel of Life
and Wheel of Business practice on a fortnightly review cycle.

## Start here

1. `docs/PROJECT_SPEC.md` — what this is, the data model, the stack, the rules.
2. `docs/wireframe.html` — the agreed screens. Open it in a browser.
3. `docs/BUILD_PLAN.md` — phased tasks and what is still open.

Cursor reads `.cursor/rules/` automatically. `project.mdc` applies to every
request and carries the invariants; the other two scope to database and
frontend work.

## Setup

```bash
npm i
cp .env.example .env
# fill NEXT_PUBLIC_APP_URL, the two public Supabase keys, and SUPABASE_SECRET_KEY

npx supabase link --project-ref <ref>
npx supabase db push
npx supabase gen types typescript --linked > src/lib/database.types.ts
# use --local instead of --linked if you are running the Supabase stack locally

npm run dev
```

`.env` (Next also reads `.env.local` if you prefer that name):

```
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

`SUPABASE_SECRET_KEY` is server-only. It is used by the invite actions, the
admin roster loader (email and invite-accepted), and the RLS test script. Never
import it into a client component or a module a client can reach.

## Tests

```bash
npm test              # rate limiter
npm run test:rls      # live-project RLS suite (needs .env)
npx supabase test db  # pgTAP companion
```

## The three rules that shape everything

1. Every score is self-rated. Nothing is derived or averaged.
2. Wheels, plans and tasks belong to the person, not the board.
3. Everything below `wheels` is private to its owner. The board sees a roster,
   a calendar, and two counts per member.

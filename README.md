# Personal Board (PB)

A peer-accountability platform for entrepreneur boards running the Wheel of Life
and Wheel of Business practice on a fortnightly review cycle.

## Start here

1. `docs/PROJECT_SPEC.md` — what this is, the data model, the stack, the rules.
2. `docs/wireframe.html` — the agreed screens. Open it in a browser.
3. `docs/BUILD_PLAN.md` — phased tasks with a definition of done for each.

Cursor reads `.cursor/rules/` automatically. `project.mdc` applies to every
request and carries the invariants; the other two scope to database and
frontend work.

## Setup

```bash
npx create-next-app@latest . --typescript --app --tailwind --eslint --src-dir
npm i @supabase/supabase-js@latest @supabase/ssr@latest \
      @tanstack/react-query@latest react-hook-form@latest zod@latest \
      @hookform/resolvers@latest date-fns@latest
npm i -D @serwist/next@latest serwist@latest supabase@latest
npx shadcn@latest init

npx supabase link --project-ref <ref>
npx supabase db push
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

The secret key is server-only and is used by one thing: the invite action.

## The three rules that shape everything

1. Every score is self-rated. Nothing is derived or averaged.
2. Wheels, plans and tasks belong to the person, not the board.
3. Everything below `wheels` is private to its owner. The board sees a roster,
   a calendar, and two counts per member.

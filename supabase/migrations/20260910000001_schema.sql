-- ============================================================
-- PB — Personal Board
-- Migration 0001: core schema
-- ============================================================
-- Ownership: wheels, spokes, focus areas, action plans and tasks
-- belong to the PERSON. A board is a review context — a roster,
-- a meeting calendar, and two counts per member. Members carry
-- their full history when they move between boards.
--
-- Ratings are versioned by month: one wheel cycle per month-year,
-- editable within that cycle, kept forever for comparison.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------

create type wheel_type   as enum ('WOL', 'WOB');
create type task_tag     as enum ('WOL', 'WOB', 'OPEN');
create type member_role  as enum ('chairman', 'director');
create type member_state as enum ('active', 'inactive');

create type task_status as enum (
  'Not Started', 'Work in Progress', 'Completed',
  'Postponed', 'Hold Now', 'Cancelled'
);

create type plan_status    as enum ('Active', 'Completed', 'Dropped');
create type meeting_status as enum ('Scheduled', 'Completed', 'Cancelled');

-- ---------- people ----------

create table profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null default '',
  phone          text,
  photo_url      text,
  is_superadmin  boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ---------- boards ----------

create table boards (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  description      text,
  cadence_days     integer not null default 15,
  meeting_weekday  integer check (meeting_weekday between 0 and 6),  -- 4 = Thursday
  created_by       uuid not null references profiles(id),
  created_at       timestamptz not null default now()
);

create table board_members (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  role       member_role  not null default 'director',
  status     member_state not null default 'active',
  joined_on  date not null default current_date,
  left_on    date,
  unique (board_id, user_id)
);

create index board_members_board_idx on board_members (board_id, status);
create index board_members_user_idx  on board_members (user_id, status);

create unique index board_one_chairman_idx
  on board_members (board_id)
  where role = 'chairman' and status = 'active';

create table meetings (
  id            uuid primary key default gen_random_uuid(),
  board_id      uuid not null references boards(id) on delete cascade,
  scheduled_at  timestamptz not null,
  status        meeting_status not null default 'Scheduled',
  notes         text,
  created_at    timestamptz not null default now()
);

create index meetings_board_idx on meetings (board_id, scheduled_at desc);

-- ---------- wheels ----------

create table wheels (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        wheel_type not null,
  created_at  timestamptz not null default now(),
  unique (user_id, type)
);

-- WOL spokes are seeded fixed and stay active. WOB spokes are
-- member-defined: they may be disabled but never deleted once
-- anything hangs off them, so old cycles stay readable.
create table spokes (
  id             uuid primary key default gen_random_uuid(),
  wheel_id       uuid not null references wheels(id) on delete cascade,
  name           text not null,
  sort_order     integer not null default 0,
  is_predefined  boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

create index spokes_wheel_idx on spokes (wheel_id, is_active, sort_order);

-- ---------- rating cycles ----------
-- One cycle per wheel per month-year. Each cycle is a complete,
-- self-consistent snapshot of the whole wheel, so any two cycles
-- can be laid over each other.

create table wheel_cycles (
  id          uuid primary key default gen_random_uuid(),
  wheel_id    uuid not null references wheels(id) on delete cascade,
  period      date not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (wheel_id, period),
  constraint period_is_month_start
    check (period = date_trunc('month', period)::date)
);

create index wheel_cycles_idx on wheel_cycles (wheel_id, period desc);

-- Nullable so a cycle can be created and filled in over a sitting
-- rather than demanding every spoke at once.
create table spoke_scores (
  cycle_id   uuid not null references wheel_cycles(id) on delete cascade,
  spoke_id   uuid not null references spokes(id) on delete cascade,
  score_now  integer check (score_now between 0 and 10),
  target_1y  integer check (target_1y between 0 and 10),
  target_5y  integer check (target_5y between 0 and 10),
  primary key (cycle_id, spoke_id)
);

create index spoke_scores_spoke_idx on spoke_scores (spoke_id);

-- ---------- focus areas and action plans ----------

create table focus_areas (
  id             uuid primary key default gen_random_uuid(),
  spoke_id       uuid not null references spokes(id) on delete cascade,
  current_issue  text not null,
  goal_1y        text,
  goal_5y        text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index focus_areas_spoke_idx on focus_areas (spoke_id, sort_order);

-- Plan and challenge are one pair.
create table action_plans (
  id             uuid primary key default gen_random_uuid(),
  focus_area_id  uuid not null references focus_areas(id) on delete cascade,
  description    text not null,
  challenge      text,
  status         plan_status not null default 'Active',
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index action_plans_focus_idx on action_plans (focus_area_id, sort_order);

-- ---------- tasks ----------

create table tasks (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles(id) on delete cascade,
  title             text not null,
  tag               task_tag,
  status            task_status not null default 'Not Started',
  planned_start_on  date,      -- personal reference
  target_on         date,      -- commitment date; drives the review sort
  completed_on      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index tasks_user_open_idx      on tasks (user_id, status, target_on);
create index tasks_user_completed_idx on tasks (user_id, completed_on);

create table task_action_plans (
  task_id         uuid not null references tasks(id) on delete cascade,
  action_plan_id  uuid not null references action_plans(id) on delete cascade,
  primary key (task_id, action_plan_id)
);

create index task_action_plans_plan_idx on task_action_plans (action_plan_id);

create table task_notes (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  note        text not null,
  created_at  timestamptz not null default now()
);

create index task_notes_task_idx on task_notes (task_id, created_at);

-- ---------- triggers ----------

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch      before update on profiles      for each row execute function touch_updated_at();
create trigger tasks_touch         before update on tasks         for each row execute function touch_updated_at();
create trigger wheel_cycles_touch  before update on wheel_cycles  for each row execute function touch_updated_at();

-- completed_on is stamped by the database, since board_velocity
-- counts against it and it must not be settable by hand.
create or replace function stamp_task_completion()
returns trigger language plpgsql as $$
begin
  if new.status = 'Completed' and new.completed_on is null then
    new.completed_on := now();
  elsif new.status <> 'Completed' then
    new.completed_on := null;
  end if;
  return new;
end;
$$;

create trigger tasks_stamp_completion
  before insert or update on tasks
  for each row execute function stamp_task_completion();

-- A spoke with any history cannot be deleted — disable it instead,
-- so past cycles keep rendering with the spokes they were rated on.
create or replace function guard_spoke_delete()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from focus_areas  where spoke_id = old.id)
  or exists (select 1 from spoke_scores where spoke_id = old.id) then
    raise exception
      'Spoke "%" has focus areas or past ratings. Disable it instead of deleting.',
      old.name;
  end if;
  return old;
end;
$$;

create trigger spokes_guard_delete
  before delete on spokes
  for each row execute function guard_spoke_delete();

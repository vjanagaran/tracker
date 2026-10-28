-- ============================================================
-- Migration: share a task with a board (opt-in, per task, per board)
-- ============================================================
-- DECISION (overrides the earlier "counts only" rule for tasks): a member may
-- choose, task by task and board by board, to show a task to the other active
-- members of that board. Nothing is shared by default.
--
-- What stays the same:
--   * The task still belongs to the person. There is no board_id on `tasks`;
--     the choice lives in its own table, task_board_shares.
--   * Only the owner can read or write task_board_shares.
--   * `tasks`, `task_notes`, `task_action_plans` keep their owner-only policies.
--     Another member never reads those tables.
--
-- What is new: one SECURITY DEFINER function, board_shared_goals, that returns a
-- fixed, narrow set of columns for tasks the owner has shared with that board.
-- It never returns notes, priority, tag, times, repeat rules or links.
-- ============================================================

create table task_board_shares (
  task_id     uuid not null references tasks(id)  on delete cascade,
  board_id    uuid not null references boards(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (task_id, board_id)
);

create index task_board_shares_board_idx on task_board_shares (board_id);

alter table task_board_shares enable row level security;

-- Owner only, and only onto a board the owner is an active member of.
create policy task_board_shares_own on task_board_shares for all
  using (owns_task(task_id))
  with check (owns_task(task_id) and is_board_member(board_id));

-- ---------- the shared read ----------
-- Caller must be an active member of the board; superadmin gets no exemption.
-- A task appears only while its owner is still an active member of the board.
-- Spoke is the name of the spoke(s) the task works toward, from the owner's own
-- action plans; empty when the task is not linked to a plan.

create or replace function board_shared_goals(p_board_id uuid)
returns table (
  user_id          uuid,
  full_name        text,
  task_id          uuid,
  title            text,
  description      text,
  spoke_names      text,
  planned_start_on date,
  target_on        date,
  status           task_status
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not is_board_member(p_board_id) then
    raise exception 'not a member of this board';
  end if;

  return query
  select
    t.user_id,
    p.full_name,
    t.id,
    t.title,
    t.description,
    (
      select string_agg(distinct s.name, ', ' order by s.name)
      from task_action_plans tap
      join action_plans ap on ap.id = tap.action_plan_id
      join focus_areas  fa on fa.id = ap.focus_area_id
      join spokes       s  on s.id  = fa.spoke_id
      where tap.task_id = t.id
    ),
    t.planned_start_on,
    t.target_on,
    t.status
  from task_board_shares sh
  join tasks t           on t.id = sh.task_id
  join board_members bm  on bm.board_id = sh.board_id
                        and bm.user_id  = t.user_id
                        and bm.status   = 'active'
  join profiles p        on p.id = t.user_id
  where sh.board_id = p_board_id
  order by p.full_name, t.target_on nulls last, t.created_at;
end;
$$;

revoke all on function board_shared_goals(uuid) from public;
grant execute on function board_shared_goals(uuid) to authenticated;

-- ---------- repeating tasks keep their sharing ----------
-- Same as the previous definition, plus: the next occurrence is shared with the
-- same boards, where the owner is still a member. SECURITY INVOKER, so the
-- is_board_member check keeps the insert inside the policy.

create or replace function spawn_next_occurrence()
returns trigger language plpgsql as $$
declare
  v_target date;
  v_start  date;
  v_id     uuid;
begin
  if new.repeat_every is null
     or new.status <> 'Completed'
     or old.status = 'Completed' then
    return new;
  end if;

  v_target := next_occurrence_on(new.target_on, new.repeat_every);

  if new.repeat_until is not null and v_target > new.repeat_until then
    return new;
  end if;

  -- Never two open occurrences of one series. A member who completes an
  -- old occurrence late does not get a second copy of the same habit.
  if exists (
    select 1 from tasks t
    where t.series_id = new.series_id
      and t.id <> new.id
      and t.status not in ('Completed', 'Cancelled')
  ) then
    return new;
  end if;

  -- Keep the same run-up the member gave themselves.
  if new.planned_start_on is not null then
    v_start := v_target - (new.target_on - new.planned_start_on);
  end if;

  insert into tasks (
    user_id, title, description, tag, status, priority,
    planned_start_on, planned_start_time, target_on, target_time,
    repeat_every, repeat_until, series_id
  ) values (
    new.user_id, new.title, new.description, new.tag, 'Not Started', new.priority,
    v_start, new.planned_start_time, v_target, new.target_time,
    new.repeat_every, new.repeat_until, new.series_id
  )
  returning id into v_id;

  insert into task_action_plans (task_id, action_plan_id)
  select v_id, action_plan_id from task_action_plans where task_id = new.id;

  insert into task_board_shares (task_id, board_id)
  select v_id, board_id from task_board_shares
  where task_id = new.id and is_board_member(board_id);

  return new;
end;
$$;

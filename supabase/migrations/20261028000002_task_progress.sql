-- ============================================================
-- Migration: self-set progress on a task
-- ============================================================
-- A member sets how far along their own task is, 0 to 100 in steps of 5.
-- It is a personal marker on one task. It is never averaged, summed or rolled
-- up into anything (no plan, spoke, board or member figure), and it is not a
-- completion metric.
--
-- The value stored is exactly what the member set. What it means follows the
-- status, and the app applies that when it reads:
--   Not Started        reads as 0
--   Completed          reads as 100
--   Work in Progress,
--   Hold Now,
--   Postponed          the member's own number
--   Cancelled          the number the task had; not shown on the board
-- Storing it untouched means finishing a task and then undoing that does not
-- lose where the member had got to.
-- ============================================================

alter table tasks
  add column progress smallint not null default 0
    check (progress between 0 and 100 and progress % 5 = 0);

-- ---------- the shared read gains one column ----------
-- Progress goes to the board only for the three statuses where the member sets
-- it. For every other status the column comes back null.
-- The return shape changes, so the function is dropped and made again with the
-- same checks as before.

drop function if exists board_shared_goals(uuid);

create function board_shared_goals(p_board_id uuid)
returns table (
  user_id          uuid,
  full_name        text,
  task_id          uuid,
  title            text,
  description      text,
  spoke_names      text,
  planned_start_on date,
  target_on        date,
  status           task_status,
  progress         smallint
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
    t.status,
    case
      when t.status in ('Work in Progress', 'Hold Now', 'Postponed') then t.progress
      else null
    end
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

-- A repeating task's next occurrence starts again at 0, which is the column
-- default, so spawn_next_occurrence needs no change.

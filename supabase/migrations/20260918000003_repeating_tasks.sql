-- ============================================================
-- Repeating tasks
-- ============================================================
-- A spoke moves through repetition, and until now a member could
-- write "walk daily" as an action plan but only ever create one
-- task with one date. The tool could hold the intention and not
-- the habit.
--
-- Each occurrence is its own row. That keeps completed_on, the
-- board counts and the history working exactly as they do for a
-- one-off task, and it means nothing here computes or rolls up a
-- score. The next occurrence appears when the current one is
-- completed — one at a time, so the open count stays honest and
-- there is never a wall of future copies to look at.

create type task_repeat as enum ('daily', 'weekly', 'fortnightly', 'monthly');

alter table tasks
  add column repeat_every task_repeat,
  add column repeat_until date,
  add column series_id    uuid;

-- Nothing to advance from without a date.
alter table tasks
  add constraint tasks_repeat_needs_target
  check (repeat_every is null or target_on is not null);

update tasks set series_id = id where series_id is null;

-- Every task is its own series. Occurrences carry the first one's id,
-- which is how the trigger below knows one is already open.
create or replace function stamp_task_series()
returns trigger language plpgsql as $$
begin
  if new.series_id is null then
    new.series_id := new.id;
  end if;
  return new;
end;
$$;

create trigger tasks_stamp_series
  before insert on tasks
  for each row execute function stamp_task_series();

alter table tasks alter column series_id set not null;

create index tasks_series_idx on tasks (series_id, status);

create or replace function next_occurrence_on(p_from date, p_every task_repeat)
returns date language sql immutable as $$
  select case p_every
    when 'daily'       then p_from + 1
    when 'weekly'      then p_from + 7
    when 'fortnightly' then p_from + 14
    when 'monthly'     then (p_from + interval '1 month')::date
  end;
$$;

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
    user_id, title, tag, status, planned_start_on, target_on,
    repeat_every, repeat_until, series_id
  ) values (
    new.user_id, new.title, new.tag, 'Not Started', v_start, v_target,
    new.repeat_every, new.repeat_until, new.series_id
  )
  returning id into v_id;

  insert into task_action_plans (task_id, action_plan_id)
  select v_id, action_plan_id from task_action_plans where task_id = new.id;

  return new;
end;
$$;

create trigger tasks_spawn_next
  after update on tasks
  for each row execute function spawn_next_occurrence();

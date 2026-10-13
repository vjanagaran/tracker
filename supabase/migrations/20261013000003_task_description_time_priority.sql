-- Tasks gain a description, an optional time on each of the two dates, and a
-- priority flag. All of it stays on the member's own task row: nothing here is
-- visible to anyone else, and nothing is computed from it.
--
--   description         free text, optional
--   planned_start_time  time of day for planned_start_on, optional
--   target_time         time of day for target_on, optional
--   priority            High | Medium | Low | Flexi. Flexi is the default, and
--                       means "no pressure on when".

create type task_priority as enum ('high', 'medium', 'low', 'flexi');

alter table tasks
  add column description        text
    check (description is null or char_length(description) <= 4000),
  add column planned_start_time time,
  add column target_time        time,
  add column priority           task_priority not null default 'flexi',
  -- A time belongs to a day. Clearing the date clears the time.
  add constraint tasks_start_time_needs_date
    check (planned_start_time is null or planned_start_on is not null),
  add constraint tasks_target_time_needs_date
    check (target_time is null or target_on is not null);

-- A repeating task's next occurrence keeps what the member wrote and chose:
-- description, priority and the times of day. Notes stay with the occurrence
-- they were written on, as before.
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

  return new;
end;
$$;

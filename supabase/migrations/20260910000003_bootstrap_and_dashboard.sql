-- ============================================================
-- Migration 0003: seed, bootstrap, cycles, dashboard
-- ============================================================

-- ---------- fixed WOL spokes ----------
-- Defined once for the whole system. Changing this list is a
-- deliberate central act, which is what keeps the life wheel
-- portable between boards.

create table wol_spoke_templates (
  name        text primary key,
  sort_order  integer not null
);

insert into wol_spoke_templates (name, sort_order) values
  ('Health',             1),
  ('Family',             2),
  ('Business',           3),
  ('Personal Finance',   4),
  ('Personal Growth',    5),
  ('Fun & Hobby',        6),
  ('Spiritual pursuits', 7),
  ('Giving back',        8);

alter table wol_spoke_templates enable row level security;

create policy wol_templates_read on wol_spoke_templates for select
  using (auth.uid() is not null);

-- ---------- bootstrap on signup ----------

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_wol_id uuid;
begin
  insert into profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));

  insert into wheels (user_id, type) values (new.id, 'WOL')
  returning id into v_wol_id;

  insert into spokes (wheel_id, name, sort_order, is_predefined)
  select v_wol_id, t.name, t.sort_order, true from wol_spoke_templates t;

  insert into wheels (user_id, type) values (new.id, 'WOB');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- start a new rating cycle ----------
-- Behind the "New cycle" button. Creates the month's cycle and
-- prefills every active spoke from the most recent earlier cycle,
-- so the member only edits what actually moved. Spokes with no
-- prior rating come through blank.
--
-- SECURITY INVOKER: RLS applies, so a member can only create a
-- cycle on a wheel they own.

create or replace function create_wheel_cycle(
  p_wheel_id uuid,
  p_period   date
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_month  date := date_trunc('month', p_period)::date;
  v_cycle  uuid;
  v_prev   uuid;
begin
  insert into wheel_cycles (wheel_id, period)
  values (p_wheel_id, v_month)
  returning id into v_cycle;

  select c.id into v_prev
  from wheel_cycles c
  where c.wheel_id = p_wheel_id and c.period < v_month
  order by c.period desc
  limit 1;

  insert into spoke_scores (cycle_id, spoke_id, score_now, target_1y, target_5y)
  select v_cycle, s.id, prev.score_now, prev.target_1y, prev.target_5y
  from spokes s
  left join spoke_scores prev
         on prev.spoke_id = s.id and prev.cycle_id = v_prev
  where s.wheel_id = p_wheel_id and s.is_active;

  return v_cycle;
end;
$$;

grant execute on function create_wheel_cycle(uuid, date) to authenticated;

-- ---------- board dashboard ----------
-- The only place that reads across members, and the only place RLS
-- is bypassed. Returns counts and names — never a task title, tag,
-- date or link. Caller must be an active member; superadmin gets no
-- exemption, because superadmin sees no member content.

create or replace function board_velocity(
  p_board_id uuid,
  p_from     timestamptz,
  p_to       timestamptz
)
returns table (
  user_id uuid, full_name text, completed_count bigint, open_count bigint
)
language plpgsql security definer set search_path = public stable
as $$
begin
  if not is_board_member(p_board_id) then
    raise exception 'not a member of this board';
  end if;

  return query
  select
    p.id,
    p.full_name,
    count(t.id) filter (
      where t.status = 'Completed'
        and t.completed_on >= p_from
        and t.completed_on <  p_to
    ),
    count(t.id) filter (
      where t.status in ('Not Started', 'Work in Progress', 'Postponed', 'Hold Now')
    )
  from board_members bm
  join profiles p on p.id = bm.user_id
  left join tasks t on t.user_id = p.id
  where bm.board_id = p_board_id and bm.status = 'active'
  group by p.id, p.full_name
  order by p.full_name;
end;
$$;

revoke all on function board_velocity(uuid, timestamptz, timestamptz) from public;
grant execute on function board_velocity(uuid, timestamptz, timestamptz) to authenticated;

-- ---------- review window ----------
-- "Between meetings" = previous meeting → this one. A board's first
-- meeting counts everything up to that date.

create or replace function meeting_window(p_meeting_id uuid)
returns table (window_from timestamptz, window_to timestamptz)
language sql security definer set search_path = public stable
as $$
  select
    coalesce(
      (select max(prev.scheduled_at) from meetings prev
        where prev.board_id = m.board_id
          and prev.scheduled_at < m.scheduled_at
          and prev.status <> 'Cancelled'),
      '-infinity'::timestamptz
    ),
    m.scheduled_at
  from meetings m
  where m.id = p_meeting_id and is_board_member(m.board_id);
$$;

grant execute on function meeting_window(uuid) to authenticated;

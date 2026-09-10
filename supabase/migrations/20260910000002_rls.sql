-- ============================================================
-- Migration 0002: row level security
-- ============================================================
-- Everything from `wheels` down is PRIVATE to its owner. No member,
-- chairman or superadmin can read another person's wheels, cycles,
-- scores, focus areas, action plans or tasks.
--
-- Shared reads: profiles of co-members, the board roster, the
-- meeting calendar, and the two counts from board_velocity.
-- ============================================================

-- ---------- helpers ----------
-- SECURITY DEFINER so policies on board_members can query
-- board_members without recursing into their own policy.

create or replace function is_superadmin()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select is_superadmin from profiles where id = auth.uid()), false);
$$;

create or replace function is_board_member(p_board_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from board_members
    where board_id = p_board_id and user_id = auth.uid() and status = 'active'
  );
$$;

create or replace function is_board_chairman(p_board_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from board_members
    where board_id = p_board_id and user_id = auth.uid()
      and status = 'active' and role = 'chairman'
  );
$$;

create or replace function shares_board_with(p_user_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1
    from board_members me
    join board_members them on them.board_id = me.board_id
    where me.user_id = auth.uid() and me.status = 'active'
      and them.user_id = p_user_id and them.status = 'active'
  );
$$;

-- Owner check for anything hanging off a wheel.
create or replace function owns_wheel(p_wheel_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from wheels where id = p_wheel_id and user_id = auth.uid());
$$;

create or replace function owns_spoke(p_spoke_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from spokes s join wheels w on w.id = s.wheel_id
    where s.id = p_spoke_id and w.user_id = auth.uid()
  );
$$;

create or replace function owns_cycle(p_cycle_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from wheel_cycles c join wheels w on w.id = c.wheel_id
    where c.id = p_cycle_id and w.user_id = auth.uid()
  );
$$;

create or replace function owns_focus_area(p_focus_area_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from focus_areas f
    join spokes s on s.id = f.spoke_id
    join wheels w on w.id = s.wheel_id
    where f.id = p_focus_area_id and w.user_id = auth.uid()
  );
$$;

create or replace function owns_task(p_task_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from tasks where id = p_task_id and user_id = auth.uid());
$$;

-- ---------- enable ----------

alter table profiles          enable row level security;
alter table boards            enable row level security;
alter table board_members     enable row level security;
alter table meetings          enable row level security;
alter table wheels            enable row level security;
alter table spokes            enable row level security;
alter table wheel_cycles      enable row level security;
alter table spoke_scores      enable row level security;
alter table focus_areas       enable row level security;
alter table action_plans      enable row level security;
alter table tasks             enable row level security;
alter table task_action_plans enable row level security;
alter table task_notes        enable row level security;

-- ---------- shared surface ----------

create policy profiles_select on profiles for select
  using (id = auth.uid() or shares_board_with(id) or is_superadmin());

create policy profiles_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy boards_select on boards for select
  using (is_board_member(id) or is_superadmin());

create policy boards_insert on boards for insert with check (is_superadmin());
create policy boards_update on boards for update using (is_superadmin()) with check (is_superadmin());
create policy boards_delete on boards for delete using (is_superadmin());

create policy board_members_select on board_members for select
  using (is_board_member(board_id) or user_id = auth.uid() or is_superadmin());

create policy board_members_write on board_members for all
  using (is_superadmin()) with check (is_superadmin());

-- DECISION: the chairman keeps the calendar. Scheduling is board
-- administration, not member data. Remove is_board_chairman from
-- the write policy to make meetings superadmin-only.
create policy meetings_select on meetings for select
  using (is_board_member(board_id) or is_superadmin());

create policy meetings_write on meetings for all
  using (is_superadmin() or is_board_chairman(board_id))
  with check (is_superadmin() or is_board_chairman(board_id));

-- ---------- private surface: owner only ----------

create policy wheels_own on wheels for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy spokes_own on spokes for all
  using (owns_wheel(wheel_id)) with check (owns_wheel(wheel_id));

create policy wheel_cycles_own on wheel_cycles for all
  using (owns_wheel(wheel_id)) with check (owns_wheel(wheel_id));

create policy spoke_scores_own on spoke_scores for all
  using (owns_cycle(cycle_id)) with check (owns_cycle(cycle_id));

create policy focus_areas_own on focus_areas for all
  using (owns_spoke(spoke_id)) with check (owns_spoke(spoke_id));

create policy action_plans_own on action_plans for all
  using (owns_focus_area(focus_area_id)) with check (owns_focus_area(focus_area_id));

create policy tasks_own on tasks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy task_action_plans_own on task_action_plans for all
  using (owns_task(task_id)) with check (owns_task(task_id));

create policy task_notes_own on task_notes for all
  using (owns_task(task_id)) with check (owns_task(task_id));

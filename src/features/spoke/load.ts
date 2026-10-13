import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { OPEN_STATUSES } from "@/features/tasks/types";
import type { ActionPlan, FocusArea, SpokeDetail } from "./types";

type Client = SupabaseClient<Database>;

export async function loadSpokeDetail(
  supabase: Client,
  userId: string,
  spokeId: string,
): Promise<SpokeDetail | null> {
  const { data: spoke, error: spokeError } = await supabase
    .from("spokes")
    .select("id, name, wheel_id")
    .eq("id", spokeId)
    .maybeSingle();

  if (spokeError || !spoke) {
    return null;
  }

  const { data: wheel, error: wheelError } = await supabase
    .from("wheels")
    .select("id, type, user_id")
    .eq("id", spoke.wheel_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (wheelError || !wheel) {
    return null;
  }

  const { data: latestCycle } = await supabase
    .from("wheel_cycles")
    .select("id")
    .eq("wheel_id", wheel.id)
    .order("period", { ascending: false })
    .limit(1)
    .maybeSingle();

  let scoreNow: number | null = null;
  let target1y: number | null = null;

  if (latestCycle) {
    const { data: score } = await supabase
      .from("spoke_scores")
      .select("score_now, target_1y")
      .eq("cycle_id", latestCycle.id)
      .eq("spoke_id", spoke.id)
      .maybeSingle();
    scoreNow = score?.score_now ?? null;
    target1y = score?.target_1y ?? null;
  }

  const { data: focusRows, error: focusError } = await supabase
    .from("focus_areas")
    .select("id, current_issue, goal_1y, goal_5y, sort_order")
    .eq("spoke_id", spoke.id)
    .order("sort_order", { ascending: true });

  if (focusError) {
    throw new Error(focusError.message);
  }

  const focusIds = (focusRows ?? []).map((row) => row.id);
  const plansByFocus = new Map<string, ActionPlan[]>();

  if (focusIds.length > 0) {
    const { data: planRows, error: planError } = await supabase
      .from("action_plans")
      .select("id, focus_area_id, description, challenge, status, sort_order")
      .in("focus_area_id", focusIds)
      .order("sort_order", { ascending: true });

    if (planError) {
      throw new Error(planError.message);
    }

    for (const row of planRows ?? []) {
      const list = plansByFocus.get(row.focus_area_id) ?? [];
      list.push({
        id: row.id,
        description: row.description,
        challenge: row.challenge,
        status: row.status,
        sortOrder: row.sort_order,
      });
      plansByFocus.set(row.focus_area_id, list);
    }
  }

  // Open tasks working toward this spoke, counted once however many plans they link.
  const focusByPlan = new Map<string, string>();
  for (const [focusId, plans] of plansByFocus) {
    for (const plan of plans) {
      focusByPlan.set(plan.id, focusId);
    }
  }
  const openByFocus = new Map<string, Set<string>>();
  const openAll = new Set<string>();

  if (focusByPlan.size > 0) {
    const { data: links, error: linkError } = await supabase
      .from("task_action_plans")
      .select("task_id, action_plan_id")
      .in("action_plan_id", [...focusByPlan.keys()]);

    if (linkError) {
      throw new Error(linkError.message);
    }

    const taskIds = [...new Set((links ?? []).map((link) => link.task_id))];
    if (taskIds.length > 0) {
      const { data: openRows, error: openError } = await supabase
        .from("tasks")
        .select("id")
        .in("id", taskIds)
        .in("status", OPEN_STATUSES);

      if (openError) {
        throw new Error(openError.message);
      }

      const open = new Set((openRows ?? []).map((row) => row.id));
      for (const link of links ?? []) {
        const focusId = focusByPlan.get(link.action_plan_id);
        if (!focusId || !open.has(link.task_id)) {
          continue;
        }
        openAll.add(link.task_id);
        const forFocus = openByFocus.get(focusId) ?? new Set<string>();
        forFocus.add(link.task_id);
        openByFocus.set(focusId, forFocus);
      }
    }
  }

  const focusAreas: FocusArea[] = (focusRows ?? []).map((row) => ({
    id: row.id,
    currentIssue: row.current_issue,
    goal1y: row.goal_1y,
    goal5y: row.goal_5y,
    sortOrder: row.sort_order,
    plans: plansByFocus.get(row.id) ?? [],
    openTasks: openByFocus.get(row.id)?.size ?? 0,
  }));

  return {
    id: spoke.id,
    name: spoke.name,
    wheelType: wheel.type,
    scoreNow,
    target1y,
    openTasks: openAll.size,
    focusAreas,
  };
}

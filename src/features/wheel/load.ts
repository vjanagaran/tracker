import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { tallyPlanTaskCounts } from "./labels";
import type {
  ComparisonAxis,
  CycleComparison,
  ScoreTriple,
  WheelCycle,
  WheelSheetFocus,
  WheelSheetSpoke,
  WheelSpoke,
} from "./types";

type Client = SupabaseClient<Database>;

function toScore(row: {
  score_now: number | null;
  target_1y: number | null;
  target_5y: number | null;
}): ScoreTriple {
  return {
    scoreNow: row.score_now,
    target1y: row.target_1y,
    target5y: row.target_5y,
  };
}

export async function loadWheelWorkspace(
  supabase: Client,
  wheelId: string,
  cycleId?: string,
) {
  const { data: spokeRows, error: spokeError } = await supabase
    .from("spokes")
    .select("id, name, sort_order, is_active, is_predefined")
    .eq("wheel_id", wheelId)
    .order("sort_order", { ascending: true });

  if (spokeError) {
    throw new Error(spokeError.message);
  }

  const allSpokes: WheelSpoke[] = (spokeRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isPredefined: row.is_predefined,
  }));

  const { data: cycleRows, error: cycleError } = await supabase
    .from("wheel_cycles")
    .select("id, period")
    .eq("wheel_id", wheelId)
    .order("period", { ascending: false });

  if (cycleError) {
    throw new Error(cycleError.message);
  }

  const cycles: WheelCycle[] = cycleRows ?? [];
  const selectedCycle =
    cycles.find((cycle) => cycle.id === cycleId) ?? cycles[0] ?? null;

  const scores: Record<string, ScoreTriple> = {};
  const previousScores: Record<string, ScoreTriple> = {};
  const scoredSpokeIds = new Set<string>();

  if (selectedCycle) {
    const { data: scoreRows, error: scoreError } = await supabase
      .from("spoke_scores")
      .select("spoke_id, score_now, target_1y, target_5y")
      .eq("cycle_id", selectedCycle.id);

    if (scoreError) {
      throw new Error(scoreError.message);
    }

    for (const row of scoreRows ?? []) {
      scores[row.spoke_id] = toScore(row);
      scoredSpokeIds.add(row.spoke_id);
    }

    const previousCycle = cycles.find(
      (cycle) => cycle.period < selectedCycle.period,
    );

    if (previousCycle) {
      const { data: previousRows, error: previousError } = await supabase
        .from("spoke_scores")
        .select("spoke_id, score_now, target_1y, target_5y")
        .eq("cycle_id", previousCycle.id);

      if (previousError) {
        throw new Error(previousError.message);
      }

      for (const row of previousRows ?? []) {
        previousScores[row.spoke_id] = toScore(row);
      }
    }
  }

  const latestCycle = cycles[0] ?? null;
  const viewingPast = Boolean(
    selectedCycle && latestCycle && selectedCycle.id !== latestCycle.id,
  );

  // Current view: active spokes only. Past cycle: keep inactive spokes that
  // still have scores, or the old wheel silently loses axes.
  const visibleSpokes = allSpokes.filter((spoke) => {
    if (spoke.isActive) {
      return true;
    }
    return viewingPast && scoredSpokeIds.has(spoke.id);
  });

  const sheetSpokes = await loadSheetSpokes(supabase, visibleSpokes);

  return {
    allSpokes,
    visibleSpokes,
    sheetSpokes,
    cycles,
    selectedCycle,
    scores,
    previousScores,
  };
}

async function loadSheetSpokes(
  supabase: Client,
  spokes: WheelSpoke[],
): Promise<WheelSheetSpoke[]> {
  if (spokes.length === 0) {
    return [];
  }

  const spokeIds = spokes.map((spoke) => spoke.id);
  const { data: focusRows, error: focusError } = await supabase
    .from("focus_areas")
    .select("id, spoke_id, current_issue, goal_1y, goal_5y, sort_order")
    .in("spoke_id", spokeIds)
    .order("sort_order", { ascending: true });

  if (focusError) {
    throw new Error(focusError.message);
  }

  const focusIds = (focusRows ?? []).map((row) => row.id);
  const plansByFocus = new Map<string, WheelSheetFocus["plans"]>();

  if (focusIds.length > 0) {
    const { data: planRows, error: planError } = await supabase
      .from("action_plans")
      .select("id, focus_area_id, description, challenge, sort_order")
      .in("focus_area_id", focusIds)
      .order("sort_order", { ascending: true });

    if (planError) {
      throw new Error(planError.message);
    }

    const planIds = (planRows ?? []).map((row) => row.id);
    const taskCounts = await loadPlanTaskCounts(supabase, planIds);

    for (const row of planRows ?? []) {
      const tally = taskCounts.get(row.id) ?? { completed: 0, total: 0 };
      const list = plansByFocus.get(row.focus_area_id) ?? [];
      list.push({
        id: row.id,
        description: row.description,
        challenge: row.challenge,
        completedTasks: tally.completed,
        totalTasks: tally.total,
      });
      plansByFocus.set(row.focus_area_id, list);
    }
  }

  const focusBySpoke = new Map<string, WheelSheetFocus[]>();
  for (const row of focusRows ?? []) {
    const list = focusBySpoke.get(row.spoke_id) ?? [];
    list.push({
      id: row.id,
      currentIssue: row.current_issue,
      goal1y: row.goal_1y,
      goal5y: row.goal_5y,
      plans: plansByFocus.get(row.id) ?? [],
    });
    focusBySpoke.set(row.spoke_id, list);
  }

  return spokes.map((spoke) => ({
    ...spoke,
    focusAreas: focusBySpoke.get(spoke.id) ?? [],
  }));
}

async function loadPlanTaskCounts(supabase: Client, planIds: string[]) {
  if (planIds.length === 0) {
    return new Map<string, { completed: number; total: number }>();
  }

  const { data: links, error: linkError } = await supabase
    .from("task_action_plans")
    .select("task_id, action_plan_id")
    .in("action_plan_id", planIds);

  if (linkError) {
    throw new Error(linkError.message);
  }

  const taskIds = [...new Set((links ?? []).map((link) => link.task_id))];
  if (taskIds.length === 0) {
    return new Map<string, { completed: number; total: number }>();
  }

  const { data: tasks, error: taskError } = await supabase
    .from("tasks")
    .select("id, status")
    .in("id", taskIds);

  if (taskError) {
    throw new Error(taskError.message);
  }

  const statusById = new Map((tasks ?? []).map((task) => [task.id, task.status]));
  return tallyPlanTaskCounts(
    (links ?? []).flatMap((link) => {
      const status = statusById.get(link.task_id);
      return status ? [{ actionPlanId: link.action_plan_id, status }] : [];
    }),
  );
}

export function resolveCyclePair(
  cycles: WheelCycle[],
  earlierId?: string,
  laterId?: string,
): { earlier: WheelCycle; later: WheelCycle } | null {
  if (cycles.length < 2) {
    return null;
  }

  const left = cycles.find((cycle) => cycle.id === earlierId);
  const right = cycles.find((cycle) => cycle.id === laterId);
  if (left && right && left.id !== right.id) {
    return left.period <= right.period
      ? { earlier: left, later: right }
      : { earlier: right, later: left };
  }

  return { earlier: cycles[1], later: cycles[0] };
}

export async function loadCycleComparison(
  supabase: Client,
  wheelId: string,
  earlierId?: string,
  laterId?: string,
): Promise<{ cycles: WheelCycle[]; comparison: CycleComparison | null }> {
  const { data: cycleRows, error: cycleError } = await supabase
    .from("wheel_cycles")
    .select("id, period")
    .eq("wheel_id", wheelId)
    .order("period", { ascending: false });

  if (cycleError) {
    throw new Error(cycleError.message);
  }

  const cycles: WheelCycle[] = cycleRows ?? [];
  const pair = resolveCyclePair(cycles, earlierId, laterId);
  if (!pair) {
    return { cycles, comparison: null };
  }

  const { data: spokeRows, error: spokeError } = await supabase
    .from("spokes")
    .select("id, name, sort_order, is_active, is_predefined")
    .eq("wheel_id", wheelId)
    .order("sort_order", { ascending: true });

  if (spokeError) {
    throw new Error(spokeError.message);
  }

  const { data: scoreRows, error: scoreError } = await supabase
    .from("spoke_scores")
    .select("cycle_id, spoke_id, score_now")
    .in("cycle_id", [pair.earlier.id, pair.later.id]);

  if (scoreError) {
    throw new Error(scoreError.message);
  }

  const earlierScores = new Map<string, number | null>();
  const laterScores = new Map<string, number | null>();
  const scoredIds = new Set<string>();

  for (const row of scoreRows ?? []) {
    scoredIds.add(row.spoke_id);
    if (row.cycle_id === pair.earlier.id) {
      earlierScores.set(row.spoke_id, row.score_now);
    }
    if (row.cycle_id === pair.later.id) {
      laterScores.set(row.spoke_id, row.score_now);
    }
  }

  const axes: ComparisonAxis[] = (spokeRows ?? [])
    .filter((spoke) => scoredIds.has(spoke.id))
    .map((spoke) => ({
      id: spoke.id,
      name: spoke.name,
      earlier: earlierScores.has(spoke.id) ? (earlierScores.get(spoke.id) ?? null) : null,
      later: laterScores.has(spoke.id) ? (laterScores.get(spoke.id) ?? null) : null,
    }));

  return {
    cycles,
    comparison: {
      earlier: pair.earlier,
      later: pair.later,
      axes,
    },
  };
}

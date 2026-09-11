import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type {
  ComparisonAxis,
  CycleComparison,
  ScoreTriple,
  WheelCycle,
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

  return {
    allSpokes,
    visibleSpokes,
    cycles,
    selectedCycle,
    scores,
    previousScores,
  };
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

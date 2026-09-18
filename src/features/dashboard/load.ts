import type { SupabaseClient } from "@supabase/supabase-js";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { formatWindowDay, rpcTimestamp } from "@/features/boards/labels";
import { loadMemberBoards } from "@/features/boards/load";
import type { MemberBoard } from "@/features/boards/types";
import { loadNoteList } from "@/features/notes/load";
import { OPEN_STATUSES } from "@/features/tasks/types";
import type { WheelRadarAxis } from "@/features/wheel/radar";
import type { Database, Enums } from "@/lib/database.types";
import { isoDay } from "./bucket";
import { CARD_ROW_LIMIT, LOW_SCORE, RECENT_NOTE_COUNT, monthStart } from "./labels";
import type { DashboardMeeting, DashboardTasks, DashboardView, DashboardWheel, PlanGap } from "./types";

type Client = SupabaseClient<Database>;

const wheelMeta = {
  WOL: { slug: "life", title: "Life wheel", short: "Life" },
  WOB: { slug: "business", title: "Business wheel", short: "Business" },
} as const satisfies Record<Enums<"wheel_type">, { slug: "life" | "business"; title: string; short: string }>;

const wheelOrder: Enums<"wheel_type">[] = ["WOL", "WOB"];

export async function loadDashboard(supabase: Client, userId: string): Promise<DashboardView> {
  const now = new Date();
  const boards = await loadMemberBoards(supabase, userId);

  const [meeting, tasks, wheelView, notes] = await Promise.all([
    loadNextMeeting(supabase, userId, boards),
    loadDashboardTasks(supabase, userId, now),
    loadWheels(supabase, userId, now),
    loadNoteList(supabase, userId, RECENT_NOTE_COUNT),
  ]);

  return {
    meeting,
    boardCount: boards.length,
    tasks,
    wheels: wheelView.wheels,
    planGaps: wheelView.planGaps,
    notes,
  };
}

async function loadNextMeeting(
  supabase: Client,
  userId: string,
  boards: MemberBoard[],
): Promise<DashboardMeeting | null> {
  if (boards.length === 0) {
    return null;
  }

  const { data: rows, error } = await supabase
    .from("meetings")
    .select("id, board_id, scheduled_at")
    .in(
      "board_id",
      boards.map((board) => board.id),
    )
    .neq("status", "Cancelled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const meeting = rows?.[0];
  if (!meeting) {
    return null;
  }

  const board = boards.find((item) => item.id === meeting.board_id);
  const { data: windowRows, error: windowError } = await supabase.rpc("meeting_window", {
    p_meeting_id: meeting.id,
  });

  if (windowError) {
    throw new Error(windowError.message);
  }

  const windowFrom = windowRows?.[0]?.window_from ?? null;
  const windowTo = windowRows?.[0]?.window_to ?? null;
  let completedCount: number | null = null;
  let openCount: number | null = null;

  // Read the member's own row from the same function the board reads, so the
  // numbers here are the numbers the board will see.
  if (windowFrom && windowTo) {
    const { data: velocity, error: velocityError } = await supabase.rpc("board_velocity", {
      p_board_id: meeting.board_id,
      p_from: rpcTimestamp(windowFrom),
      p_to: rpcTimestamp(windowTo),
    });

    if (velocityError) {
      throw new Error(velocityError.message);
    }

    const own = (velocity ?? []).find((row) => row.user_id === userId);
    if (own) {
      completedCount = Number(own.completed_count);
      openCount = Number(own.open_count);
    }
  }

  return {
    boardId: meeting.board_id,
    boardName: board?.name ?? "Board",
    scheduledAt: meeting.scheduled_at,
    daysAway: differenceInCalendarDays(parseISO(meeting.scheduled_at), new Date()),
    completedCount,
    openCount,
    since: windowFrom ? formatWindowDay(windowFrom) : null,
  };
}

async function loadDashboardTasks(supabase: Client, userId: string, now: Date): Promise<DashboardTasks> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, tag, target_on, repeat_every")
    .eq("user_id", userId)
    .in("status", OPEN_STATUSES)
    .order("target_on", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    tag: row.tag,
    targetOn: row.target_on,
    repeatEvery: row.repeat_every,
  }));

  return { rows, serverDay: isoDay(now) };
}

async function loadWheels(
  supabase: Client,
  userId: string,
  now: Date,
): Promise<{ wheels: DashboardWheel[]; planGaps: PlanGap[] }> {
  const { data: wheelRows, error: wheelError } = await supabase
    .from("wheels")
    .select("id, type")
    .eq("user_id", userId);

  if (wheelError) {
    throw new Error(wheelError.message);
  }

  const wheels = wheelRows ?? [];
  if (wheels.length === 0) {
    return { wheels: [], planGaps: [] };
  }

  const wheelIds = wheels.map((wheel) => wheel.id);
  const [{ data: spokeRows, error: spokeError }, { data: cycleRows, error: cycleError }] =
    await Promise.all([
      supabase
        .from("spokes")
        .select("id, wheel_id, name, sort_order")
        .in("wheel_id", wheelIds)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("wheel_cycles")
        .select("id, wheel_id, period")
        .in("wheel_id", wheelIds)
        .order("period", { ascending: false }),
    ]);

  if (spokeError) {
    throw new Error(spokeError.message);
  }
  if (cycleError) {
    throw new Error(cycleError.message);
  }

  const latestCycleByWheel = new Map<string, { id: string; period: string }>();
  for (const cycle of cycleRows ?? []) {
    if (!latestCycleByWheel.has(cycle.wheel_id)) {
      latestCycleByWheel.set(cycle.wheel_id, { id: cycle.id, period: cycle.period });
    }
  }

  const cycleIds = [...latestCycleByWheel.values()].map((cycle) => cycle.id);
  const scoreBySpoke = new Map<
    string,
    { scoreNow: number | null; target1y: number | null; target5y: number | null }
  >();

  if (cycleIds.length > 0) {
    const { data: scoreRows, error: scoreError } = await supabase
      .from("spoke_scores")
      .select("spoke_id, score_now, target_1y, target_5y")
      .in("cycle_id", cycleIds);

    if (scoreError) {
      throw new Error(scoreError.message);
    }

    for (const row of scoreRows ?? []) {
      scoreBySpoke.set(row.spoke_id, {
        scoreNow: row.score_now,
        target1y: row.target_1y,
        target5y: row.target_5y,
      });
    }
  }

  const thisMonth = monthStart(now);
  const summaries: DashboardWheel[] = [];

  for (const type of wheelOrder) {
    const wheel = wheels.find((row) => row.type === type);
    if (!wheel) {
      continue;
    }
    const meta = wheelMeta[type];
    const spokes = (spokeRows ?? []).filter((spoke) => spoke.wheel_id === wheel.id);
    const latest = latestCycleByWheel.get(wheel.id) ?? null;
    const axes: WheelRadarAxis[] = latest
      ? spokes.map((spoke) => {
          const score = scoreBySpoke.get(spoke.id);
          return {
            id: spoke.id,
            name: spoke.name,
            today: score?.scoreNow ?? null,
            oneYear: score?.target1y ?? null,
            fiveYears: score?.target5y ?? null,
          };
        })
      : [];

    summaries.push({
      slug: meta.slug,
      title: meta.title,
      spokeCount: spokes.length,
      latestPeriod: latest?.period ?? null,
      ratedThisMonth: latest?.period === thisMonth,
      axes,
    });
  }

  return {
    wheels: summaries,
    planGaps: await loadPlanGaps(supabase, summaries),
  };
}

/**
 * Spokes the member rated at or below LOW_SCORE in their latest cycle with no
 * action plan still Active. A filter over their own ratings, not a new score.
 */
async function loadPlanGaps(supabase: Client, wheels: DashboardWheel[]): Promise<PlanGap[]> {
  const low = wheels.flatMap((wheel) =>
    wheel.axes.flatMap((axis) =>
      axis.today != null && axis.today <= LOW_SCORE
        ? [
            {
              spokeId: axis.id,
              spokeName: axis.name,
              wheelLabel: wheel.slug === "life" ? "Life" : "Business",
              score: axis.today,
            } satisfies PlanGap,
          ]
        : [],
    ),
  );

  if (low.length === 0) {
    return [];
  }

  const { data: focusRows, error: focusError } = await supabase
    .from("focus_areas")
    .select("id, spoke_id")
    .in(
      "spoke_id",
      low.map((item) => item.spokeId),
    );

  if (focusError) {
    throw new Error(focusError.message);
  }

  const focusAreas = focusRows ?? [];
  const plannedSpokes = new Set<string>();

  if (focusAreas.length > 0) {
    const { data: planRows, error: planError } = await supabase
      .from("action_plans")
      .select("focus_area_id")
      .in(
        "focus_area_id",
        focusAreas.map((focus) => focus.id),
      )
      .eq("status", "Active");

    if (planError) {
      throw new Error(planError.message);
    }

    const activeFocusIds = new Set((planRows ?? []).map((row) => row.focus_area_id));
    for (const focus of focusAreas) {
      if (activeFocusIds.has(focus.id)) {
        plannedSpokes.add(focus.spoke_id);
      }
    }
  }

  return low
    .filter((item) => !plannedSpokes.has(item.spokeId))
    .sort((a, b) => a.score - b.score || a.spokeName.localeCompare(b.spokeName))
    .slice(0, CARD_ROW_LIMIT);
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadMemberBoards } from "@/features/boards/load";
import type { Database } from "@/lib/database.types";
import type {
  PlanOption,
  ShareBoardOption,
  TaskItem,
  TaskNote,
  TaskTreeFocus,
  TaskTreeSpoke,
  TaskTreeWheel,
} from "./types";

type Client = SupabaseClient<Database>;

export const TASK_COLUMNS =
  "id, title, description, tag, status, priority, progress, planned_start_on, planned_start_time, target_on, target_time, completed_on, repeat_every, repeat_until, series_id" as const;

type TaskRow = Pick<
  Database["public"]["Tables"]["tasks"]["Row"],
  | "id"
  | "title"
  | "description"
  | "tag"
  | "status"
  | "priority"
  | "progress"
  | "planned_start_on"
  | "planned_start_time"
  | "target_on"
  | "target_time"
  | "completed_on"
  | "repeat_every"
  | "repeat_until"
  | "series_id"
>;

/** Postgres returns 17:30:00; the app works in HH:MM. */
function clockTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

export function mapTaskRow(
  row: TaskRow,
  planIds: string[] = [],
  notes: TaskNote[] = [],
  boardIds: string[] = [],
): TaskItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tag: row.tag,
    status: row.status,
    priority: row.priority,
    progress: row.progress,
    plannedStartOn: row.planned_start_on,
    plannedStartTime: clockTime(row.planned_start_time),
    targetOn: row.target_on,
    targetTime: clockTime(row.target_time),
    completedOn: row.completed_on,
    repeatEvery: row.repeat_every,
    repeatUntil: row.repeat_until,
    seriesId: row.series_id,
    planIds,
    boardIds,
    notes,
  };
}

export type TaskWorkspaceData = {
  tasks: TaskItem[];
  plans: PlanOption[];
  tree: TaskTreeWheel[];
  /** Boards the member can show a task to. */
  boards: ShareBoardOption[];
};

export async function loadTaskWorkspace(
  supabase: Client,
  userId: string,
): Promise<TaskWorkspaceData> {
  const [tasks, structure, boards] = await Promise.all([
    loadTasks(supabase, userId),
    loadWheelStructure(supabase, userId),
    loadMemberBoards(supabase, userId),
  ]);
  return {
    tasks,
    plans: structure.plans,
    tree: structure.tree,
    boards: boards.map((board) => ({ id: board.id, name: board.name })),
  };
}

async function loadTasks(supabase: Client, userId: string): Promise<TaskItem[]> {
  const { data: rows, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const taskIds = (rows ?? []).map((row) => row.id);
  const notesByTask = new Map<string, TaskNote[]>();
  const plansByTask = new Map<string, string[]>();
  const boardsByTask = new Map<string, string[]>();

  if (taskIds.length > 0) {
    const [
      { data: notes, error: notesError },
      { data: links, error: linksError },
      { data: shares, error: sharesError },
    ] =
      await Promise.all([
        supabase
          .from("task_notes")
          .select("id, task_id, note, created_at")
          .in("task_id", taskIds)
          .order("created_at", { ascending: true }),
        supabase
          .from("task_action_plans")
          .select("task_id, action_plan_id")
          .in("task_id", taskIds),
        supabase
          .from("task_board_shares")
          .select("task_id, board_id")
          .in("task_id", taskIds),
      ]);

    if (notesError) {
      throw new Error(notesError.message);
    }
    if (linksError) {
      throw new Error(linksError.message);
    }
    if (sharesError) {
      throw new Error(sharesError.message);
    }

    for (const note of notes ?? []) {
      const list = notesByTask.get(note.task_id) ?? [];
      list.push({
        id: note.id,
        note: note.note,
        createdAt: note.created_at,
      });
      notesByTask.set(note.task_id, list);
    }

    for (const link of links ?? []) {
      const list = plansByTask.get(link.task_id) ?? [];
      list.push(link.action_plan_id);
      plansByTask.set(link.task_id, list);
    }

    for (const share of shares ?? []) {
      const list = boardsByTask.get(share.task_id) ?? [];
      list.push(share.board_id);
      boardsByTask.set(share.task_id, list);
    }
  }

  return (rows ?? []).map((row) =>
    mapTaskRow(
      row,
      plansByTask.get(row.id) ?? [],
      notesByTask.get(row.id) ?? [],
      boardsByTask.get(row.id) ?? [],
    ),
  );
}

async function loadWheelStructure(
  supabase: Client,
  userId: string,
): Promise<{ tree: TaskTreeWheel[]; plans: PlanOption[] }> {
  const { data: wheels, error: wheelError } = await supabase
    .from("wheels")
    .select("id, type")
    .eq("user_id", userId);

  if (wheelError) {
    throw new Error(wheelError.message);
  }

  const wheelIds = (wheels ?? []).map((wheel) => wheel.id);
  if (wheelIds.length === 0) {
    return { tree: [], plans: [] };
  }

  const wheelType = new Map((wheels ?? []).map((wheel) => [wheel.id, wheel.type]));

  const { data: spokes, error: spokeError } = await supabase
    .from("spokes")
    .select("id, name, wheel_id, is_active, sort_order")
    .in("wheel_id", wheelIds)
    .order("sort_order", { ascending: true });

  if (spokeError) {
    throw new Error(spokeError.message);
  }

  const spokeIds = (spokes ?? []).map((spoke) => spoke.id);
  const { data: focuses, error: focusError } =
    spokeIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("focus_areas")
          .select("id, current_issue, spoke_id, sort_order")
          .in("spoke_id", spokeIds)
          .order("sort_order", { ascending: true });

  if (focusError) {
    throw new Error(focusError.message);
  }

  const focusIds = (focuses ?? []).map((focus) => focus.id);
  const { data: plans, error: planError } =
    focusIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("action_plans")
          .select("id, description, focus_area_id")
          .in("focus_area_id", focusIds)
          .order("sort_order", { ascending: true });

  if (planError) {
    throw new Error(planError.message);
  }

  const focusBySpoke = new Map<string, TaskTreeFocus[]>();
  for (const focus of focuses ?? []) {
    const list = focusBySpoke.get(focus.spoke_id) ?? [];
    list.push({ id: focus.id, issue: focus.current_issue });
    focusBySpoke.set(focus.spoke_id, list);
  }

  const spokesByWheel = new Map<string, TaskTreeSpoke[]>();
  for (const spoke of spokes ?? []) {
    const list = spokesByWheel.get(spoke.wheel_id) ?? [];
    list.push({
      id: spoke.id,
      name: spoke.name,
      isActive: spoke.is_active,
      focusAreas: focusBySpoke.get(spoke.id) ?? [],
    });
    spokesByWheel.set(spoke.wheel_id, list);
  }

  const tree: TaskTreeWheel[] = (["WOL", "WOB"] as const).flatMap((type) => {
    const wheel = (wheels ?? []).find((row) => row.type === type);
    return wheel ? [{ type, spokes: spokesByWheel.get(wheel.id) ?? [] }] : [];
  });

  const spokeById = new Map((spokes ?? []).map((spoke) => [spoke.id, spoke]));
  const focusById = new Map((focuses ?? []).map((focus) => [focus.id, focus]));

  const catalog = (plans ?? []).flatMap((plan): PlanOption[] => {
    const focus = focusById.get(plan.focus_area_id);
    const spoke = focus ? spokeById.get(focus.spoke_id) : undefined;
    const type = spoke ? wheelType.get(spoke.wheel_id) : undefined;
    if (!focus || !spoke || !type) {
      return [];
    }
    return [
      {
        id: plan.id,
        description: plan.description,
        spokeName: spoke.name,
        focusIssue: focus.current_issue,
        wheelType: type,
        focusAreaId: focus.id,
      },
    ];
  });

  return { tree, plans: catalog };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { PlanOption, TaskItem, TaskNote } from "./types";

type Client = SupabaseClient<Database>;

export const TASK_COLUMNS =
  "id, title, tag, status, planned_start_on, target_on, completed_on, repeat_every, repeat_until, series_id" as const;

type TaskRow = Pick<
  Database["public"]["Tables"]["tasks"]["Row"],
  | "id"
  | "title"
  | "tag"
  | "status"
  | "planned_start_on"
  | "target_on"
  | "completed_on"
  | "repeat_every"
  | "repeat_until"
  | "series_id"
>;

export function mapTaskRow(
  row: TaskRow,
  planIds: string[] = [],
  notes: TaskNote[] = [],
): TaskItem {
  return {
    id: row.id,
    title: row.title,
    tag: row.tag,
    status: row.status,
    plannedStartOn: row.planned_start_on,
    targetOn: row.target_on,
    completedOn: row.completed_on,
    repeatEvery: row.repeat_every,
    repeatUntil: row.repeat_until,
    seriesId: row.series_id,
    planIds,
    notes,
  };
}

export type TaskWorkspaceData = {
  tasks: TaskItem[];
  plans: PlanOption[];
};

export async function loadTaskWorkspace(
  supabase: Client,
  userId: string,
): Promise<TaskWorkspaceData> {
  const [tasks, plans] = await Promise.all([
    loadTasks(supabase, userId),
    loadPlanCatalog(supabase, userId),
  ]);
  return { tasks, plans };
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

  if (taskIds.length > 0) {
    const [{ data: notes, error: notesError }, { data: links, error: linksError }] =
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
      ]);

    if (notesError) {
      throw new Error(notesError.message);
    }
    if (linksError) {
      throw new Error(linksError.message);
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
  }

  return (rows ?? []).map((row) =>
    mapTaskRow(row, plansByTask.get(row.id) ?? [], notesByTask.get(row.id) ?? []),
  );
}

async function loadPlanCatalog(
  supabase: Client,
  userId: string,
): Promise<PlanOption[]> {
  const { data: wheels, error: wheelError } = await supabase
    .from("wheels")
    .select("id, type")
    .eq("user_id", userId);

  if (wheelError) {
    throw new Error(wheelError.message);
  }

  const wheelIds = (wheels ?? []).map((wheel) => wheel.id);
  if (wheelIds.length === 0) {
    return [];
  }

  const wheelType = new Map((wheels ?? []).map((wheel) => [wheel.id, wheel.type]));

  const { data: spokes, error: spokeError } = await supabase
    .from("spokes")
    .select("id, name, wheel_id")
    .in("wheel_id", wheelIds);

  if (spokeError) {
    throw new Error(spokeError.message);
  }

  const spokeIds = (spokes ?? []).map((spoke) => spoke.id);
  if (spokeIds.length === 0) {
    return [];
  }

  const spokeById = new Map(
    (spokes ?? []).map((spoke) => [
      spoke.id,
      { name: spoke.name, wheelId: spoke.wheel_id },
    ]),
  );

  const { data: focuses, error: focusError } = await supabase
    .from("focus_areas")
    .select("id, current_issue, spoke_id")
    .in("spoke_id", spokeIds);

  if (focusError) {
    throw new Error(focusError.message);
  }

  const focusIds = (focuses ?? []).map((focus) => focus.id);
  if (focusIds.length === 0) {
    return [];
  }

  const focusById = new Map(
    (focuses ?? []).map((focus) => [
      focus.id,
      { issue: focus.current_issue, spokeId: focus.spoke_id },
    ]),
  );

  const { data: plans, error: planError } = await supabase
    .from("action_plans")
    .select("id, description, focus_area_id")
    .in("focus_area_id", focusIds)
    .order("sort_order", { ascending: true });

  if (planError) {
    throw new Error(planError.message);
  }

  return (plans ?? []).flatMap((plan) => {
    const focus = focusById.get(plan.focus_area_id);
    if (!focus) {
      return [];
    }
    const spoke = spokeById.get(focus.spokeId);
    if (!spoke) {
      return [];
    }
    const type = wheelType.get(spoke.wheelId);
    if (!type) {
      return [];
    }
    return [
      {
        id: plan.id,
        description: plan.description,
        spokeName: spoke.name,
        focusIssue: focus.issue,
        wheelType: type,
      },
    ];
  });
}

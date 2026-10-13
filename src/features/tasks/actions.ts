"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import { TASK_COLUMNS, mapTaskRow } from "./load";
import { OPEN_STATUSES, type TaskItem, type TaskNote } from "./types";
import {
  addTaskNoteSchema,
  createTaskSchema,
  deleteTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateTaskTargetSchema,
} from "./schema";

type TaskInsert = Omit<Database["public"]["Tables"]["tasks"]["Insert"], "completed_on">;
type TaskUpdate = Omit<Database["public"]["Tables"]["tasks"]["Update"], "completed_on">;

export type TaskActionResult =
  | { error: string }
  | { ok: true; task: TaskItem; spawned?: TaskItem };
export type NoteActionResult = { error: string } | { ok: true; note: TaskNote };

function writeError(message: string | undefined, fallback: string) {
  if (!message) {
    return fallback;
  }
  if (message.includes("tasks_repeat_needs_target")) {
    return "A repeating task needs a finish-by date.";
  }
  return message;
}

function emptyToNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  return value;
}

function refreshTasks() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

/** What the member writes and chooses about the task itself. */
function contentFields(data: {
  title: string;
  description?: string | null;
  tag?: TaskItem["tag"];
  status: TaskItem["status"];
  priority?: TaskItem["priority"];
  plannedStartOn?: string | null;
  plannedStartTime?: string | null;
  targetOn?: string | null;
  targetTime?: string | null;
}) {
  const plannedStartOn = emptyToNull(data.plannedStartOn);
  const targetOn = emptyToNull(data.targetOn);
  return {
    title: data.title,
    description: emptyToNull(data.description),
    tag: data.tag ?? null,
    status: data.status,
    priority: data.priority ?? "flexi",
    planned_start_on: plannedStartOn,
    // A time belongs to its day; with no day there is no time.
    planned_start_time: plannedStartOn ? emptyToNull(data.plannedStartTime) : null,
    target_on: targetOn,
    target_time: targetOn ? emptyToNull(data.targetTime) : null,
  };
}

function repeatFields(data: {
  repeatEvery?: TaskItem["repeatEvery"];
  repeatUntil?: string | null;
}) {
  const repeatEvery = data.repeatEvery ?? null;
  return {
    repeat_every: repeatEvery,
    repeat_until: repeatEvery ? emptyToNull(data.repeatUntil) : null,
  };
}

async function loadTaskNotes(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  taskId: string,
): Promise<{ error: string } | { notes: TaskNote[] }> {
  const { data, error } = await supabase
    .from("task_notes")
    .select("id, note, created_at")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (error) {
    return { error: error.message };
  }
  return {
    notes: (data ?? []).map((note) => ({
      id: note.id,
      note: note.note,
      createdAt: note.created_at,
    })),
  };
}

async function loadSpawnedOccurrence(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  seriesId: string,
  completedId: string,
  planIds: string[],
): Promise<TaskItem | undefined> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_COLUMNS)
    .eq("series_id", seriesId)
    .neq("id", completedId)
    .in("status", OPEN_STATUSES)
    .maybeSingle();

  if (error || !data) {
    return undefined;
  }
  return mapTaskRow(data, planIds, []);
}

async function assertOwnedPlans(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  planIds: string[],
): Promise<{ error: string } | { ids: string[] }> {
  const unique = [...new Set(planIds)];
  if (unique.length === 0) {
    return { ids: unique };
  }

  const { data, error } = await supabase
    .from("action_plans")
    .select("id")
    .in("id", unique);

  if (error) {
    return { error: error.message };
  }
  if ((data?.length ?? 0) !== unique.length) {
    return { error: "One of those action plans could not be linked." };
  }
  return { ids: unique };
}

async function replacePlanLinks(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  taskId: string,
  planIds: string[],
): Promise<{ error: string } | { ok: true }> {
  const owned = await assertOwnedPlans(supabase, planIds);
  if ("error" in owned) {
    return owned;
  }

  const { error: clearError } = await supabase
    .from("task_action_plans")
    .delete()
    .eq("task_id", taskId);

  if (clearError) {
    return { error: clearError.message };
  }

  if (owned.ids.length === 0) {
    return { ok: true as const };
  }

  const { error: insertError } = await supabase.from("task_action_plans").insert(
    owned.ids.map((action_plan_id) => ({
      task_id: taskId,
      action_plan_id,
    })),
  );

  if (insertError) {
    return { error: insertError.message };
  }
  return { ok: true as const };
}

export async function createTask(input: unknown): Promise<TaskActionResult> {
  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the task and try again." };
  }

  const { supabase, user } = await requireUser();
  const row = {
    user_id: user.id,
    ...contentFields(parsed.data),
    ...repeatFields(parsed.data),
  } satisfies TaskInsert;
  const { data, error } = await supabase
    .from("tasks")
    .insert(row)
    .select(TASK_COLUMNS)
    .single();

  if (error || !data) {
    return { error: writeError(error?.message, "The task could not be added.") };
  }

  const links = await replacePlanLinks(supabase, data.id, parsed.data.planIds ?? []);
  if ("error" in links) {
    return { error: links.error };
  }

  refreshTasks();
  return {
    ok: true,
    task: mapTaskRow(data, parsed.data.planIds ?? [], []),
  };
}

export async function updateTask(input: unknown): Promise<TaskActionResult> {
  const parsed = updateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the task and try again." };
  }

  const { supabase } = await requireUser();
  const row = {
    ...contentFields(parsed.data),
    ...repeatFields(parsed.data),
  } satisfies TaskUpdate;
  const { data, error } = await supabase
    .from("tasks")
    .update(row)
    .eq("id", parsed.data.id)
    .select(TASK_COLUMNS)
    .single();

  if (error || !data) {
    return { error: writeError(error?.message, "The task could not be saved.") };
  }

  const links = await replacePlanLinks(supabase, data.id, parsed.data.planIds ?? []);
  if ("error" in links) {
    return { error: links.error };
  }

  const notes = await loadTaskNotes(supabase, data.id);
  if ("error" in notes) {
    return { error: notes.error };
  }

  refreshTasks();
  return {
    ok: true,
    task: mapTaskRow(data, parsed.data.planIds ?? [], notes.notes),
  };
}

export async function updateTaskStatus(input: unknown): Promise<TaskActionResult> {
  const parsed = updateTaskStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "The status could not be saved." };
  }

  const { supabase } = await requireUser();
  const row = {
    status: parsed.data.status,
  } satisfies TaskUpdate;
  const { data, error } = await supabase
    .from("tasks")
    .update(row)
    .eq("id", parsed.data.id)
    .select(TASK_COLUMNS)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The status could not be saved." };
  }

  const [{ data: notes }, { data: links }] = await Promise.all([
    supabase
      .from("task_notes")
      .select("id, note, created_at")
      .eq("task_id", data.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("task_action_plans")
      .select("action_plan_id")
      .eq("task_id", data.id),
  ]);

  const planIds = (links ?? []).map((link) => link.action_plan_id);
  const task = mapTaskRow(
    data,
    planIds,
    (notes ?? []).map((note) => ({
      id: note.id,
      note: note.note,
      createdAt: note.created_at,
    })),
  );

  const spawned =
    task.status === "Completed" && task.repeatEvery
      ? await loadSpawnedOccurrence(supabase, task.seriesId, task.id, planIds)
      : undefined;

  refreshTasks();
  return { ok: true, task, spawned };
}

/** Moves a task to another finish-by day. Nothing else about it changes. */
export async function updateTaskTarget(input: unknown): Promise<TaskActionResult> {
  const parsed = updateTaskTargetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "The day could not be saved." };
  }

  const { supabase } = await requireUser();
  const row = { target_on: parsed.data.targetOn } satisfies TaskUpdate;
  const { data, error } = await supabase
    .from("tasks")
    .update(row)
    .eq("id", parsed.data.id)
    .select(TASK_COLUMNS)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The day could not be saved." };
  }

  const [{ data: notes }, { data: links }] = await Promise.all([
    supabase
      .from("task_notes")
      .select("id, note, created_at")
      .eq("task_id", data.id)
      .order("created_at", { ascending: true }),
    supabase.from("task_action_plans").select("action_plan_id").eq("task_id", data.id),
  ]);

  refreshTasks();
  return {
    ok: true,
    task: mapTaskRow(
      data,
      (links ?? []).map((link) => link.action_plan_id),
      (notes ?? []).map((note) => ({
        id: note.id,
        note: note.note,
        createdAt: note.created_at,
      })),
    ),
  };
}

export type TaskDeleteResult = { error: string } | { ok: true };

/**
 * Deletes one task. Its notes and plan links go with it. A repeating task
 * stops here: occurrences are made when one is completed, so none is waiting.
 */
export async function deleteTask(input: unknown): Promise<TaskDeleteResult> {
  const parsed = deleteTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That task could not be found." };
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.data.id)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "That task is already gone. Refresh the page to see the current list." };
  }

  refreshTasks();
  return { ok: true };
}

export async function addTaskNote(input: unknown): Promise<NoteActionResult> {
  const parsed = addTaskNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write a note." };
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("task_notes")
    .insert({
      task_id: parsed.data.taskId,
      note: parsed.data.note,
    })
    .select("id, note, created_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The note could not be added." };
  }

  refreshTasks();
  return {
    ok: true,
    note: {
      id: data.id,
      note: data.note,
      createdAt: data.created_at,
    },
  };
}

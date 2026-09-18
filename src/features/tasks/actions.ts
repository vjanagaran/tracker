"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import { TASK_COLUMNS, mapTaskRow } from "./load";
import { OPEN_STATUSES, type TaskItem, type TaskNote } from "./types";
import {
  addTaskNoteSchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
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
    title: parsed.data.title,
    tag: parsed.data.tag ?? null,
    status: parsed.data.status,
    planned_start_on: emptyToNull(parsed.data.plannedStartOn),
    target_on: emptyToNull(parsed.data.targetOn),
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
    title: parsed.data.title,
    tag: parsed.data.tag ?? null,
    status: parsed.data.status,
    planned_start_on: emptyToNull(parsed.data.plannedStartOn),
    target_on: emptyToNull(parsed.data.targetOn),
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

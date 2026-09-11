"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import {
  addSpokeSchema,
  createCycleSchema,
  renameSpokeSchema,
  reorderSpokesSchema,
  saveScoresSchema,
  spokeIdSchema,
} from "./schema";

export type WheelActionResult = { error: string } | { ok: true; cycleId?: string };

function wheelPath(slug: "life" | "business") {
  return `/wheel/${slug}`;
}

function postgresMessage(error: { message: string; code?: string }) {
  if (error.code === "23505") {
    return "A cycle for that month already exists. Open it from the picker.";
  }
  return error.message;
}

export async function saveScores(input: unknown): Promise<WheelActionResult> {
  const parsed = saveScoresSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the scores and try again." };
  }

  const { supabase } = await requireUser();
  const rows = parsed.data.scores.map((score) => ({
    cycle_id: parsed.data.cycleId,
    spoke_id: score.spokeId,
    score_now: score.scoreNow,
    target_1y: score.target1y,
    target_5y: score.target5y,
  }));

  const { error } = await supabase.from("spoke_scores").upsert(rows, {
    onConflict: "cycle_id,spoke_id",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wheel/life");
  revalidatePath("/wheel/business");
  return { ok: true };
}

export async function createCycle(input: unknown): Promise<WheelActionResult> {
  const parsed = createCycleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the month and try again." };
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("create_wheel_cycle", {
    p_wheel_id: parsed.data.wheelId,
    p_period: parsed.data.period,
  });

  if (error) {
    return { error: postgresMessage(error) };
  }

  revalidatePath(wheelPath(parsed.data.slug));
  revalidatePath(`${wheelPath(parsed.data.slug)}/cycles`);
  return { ok: true, cycleId: data };
}

export async function addSpoke(input: unknown): Promise<WheelActionResult> {
  const parsed = addSpokeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Name the spoke and try again." };
  }

  const { supabase } = await requireUser();
  const { data: existing, error: listError } = await supabase
    .from("spokes")
    .select("sort_order")
    .eq("wheel_id", parsed.data.wheelId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (listError) {
    return { error: listError.message };
  }

  const nextOrder = (existing[0]?.sort_order ?? 0) + 1;
  const { error } = await supabase.from("spokes").insert({
    wheel_id: parsed.data.wheelId,
    name: parsed.data.name,
    sort_order: nextOrder,
    is_predefined: false,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wheel/business");
  return { ok: true };
}

export async function renameSpoke(input: unknown): Promise<WheelActionResult> {
  const parsed = renameSpokeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a spoke name." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("spokes")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.spokeId)
    .eq("is_predefined", false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wheel/business");
  return { ok: true };
}

export async function reorderSpokes(input: unknown): Promise<WheelActionResult> {
  const parsed = reorderSpokesSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not reorder spokes." };
  }

  const { supabase } = await requireUser();
  const updates = parsed.data.orderedIds.map((id, index) =>
    supabase
      .from("spokes")
      .update({ sort_order: index + 1 })
      .eq("id", id)
      .eq("wheel_id", parsed.data.wheelId)
      .eq("is_predefined", false),
  );

  const results = await Promise.all(updates);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  revalidatePath("/wheel/business");
  return { ok: true };
}

export async function disableSpoke(input: unknown): Promise<WheelActionResult> {
  const parsed = spokeIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That spoke could not be updated." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("spokes")
    .update({ is_active: false })
    .eq("id", parsed.data.spokeId)
    .eq("is_predefined", false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wheel/business");
  return { ok: true };
}

export async function enableSpoke(input: unknown): Promise<WheelActionResult> {
  const parsed = spokeIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That spoke could not be updated." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("spokes")
    .update({ is_active: true })
    .eq("id", parsed.data.spokeId)
    .eq("is_predefined", false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wheel/business");
  return { ok: true };
}

/** Tries a delete so the trigger message is shown, never swallowed. */
export async function deleteSpoke(input: unknown): Promise<WheelActionResult> {
  const parsed = spokeIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That spoke could not be removed." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("spokes")
    .delete()
    .eq("id", parsed.data.spokeId)
    .eq("is_predefined", false);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/wheel/business");
  return { ok: true };
}

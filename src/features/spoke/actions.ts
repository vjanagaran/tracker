"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import type { ActionPlan } from "./types";
import {
  addActionPlanSchema,
  addFocusAreaSchema,
  idSchema,
  updateActionPlanSchema,
  updateFocusAreaSchema,
} from "./schema";

export type SpokeActionResult = { error: string } | { ok: true };
export type AddActionPlanResult = { error: string } | { ok: true; plan: ActionPlan };

function refreshSpoke() {
  revalidatePath("/spoke", "layout");
  revalidatePath("/wheel/life");
  revalidatePath("/wheel/business");
}

export async function addFocusArea(input: unknown): Promise<SpokeActionResult> {
  const parsed = addFocusAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the focus area and try again." };
  }

  const { supabase } = await requireUser();
  const { data: last, error: listError } = await supabase
    .from("focus_areas")
    .select("sort_order")
    .eq("spoke_id", parsed.data.spokeId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (listError) {
    return { error: listError.message };
  }

  const { error } = await supabase.from("focus_areas").insert({
    spoke_id: parsed.data.spokeId,
    current_issue: parsed.data.currentIssue,
    goal_1y: parsed.data.goal1y ? parsed.data.goal1y : null,
    goal_5y: parsed.data.goal5y ? parsed.data.goal5y : null,
    sort_order: (last?.[0]?.sort_order ?? 0) + 1,
  });

  if (error) {
    return { error: error.message };
  }

  refreshSpoke();
  return { ok: true };
}

export async function updateFocusArea(input: unknown): Promise<SpokeActionResult> {
  const parsed = updateFocusAreaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the focus area and try again." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("focus_areas")
    .update({
      current_issue: parsed.data.currentIssue,
      goal_1y: parsed.data.goal1y ? parsed.data.goal1y : null,
      goal_5y: parsed.data.goal5y ? parsed.data.goal5y : null,
    })
    .eq("id", parsed.data.focusAreaId);

  if (error) {
    return { error: error.message };
  }

  refreshSpoke();
  return { ok: true };
}

export async function addActionPlan(input: unknown): Promise<AddActionPlanResult> {
  const parsed = addActionPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the action plan and try again." };
  }

  const { supabase } = await requireUser();
  const { data: last, error: listError } = await supabase
    .from("action_plans")
    .select("sort_order")
    .eq("focus_area_id", parsed.data.focusAreaId)
    .order("sort_order", { ascending: false })
    .limit(1);

  if (listError) {
    return { error: listError.message };
  }

  const { data, error } = await supabase
    .from("action_plans")
    .insert({
      focus_area_id: parsed.data.focusAreaId,
      description: parsed.data.description,
      challenge: parsed.data.challenge ? parsed.data.challenge : null,
      status: "Active",
      sort_order: (last?.[0]?.sort_order ?? 0) + 1,
    })
    .select("id, description, challenge, status, sort_order")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The action plan could not be added." };
  }

  refreshSpoke();
  return {
    ok: true,
    plan: {
      id: data.id,
      description: data.description,
      challenge: data.challenge,
      status: data.status,
      sortOrder: data.sort_order,
    },
  };
}

export async function updateActionPlan(input: unknown): Promise<SpokeActionResult> {
  const parsed = updateActionPlanSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the action plan and try again." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("action_plans")
    .update({
      description: parsed.data.description,
      challenge: parsed.data.challenge ? parsed.data.challenge : null,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.planId);

  if (error) {
    return { error: error.message };
  }

  refreshSpoke();
  return { ok: true };
}

export async function removeFocusArea(input: unknown): Promise<SpokeActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That focus area could not be removed." };
  }

  const { supabase } = await requireUser();
  const { count, error: countError } = await supabase
    .from("action_plans")
    .select("id", { count: "exact", head: true })
    .eq("focus_area_id", parsed.data.id);

  if (countError) {
    return { error: countError.message };
  }
  if ((count ?? 0) > 0) {
    return { error: "This focus area has action plans. Remove those first." };
  }

  const { error } = await supabase.from("focus_areas").delete().eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  refreshSpoke();
  return { ok: true };
}

export async function removeActionPlan(input: unknown): Promise<SpokeActionResult> {
  const parsed = idSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That action plan could not be removed." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.from("action_plans").delete().eq("id", parsed.data.id);

  if (error) {
    return { error: error.message };
  }

  refreshSpoke();
  return { ok: true };
}

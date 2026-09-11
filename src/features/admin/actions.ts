"use server";

import { revalidatePath } from "next/cache";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import {
  addExistingMemberSchema,
  createBoardSchema,
  removeMemberSchema,
  updateMemberSchema,
} from "./schema";

export type AdminActionResult = { error: string } | { ok: true };

const LAST_CHAIRMAN_MESSAGE =
  "This board needs a chairman. Give the role to someone else first.";

async function otherActiveChairmen(
  supabase: Awaited<ReturnType<typeof requireSuperadmin>>["supabase"],
  boardId: string,
  membershipId: string,
) {
  return supabase
    .from("board_members")
    .select("id", { count: "exact", head: true })
    .eq("board_id", boardId)
    .eq("role", "chairman")
    .eq("status", "active")
    .neq("id", membershipId);
}

function refreshAdmin(boardId?: string) {
  revalidatePath("/admin/boards");
  if (boardId) {
    revalidatePath(`/admin/boards/${boardId}`);
    revalidatePath(`/boards/${boardId}`);
  }
  revalidatePath("/boards");
}

export async function createBoard(input: unknown): Promise<AdminActionResult> {
  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the board and try again." };
  }

  const { supabase, user } = await requireSuperadmin();
  const weekday =
    parsed.data.meetingWeekday === "" ? null : parsed.data.meetingWeekday;

  const { error } = await supabase.from("boards").insert({
    name: parsed.data.name,
    description: parsed.data.description ? parsed.data.description : null,
    cadence_days: parsed.data.cadenceDays,
    meeting_weekday: weekday,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  refreshAdmin();
  return { ok: true };
}

export async function updateMember(input: unknown): Promise<AdminActionResult> {
  const parsed = updateMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the member and try again." };
  }

  const { supabase } = await requireSuperadmin();
  const { data: membership, error: membershipError } = await supabase
    .from("board_members")
    .select("id, role, status")
    .eq("id", parsed.data.membershipId)
    .eq("board_id", parsed.data.boardId)
    .maybeSingle();

  if (membershipError) {
    return { error: membershipError.message };
  }
  if (!membership) {
    return { error: "That member could not be found." };
  }

  const losingChair =
    membership.role === "chairman" &&
    membership.status === "active" &&
    (parsed.data.role !== "chairman" || parsed.data.status !== "active");

  if (losingChair) {
    const { count, error: countError } = await otherActiveChairmen(
      supabase,
      parsed.data.boardId,
      parsed.data.membershipId,
    );
    if (countError) {
      return { error: countError.message };
    }
    if ((count ?? 0) === 0) {
      return { error: LAST_CHAIRMAN_MESSAGE };
    }
  }

  const leftOn =
    parsed.data.status === "inactive"
      ? new Date().toISOString().slice(0, 10)
      : null;

  const { error } = await supabase
    .from("board_members")
    .update({
      role: parsed.data.role,
      status: parsed.data.status,
      left_on: leftOn,
    })
    .eq("id", parsed.data.membershipId)
    .eq("board_id", parsed.data.boardId);

  if (error) {
    return { error: error.message };
  }

  refreshAdmin(parsed.data.boardId);
  return { ok: true };
}

export async function addExistingMember(input: unknown): Promise<AdminActionResult> {
  const parsed = addExistingMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Choose a person and try again." };
  }

  const { supabase } = await requireSuperadmin();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", parsed.data.profileId)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }
  if (!profile) {
    return { error: "That person could not be found." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("board_members")
    .select("id, status")
    .eq("board_id", parsed.data.boardId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  if (existing?.status === "active") {
    return { error: "That person is already on this board." };
  }

  if (existing) {
    const { error } = await supabase
      .from("board_members")
      .update({
        role: parsed.data.role,
        status: "active",
        left_on: null,
        joined_on: new Date().toISOString().slice(0, 10),
      })
      .eq("id", existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from("board_members").insert({
      board_id: parsed.data.boardId,
      user_id: profile.id,
      role: parsed.data.role,
      status: "active",
    });

    if (error) {
      return { error: error.message };
    }
  }

  refreshAdmin(parsed.data.boardId);
  return { ok: true };
}

export async function removeMember(input: unknown): Promise<AdminActionResult> {
  const parsed = removeMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the member and try again." };
  }

  const { supabase } = await requireSuperadmin();
  const { data: membership, error: membershipError } = await supabase
    .from("board_members")
    .select("id, role, status")
    .eq("id", parsed.data.membershipId)
    .eq("board_id", parsed.data.boardId)
    .maybeSingle();

  if (membershipError) {
    return { error: membershipError.message };
  }
  if (!membership) {
    return { error: "That member could not be found." };
  }

  if (membership.role === "chairman" && membership.status === "active") {
    const { count, error: countError } = await otherActiveChairmen(
      supabase,
      parsed.data.boardId,
      parsed.data.membershipId,
    );

    if (countError) {
      return { error: countError.message };
    }
    if ((count ?? 0) === 0) {
      return { error: LAST_CHAIRMAN_MESSAGE };
    }
  }

  const { error } = await supabase
    .from("board_members")
    .delete()
    .eq("id", parsed.data.membershipId)
    .eq("board_id", parsed.data.boardId);

  if (error) {
    return { error: error.message };
  }

  refreshAdmin(parsed.data.boardId);
  return { ok: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { addMeetingSchema, moveMeetingSchema, updateAgendaSchema } from "./schema";
import { toTimestamptz } from "./labels";

export type BoardActionResult = { error: string } | { ok: true };

async function assertChairman(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  boardId: string,
): Promise<BoardActionResult | { ok: true }> {
  const { data, error } = await supabase
    .from("board_members")
    .select("role")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (data?.role !== "chairman") {
    return { error: "Only the chairman can change the meeting calendar." };
  }
  return { ok: true };
}

function refreshBoard(boardId: string) {
  revalidatePath("/boards");
  revalidatePath(`/boards/${boardId}`);
}

export async function addMeeting(input: unknown): Promise<BoardActionResult> {
  const parsed = addMeetingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the meeting and try again." };
  }

  const { supabase, user } = await requireUser();
  const allowed = await assertChairman(supabase, user.id, parsed.data.boardId);
  if ("error" in allowed) {
    return allowed;
  }

  const { error } = await supabase.from("meetings").insert({
    board_id: parsed.data.boardId,
    scheduled_at: toTimestamptz(parsed.data.scheduledAt),
    agenda: parsed.data.agenda ? parsed.data.agenda : null,
    notes: parsed.data.notes ? parsed.data.notes : null,
    status: "Scheduled",
  });

  if (error) {
    return { error: error.message };
  }

  refreshBoard(parsed.data.boardId);
  return { ok: true };
}

export async function moveMeeting(input: unknown): Promise<BoardActionResult> {
  const parsed = moveMeetingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the new time and try again." };
  }

  const { supabase, user } = await requireUser();
  const allowed = await assertChairman(supabase, user.id, parsed.data.boardId);
  if ("error" in allowed) {
    return allowed;
  }

  const { error } = await supabase
    .from("meetings")
    .update({ scheduled_at: toTimestamptz(parsed.data.scheduledAt) })
    .eq("id", parsed.data.meetingId)
    .eq("board_id", parsed.data.boardId);

  if (error) {
    return { error: error.message };
  }

  refreshBoard(parsed.data.boardId);
  return { ok: true };
}

export async function updateAgenda(input: unknown): Promise<BoardActionResult> {
  const parsed = updateAgendaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the agenda and try again." };
  }

  const { supabase, user } = await requireUser();
  const allowed = await assertChairman(supabase, user.id, parsed.data.boardId);
  if ("error" in allowed) {
    return allowed;
  }

  const { error } = await supabase
    .from("meetings")
    .update({ agenda: parsed.data.agenda ? parsed.data.agenda : null })
    .eq("id", parsed.data.meetingId)
    .eq("board_id", parsed.data.boardId);

  if (error) {
    return { error: error.message };
  }

  refreshBoard(parsed.data.boardId);
  return { ok: true };
}

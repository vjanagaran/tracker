import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { rpcTimestamp, windowLabel } from "./labels";
import type { BoardDashboard, BoardMeeting, MemberBoard, VelocityRow } from "./types";

type Client = SupabaseClient<Database>;

export async function loadMemberBoards(
  supabase: Client,
  userId: string,
): Promise<MemberBoard[]> {
  const { data, error } = await supabase
    .from("board_members")
    .select(
      "role, joined_on, boards(id, name, description, cadence_days, meeting_weekday)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_on", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).flatMap((row) => {
    const board = row.boards;
    if (!board) {
      return [];
    }
    return [
      {
        id: board.id,
        name: board.name,
        description: board.description,
        cadenceDays: board.cadence_days,
        meetingWeekday: board.meeting_weekday,
        role: row.role,
      } satisfies MemberBoard,
    ];
  });
}

export async function loadBoardDashboard(
  supabase: Client,
  userId: string,
  boardId: string,
  meetingId?: string,
): Promise<BoardDashboard | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("board_members")
    .select("role, status, boards(id, name, description, cadence_days, meeting_weekday)")
    .eq("board_id", boardId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }
  if (!membership?.boards) {
    return null;
  }

  const board: MemberBoard = {
    id: membership.boards.id,
    name: membership.boards.name,
    description: membership.boards.description,
    cadenceDays: membership.boards.cadence_days,
    meetingWeekday: membership.boards.meeting_weekday,
    role: membership.role,
  };

  const { data: meetingRows, error: meetingError } = await supabase
    .from("meetings")
    .select("id, scheduled_at, status, agenda, notes")
    .eq("board_id", boardId)
    .order("scheduled_at", { ascending: true });

  if (meetingError) {
    throw new Error(meetingError.message);
  }

  const meetings: BoardMeeting[] = (meetingRows ?? []).map((row) => ({
    id: row.id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    agenda: row.agenda,
    notes: row.notes,
  }));

  const liveMeetings = meetings.filter((meeting) => meeting.status !== "Cancelled");
  const nowMs = Date.now();
  const upcoming = liveMeetings.filter(
    (meeting) => new Date(meeting.scheduledAt).getTime() >= nowMs,
  );
  const past = liveMeetings.filter((meeting) => new Date(meeting.scheduledAt).getTime() < nowMs);
  const defaultMeeting = upcoming[0] ?? past[past.length - 1] ?? null;
  const selectedMeeting =
    liveMeetings.find((meeting) => meeting.id === meetingId) ?? defaultMeeting;

  let windowFrom: string | null = null;
  let windowTo: string | null = null;
  let velocity: VelocityRow[] = [];

  if (selectedMeeting) {
    const { data: windowRows, error: windowError } = await supabase.rpc(
      "meeting_window",
      { p_meeting_id: selectedMeeting.id },
    );

    if (windowError) {
      if (windowError.message.toLowerCase().includes("not a member")) {
        return null;
      }
      throw new Error(windowError.message);
    }

    const window = windowRows?.[0];
    windowFrom = window?.window_from ?? null;
    windowTo = window?.window_to ?? null;

    if (windowFrom && windowTo) {
      const { data: velocityRows, error: velocityError } = await supabase.rpc(
        "board_velocity",
        {
          p_board_id: boardId,
          p_from: rpcTimestamp(windowFrom),
          p_to: rpcTimestamp(windowTo),
        },
      );

      if (velocityError) {
        if (velocityError.message.toLowerCase().includes("not a member")) {
          return null;
        }
        throw new Error(velocityError.message);
      }

      velocity = (velocityRows ?? []).map((row) => ({
        userId: row.user_id,
        fullName: row.full_name,
        photoUrl: null,
        completedCount: Number(row.completed_count),
        openCount: Number(row.open_count),
      }));

      const memberIds = velocity.map((row) => row.userId);
      if (memberIds.length > 0) {
        const { data: photos, error: photoError } = await supabase
          .from("profiles")
          .select("id, photo_url")
          .in("id", memberIds);

        if (photoError) {
          throw new Error(photoError.message);
        }

        const byId = new Map((photos ?? []).map((row) => [row.id, row.photo_url]));
        velocity = velocity.map((row) => ({
          ...row,
          photoUrl: byId.get(row.userId) ?? null,
        }));
      }
    }
  }

  return {
    board,
    canSchedule: membership.role === "chairman",
    meetings,
    nextMeetingId: upcoming[0]?.id ?? null,
    selectedMeeting,
    windowFrom,
    windowTo,
    windowLabel: windowLabel({
      windowFrom,
      windowTo,
      nextMeetingAt: upcoming[0]?.scheduledAt ?? null,
      viewingNext: selectedMeeting?.id === upcoming[0]?.id,
    }),
    velocity,
  };
}

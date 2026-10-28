import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCompaniesByOwner } from "@/features/companies/load";
import type { Database } from "@/lib/database.types";
import type {
  BoardDashboard,
  BoardGoals,
  BoardMeeting,
  GoalsMember,
  MemberBoard,
  RosterMember,
} from "./types";

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

  const [meetingResult, rosterResult] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, scheduled_at, status, agenda, notes")
      .eq("board_id", boardId)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("board_members")
      .select("user_id, role, profiles(full_name, photo_url, phone, email)")
      .eq("board_id", boardId)
      .eq("status", "active"),
  ]);

  if (meetingResult.error) {
    throw new Error(meetingResult.error.message);
  }
  if (rosterResult.error) {
    throw new Error(rosterResult.error.message);
  }

  const meetings: BoardMeeting[] = (meetingResult.data ?? []).map((row) => ({
    id: row.id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    agenda: row.agenda,
    notes: row.notes,
  }));

  const nowMs = Date.now();
  const upcoming = meetings.filter(
    (meeting) =>
      meeting.status !== "Cancelled" && new Date(meeting.scheduledAt).getTime() >= nowMs,
  );

  const companiesByOwner = await loadCompaniesByOwner(
    supabase,
    (rosterResult.data ?? []).map((row) => row.user_id),
  );

  const members: RosterMember[] = (rosterResult.data ?? [])
    .map((row) => ({
      userId: row.user_id,
      fullName: row.profiles?.full_name ?? "",
      photoUrl: row.profiles?.photo_url ?? null,
      email: row.profiles?.email ?? null,
      phone: row.profiles?.phone ?? null,
      role: row.role,
      companies: (companiesByOwner.get(row.user_id) ?? []).map((company) => ({
        id: company.id,
        name: company.name,
      })),
    }))
    .sort((a, b) => (a.fullName || "Unnamed").localeCompare(b.fullName || "Unnamed"));

  return {
    board,
    canSchedule: membership.role === "chairman",
    meetings,
    nextMeetingId: upcoming[0]?.id ?? null,
    members,
  };
}

/**
 * Everything members of this board have chosen to show it, grouped by member.
 * Reads through board_shared_goals, which returns a fixed set of columns for
 * shared tasks only. Returns null when the caller is not an active member.
 */
export async function loadBoardGoals(
  supabase: Client,
  userId: string,
  boardId: string,
): Promise<BoardGoals | null> {
  const [rosterResult, goalsResult] = await Promise.all([
    supabase
      .from("board_members")
      .select("user_id, profiles(full_name)")
      .eq("board_id", boardId)
      .eq("status", "active"),
    supabase.rpc("board_shared_goals", { p_board_id: boardId }),
  ]);

  if (goalsResult.error) {
    if (goalsResult.error.message.toLowerCase().includes("not a member")) {
      return null;
    }
    throw new Error(goalsResult.error.message);
  }
  if (rosterResult.error) {
    throw new Error(rosterResult.error.message);
  }

  const byUser = new Map<string, GoalsMember>();
  for (const row of rosterResult.data ?? []) {
    byUser.set(row.user_id, {
      userId: row.user_id,
      fullName: row.profiles?.full_name ?? "",
      isYou: row.user_id === userId,
      goals: [],
    });
  }

  for (const row of goalsResult.data ?? []) {
    byUser.get(row.user_id)?.goals.push({
      taskId: row.task_id,
      title: row.title,
      description: row.description,
      spokeNames: row.spoke_names,
      plannedStartOn: row.planned_start_on,
      targetOn: row.target_on,
      status: row.status,
      progress: row.progress,
    });
  }

  const members = [...byUser.values()].sort((a, b) =>
    (a.fullName || "Unnamed").localeCompare(b.fullName || "Unnamed"),
  );
  return { members };
}

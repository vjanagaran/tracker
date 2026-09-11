import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { AdminBoard, AdminBoardDetail, AdminMember } from "./types";

type Client = SupabaseClient<Database>;

async function lookupEmails(ids: string[]): Promise<Map<string, string>> {
  const emails = new Map<string, string>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret || ids.length === 0) {
    return emails;
  }

  const admin = createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await Promise.all(
    ids.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) {
        emails.set(id, data.user.email);
      }
    }),
  );

  return emails;
}

export async function loadAdminBoards(supabase: Client): Promise<AdminBoard[]> {
  const { data: boards, error: boardError } = await supabase
    .from("boards")
    .select("id, name, description, cadence_days, meeting_weekday")
    .order("name", { ascending: true });

  if (boardError) {
    throw new Error(boardError.message);
  }

  const { data: members, error: memberError } = await supabase
    .from("board_members")
    .select("board_id, status");

  if (memberError) {
    throw new Error(memberError.message);
  }

  const counts = new Map<string, number>();
  for (const member of members ?? []) {
    if (member.status !== "active") {
      continue;
    }
    counts.set(member.board_id, (counts.get(member.board_id) ?? 0) + 1);
  }

  return (boards ?? []).map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description,
    cadenceDays: board.cadence_days,
    meetingWeekday: board.meeting_weekday,
    memberCount: counts.get(board.id) ?? 0,
  }));
}

export async function loadAdminBoard(
  supabase: Client,
  boardId: string,
): Promise<AdminBoardDetail | null> {
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, name, description, cadence_days, meeting_weekday")
    .eq("id", boardId)
    .maybeSingle();

  if (boardError) {
    throw new Error(boardError.message);
  }
  if (!board) {
    return null;
  }

  const { data: memberRows, error: memberError } = await supabase
    .from("board_members")
    .select("id, user_id, role, status, joined_on, left_on, profiles(full_name)")
    .eq("board_id", boardId)
    .order("joined_on", { ascending: true });

  if (memberError) {
    throw new Error(memberError.message);
  }

  const members: AdminMember[] = (memberRows ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    fullName: row.profiles?.full_name ?? "",
    role: row.role,
    status: row.status,
    joinedOn: row.joined_on,
    leftOn: row.left_on,
  }));

  const onBoard = new Set(members.map((member) => member.userId));
  const { data: people, error: peopleError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name", { ascending: true });

  if (peopleError) {
    throw new Error(peopleError.message);
  }

  const availablePeople = (people ?? []).filter((person) => !onBoard.has(person.id));
  const emails = await lookupEmails(availablePeople.map((person) => person.id));

  return {
    board: {
      id: board.id,
      name: board.name,
      description: board.description,
      cadenceDays: board.cadence_days,
      meetingWeekday: board.meeting_weekday,
    },
    members,
    availablePeople: availablePeople.map((person) => ({
      id: person.id,
      fullName: person.full_name,
      email: emails.get(person.id) ?? "",
    })),
  };
}

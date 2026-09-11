import type { Enums } from "@/lib/database.types";

export type AdminBoard = {
  id: string;
  name: string;
  description: string | null;
  cadenceDays: number;
  meetingWeekday: number | null;
  memberCount: number;
};

export type AdminMember = {
  id: string;
  userId: string;
  fullName: string;
  role: Enums<"member_role">;
  status: Enums<"member_state">;
  joinedOn: string;
  leftOn: string | null;
};

export type AdminBoardDetail = {
  board: Omit<AdminBoard, "memberCount">;
  members: AdminMember[];
  availablePeople: { id: string; fullName: string; email: string }[];
};

export type InviteActionResult = { error: string } | { ok: true; message: string };

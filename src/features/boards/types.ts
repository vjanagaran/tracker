import type { Enums } from "@/lib/database.types";

export type MemberBoard = {
  id: string;
  name: string;
  description: string | null;
  cadenceDays: number;
  meetingWeekday: number | null;
  role: Enums<"member_role">;
};

export type VelocityRow = {
  userId: string;
  fullName: string;
  completedCount: number;
  openCount: number;
};

export type BoardMeeting = {
  id: string;
  scheduledAt: string;
  status: Enums<"meeting_status">;
  agenda: string | null;
  notes: string | null;
};

export type BoardDashboard = {
  board: MemberBoard;
  canSchedule: boolean;
  meetings: BoardMeeting[];
  nextMeetingId: string | null;
  selectedMeeting: BoardMeeting | null;
  windowFrom: string | null;
  windowTo: string | null;
  windowLabel: string;
  velocity: VelocityRow[];
};

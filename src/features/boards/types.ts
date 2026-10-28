import type { Enums } from "@/lib/database.types";

export type MemberBoard = {
  id: string;
  name: string;
  description: string | null;
  cadenceDays: number;
  meetingWeekday: number | null;
  role: Enums<"member_role">;
};

export type RosterMember = {
  userId: string;
  fullName: string;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  role: Enums<"member_role">;
  /** Companies the member shows to their boards. */
  companies: { id: string; name: string }[];
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
  members: RosterMember[];
};

/** One task a member has chosen to show this board. Nothing else about it is shared. */
export type SharedGoal = {
  taskId: string;
  title: string;
  description: string | null;
  /** Names of the spokes the task works toward; empty when it is not linked to a plan. */
  spokeNames: string | null;
  plannedStartOn: string | null;
  targetOn: string | null;
  status: Enums<"task_status">;
  /** Only for Work in Progress, Hold Now and Postponed; null for every other status. */
  progress: number | null;
};

export type GoalsMember = {
  userId: string;
  fullName: string;
  isYou: boolean;
  goals: SharedGoal[];
};

export type BoardGoals = {
  members: GoalsMember[];
};

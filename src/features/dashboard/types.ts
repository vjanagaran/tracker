import type { NoteListItem } from "@/features/notes/types";
import type { TaskRepeat, TaskTag } from "@/features/tasks/types";
import type { WheelRadarAxis } from "@/features/wheel/radar";
import type { WheelSlug } from "@/features/wheel/types";

export type DashboardTask = {
  id: string;
  title: string;
  tag: TaskTag | null;
  targetOn: string | null;
  repeatEvery: TaskRepeat | null;
};

export type TaskBuckets = {
  overdue: DashboardTask[];
  dueToday: DashboardTask[];
  dueThisWeek: number;
  open: number;
};

export type DashboardTasks = {
  /** Every open task, earliest target first. Bucketed in the member's zone. */
  rows: DashboardTask[];
  /** The server's calendar day, for the first paint only. */
  serverDay: string;
};

/** The next meeting across every board the member sits on. */
export type DashboardMeeting = {
  boardId: string;
  boardName: string;
  scheduledAt: string;
  daysAway: number;
  /** The member's own row from board_velocity — the numbers the board sees. */
  completedCount: number | null;
  openCount: number | null;
  /** Day the review window opened. Null when this is the board's first meeting. */
  since: string | null;
};

export type DashboardWheel = {
  slug: WheelSlug;
  title: string;
  spokeCount: number;
  latestPeriod: string | null;
  ratedThisMonth: boolean;
  axes: WheelRadarAxis[];
};

/** A spoke the member rated low that has no active plan under it. */
export type PlanGap = {
  spokeId: string;
  spokeName: string;
  wheelLabel: string;
  score: number;
};

export type DashboardView = {
  meeting: DashboardMeeting | null;
  boardCount: number;
  tasks: DashboardTasks;
  wheels: DashboardWheel[];
  planGaps: PlanGap[];
  notes: NoteListItem[];
};

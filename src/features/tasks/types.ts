import type { Enums } from "@/lib/database.types";

export type TaskStatus = Enums<"task_status">;
export type TaskTag = Enums<"task_tag">;
export type TaskRepeat = Enums<"task_repeat">;
export type TaskPriority = Enums<"task_priority">;

export const TASK_STATUSES: TaskStatus[] = [
  "Not Started",
  "Work in Progress",
  "Postponed",
  "Hold Now",
  "Completed",
  "Cancelled",
];

export const OPEN_STATUSES: TaskStatus[] = [
  "Not Started",
  "Work in Progress",
  "Postponed",
  "Hold Now",
];

export const CLOSED_STATUSES: TaskStatus[] = ["Completed", "Cancelled"];

export const TASK_TAGS: TaskTag[] = ["WOL", "WOB", "OPEN"];

export const TASK_PRIORITIES: TaskPriority[] = ["high", "medium", "low", "flexi"];

export const TASK_REPEATS: TaskRepeat[] = ["daily", "weekly", "fortnightly", "monthly"];

export type WheelType = Enums<"wheel_type">;

export type PlanOption = {
  id: string;
  description: string;
  spokeName: string;
  focusIssue: string;
  wheelType: WheelType;
  focusAreaId: string;
};

export type TaskTreeFocus = { id: string; issue: string };

export type TaskTreeSpoke = {
  id: string;
  name: string;
  isActive: boolean;
  focusAreas: TaskTreeFocus[];
};

export type TaskTreeWheel = { type: WheelType; spokes: TaskTreeSpoke[] };

export type TaskNote = {
  id: string;
  note: string;
  createdAt: string;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  tag: TaskTag | null;
  status: TaskStatus;
  priority: TaskPriority;
  /** 0 to 100 in steps of 5, set by the member. Read it through effectiveProgress. */
  progress: number;
  plannedStartOn: string | null;
  /** HH:MM, only ever with a planned start day. */
  plannedStartTime: string | null;
  targetOn: string | null;
  /** HH:MM, only ever with a finish-by day. */
  targetTime: string | null;
  /** Read from the database only. Never send this on insert or update. */
  completedOn: string | null;
  repeatEvery: TaskRepeat | null;
  repeatUntil: string | null;
  /** First occurrence's id. The database stamps it; never send on insert. */
  seriesId: string;
  planIds: string[];
  /** Boards the member has chosen to show this task to. Empty means private. */
  boardIds: string[];
  notes: TaskNote[];
};

/** A board the member belongs to, offered as a place to share a task. */
export type ShareBoardOption = { id: string; name: string };

export function isOpenStatus(status: TaskStatus) {
  return OPEN_STATUSES.includes(status);
}

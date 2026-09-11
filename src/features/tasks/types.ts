import type { Enums } from "@/lib/database.types";

export type TaskStatus = Enums<"task_status">;
export type TaskTag = Enums<"task_tag">;

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

export type PlanOption = {
  id: string;
  description: string;
  spokeName: string;
  focusIssue: string;
  wheelType: Enums<"wheel_type">;
};

export type TaskNote = {
  id: string;
  note: string;
  createdAt: string;
};

export type TaskItem = {
  id: string;
  title: string;
  tag: TaskTag | null;
  status: TaskStatus;
  plannedStartOn: string | null;
  targetOn: string | null;
  /** Read from the database only. Never send this on insert or update. */
  completedOn: string | null;
  planIds: string[];
  notes: TaskNote[];
};

export function isOpenStatus(status: TaskStatus) {
  return OPEN_STATUSES.includes(status);
}

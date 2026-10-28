import type { TaskStatus } from "./types.ts";

/** Statuses where the member sets progress themselves. */
export const PROGRESS_EDITABLE: readonly TaskStatus[] = [
  "Work in Progress",
  "Hold Now",
  "Postponed",
];

export const PROGRESS_STEP = 5;

export function canSetProgress(status: TaskStatus) {
  return PROGRESS_EDITABLE.includes(status);
}

/**
 * What a task's progress reads as. Not started is 0 and completed is 100, whatever
 * was last set, so finishing a task and undoing it does not lose the member's number.
 */
export function effectiveProgress(status: TaskStatus, progress: number) {
  if (status === "Not Started") return 0;
  if (status === "Completed") return 100;
  return progress;
}

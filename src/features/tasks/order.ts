import type { TaskItem, TaskPriority } from "./types";

const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2, flexi: 3 };

/**
 * Open tasks in the order they come due: day, then time of day (a task with no
 * time leads its day), then priority, then title. Priority only breaks ties;
 * it never lifts a task over an earlier commitment.
 */
export function compareOpen(
  a: Pick<TaskItem, "targetOn" | "targetTime" | "priority" | "title">,
  b: Pick<TaskItem, "targetOn" | "targetTime" | "priority" | "title">,
) {
  if (a.targetOn && !b.targetOn) return -1;
  if (!a.targetOn && b.targetOn) return 1;
  if (a.targetOn && b.targetOn && a.targetOn !== b.targetOn) {
    return a.targetOn.localeCompare(b.targetOn);
  }
  const aTime = a.targetTime ?? "";
  const bTime = b.targetTime ?? "";
  if (aTime !== bTime) return aTime.localeCompare(bTime);
  const byPriority = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
  if (byPriority !== 0) return byPriority;
  return a.title.localeCompare(b.title);
}

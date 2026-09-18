import { addDays, format, parseISO } from "date-fns";
import type { DashboardTask, TaskBuckets } from "./types";

export function isoDay(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/**
 * Takes the day rather than reading a clock, so the server can render in its
 * own zone and the browser can redo it in the member's. A target date is a
 * calendar day, and which day is "today" only the member's clock can answer.
 */
export function bucketTasks(rows: DashboardTask[], today: string): TaskBuckets {
  const horizon = isoDay(addDays(parseISO(today), 7));

  return {
    overdue: rows.filter((row) => row.targetOn != null && row.targetOn < today),
    dueToday: rows.filter((row) => row.targetOn === today),
    dueThisWeek: rows.filter(
      (row) => row.targetOn != null && row.targetOn > today && row.targetOn <= horizon,
    ).length,
    open: rows.length,
  };
}

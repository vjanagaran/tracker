import { addDays, daysBetween, formatTime } from "./dates.ts";
import { compareOpen } from "./order.ts";
import type { TaskItem } from "./types";

export type DateGroupKey = "overdue" | "today" | "tomorrow" | "upcoming" | "none";

export type DateGroup = {
  key: DateGroupKey;
  label: string;
  tasks: TaskItem[];
};

const GROUP_LABELS: Record<DateGroupKey, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  upcoming: "Upcoming",
  none: "No date",
};

const GROUP_ORDER: DateGroupKey[] = ["overdue", "today", "tomorrow", "upcoming", "none"];

export function dateGroupKey(targetOn: string | null, today: string): DateGroupKey {
  if (!targetOn) return "none";
  if (targetOn < today) return "overdue";
  if (targetOn === today) return "today";
  if (targetOn === addDays(today, 1)) return "tomorrow";
  return "upcoming";
}

/** Open tasks under Overdue, Today, Tomorrow, Upcoming and No date, each sorted by date then title. */
export function groupByDate(tasks: readonly TaskItem[], today: string): DateGroup[] {
  const buckets = new Map<DateGroupKey, TaskItem[]>();
  for (const task of tasks) {
    const key = dateGroupKey(task.targetOn, today);
    const list = buckets.get(key);
    if (list) {
      list.push(task);
    } else {
      buckets.set(key, [task]);
    }
  }
  return GROUP_ORDER.flatMap((key) => {
    const list = buckets.get(key);
    return list ? [{ key, label: GROUP_LABELS[key], tasks: [...list].sort(compareOpen) }] : [];
  });
}

export type DayLabel = {
  /** Always readable on its own, so colour is never the only signal. */
  text: string;
  overdue: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(isoDay: string, withWeekday: boolean, withYear: boolean) {
  const [year, month, day] = isoDay.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const base = `${day} ${MONTHS[month - 1]}`;
  return `${withWeekday ? `${weekday} ` : ""}${base}${withYear ? ` ${year}` : ""}`;
}

export function weekdayHeading(isoDay: string) {
  return shortDate(isoDay, true, false);
}

/**
 * How a finish-by date reads on a row. Open tasks get "Today", "Tomorrow" and
 * "3 days overdue"; closed ones keep a plain date.
 */
export function relativeDay(targetOn: string | null, today: string, open: boolean): DayLabel {
  if (!targetOn) {
    return { text: "No date", overdue: false };
  }
  const sameYear = targetOn.slice(0, 4) === today.slice(0, 4);
  if (!open) {
    return { text: shortDate(targetOn, false, !sameYear), overdue: false };
  }
  const diff = daysBetween(today, targetOn);
  if (diff === 0) return { text: "Today", overdue: false };
  if (diff === 1) return { text: "Tomorrow", overdue: false };
  if (diff === -1) return { text: "1 day overdue", overdue: true };
  if (diff < -1) return { text: `${-diff} days overdue`, overdue: true };
  return { text: shortDate(targetOn, diff <= 6, !sameYear), overdue: false };
}

/**
 * The planned start, as a quiet fragment on a row: "Starts tomorrow",
 * "Starts Fri 16 Oct", "Started 12 Oct". Null when there is none, or once the
 * task is closed, so the row only carries what still helps.
 */
export function startLabel(
  plannedStartOn: string | null,
  today: string,
  open: boolean,
  plannedStartTime: string | null = null,
): string | null {
  if (!plannedStartOn || !open) {
    return null;
  }
  const diff = daysBetween(today, plannedStartOn);
  const sameYear = plannedStartOn.slice(0, 4) === today.slice(0, 4);
  // A time only matters while the start is still ahead.
  const at = plannedStartTime ? ` at ${formatTime(plannedStartTime)}` : "";
  if (diff === 0) return `Starts today${at}`;
  if (diff === 1) return `Starts tomorrow${at}`;
  if (diff === -1) return "Started yesterday";
  if (diff > 1) return `Starts ${shortDate(plannedStartOn, diff <= 6, !sameYear)}${at}`;
  return `Started ${shortDate(plannedStartOn, false, !sameYear)}`;
}

import { format, parseISO } from "date-fns";

/** A spoke at or below this is surfaced if nothing is planned against it. */
export const LOW_SCORE = 4;

export const RECENT_NOTE_COUNT = 3;

/** Longest list shown in a card before it defers to the full screen. */
export const CARD_ROW_LIMIT = 4;

export function monthStart(date: Date) {
  return format(date, "yyyy-MM-01");
}

export function formatPeriod(period: string) {
  return format(parseISO(period), "MMMM yyyy");
}

export function daysAwayLabel(days: number) {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

export function overdueLabel(count: number) {
  return count === 1 ? "1 overdue" : `${count} overdue`;
}

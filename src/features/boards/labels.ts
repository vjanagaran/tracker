import { format, parseISO } from "date-fns";
import type { BoardMeeting } from "./types";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function weekdayName(weekday: number | null) {
  if (weekday == null || weekday < 0 || weekday > 6) {
    return null;
  }
  return WEEKDAYS[weekday];
}

export function cadenceLabel(cadenceDays: number, weekday: number | null) {
  const day = weekdayName(weekday);
  if (cadenceDays === 15 && weekday === 4) {
    return "Alternate Thursdays";
  }
  if (day) {
    return `Every ${cadenceDays} days · ${day}s`;
  }
  return `Every ${cadenceDays} days`;
}

export function formatMeetingWhen(value: string) {
  return format(parseISO(value), "EEE d MMM yyyy, h:mm a");
}

export function formatWindowDay(value: string) {
  if (isInfiniteTimestamp(value)) {
    return null;
  }
  return format(parseISO(value), "d MMM");
}

export function isInfiniteTimestamp(value: string) {
  return value === "-infinity" || value === "infinity";
}

export function rpcTimestamp(value: string) {
  if (value === "-infinity") {
    return "0001-01-01T00:00:00.000Z";
  }
  if (value === "infinity") {
    return "9999-12-31T23:59:59.999Z";
  }
  return value;
}

export function windowLabel(input: {
  windowFrom: string | null;
  windowTo: string | null;
  nextMeetingAt: string | null;
  viewingNext: boolean;
}) {
  const from = input.windowFrom ? formatWindowDay(input.windowFrom) : null;
  const to = input.windowTo ? formatWindowDay(input.windowTo) : null;
  const next = input.nextMeetingAt ? formatWindowDay(input.nextMeetingAt) : null;

  if (from && next && input.viewingNext) {
    return `Since ${from} · next meeting ${next}`;
  }
  if (from && to) {
    return `Since ${from} · through ${to}`;
  }
  if (!from && to) {
    return `Up to ${to}`;
  }
  return "Counts start once a meeting is on the calendar.";
}

export function meetingTone(
  meeting: BoardMeeting,
  next: { id: string; scheduledAt: string } | null,
): "Next" | "Scheduled" | "Held" | "Cancelled" {
  if (meeting.status === "Cancelled") {
    return "Cancelled";
  }
  if (next && meeting.id === next.id) {
    return "Next";
  }
  if (meeting.status === "Completed" || !next || meeting.scheduledAt < next.scheduledAt) {
    return "Held";
  }
  return "Scheduled";
}

export function toTimestamptz(localValue: string) {
  return new Date(localValue).toISOString();
}

export function toDateTimeLocal(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function roleLabel(role: "chairman" | "director") {
  return role === "chairman" ? "Chairman" : "Director";
}

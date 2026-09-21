export const SEND_HOUR = 7;

export type LocalNow = {
  hour: number;
  isoDay: string;
};

export function isTimeZone(value: string) {
  if (!value) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function localNow(timeZone: string, at: Date): LocalNow {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    hour: Number(read("hour")),
    isoDay: `${read("year")}-${read("month")}-${read("day")}`,
  };
}

export function isSendHour(timeZone: string, at: Date) {
  return localNow(timeZone, at).hour === SEND_HOUR;
}

export function formatDayHeading(timeZone: string, at: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(at);
}

export function formatDayShort(timeZone: string, at: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "short",
  }).format(at);
}

export function formatMeetingToday(scheduledAt: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(scheduledAt));
}

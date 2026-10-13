/** Calendar-day helpers on YYYY-MM-DD strings. No time zones, no clocks. */

function parts(isoDay: string): [number, number, number] {
  const [year, month, day] = isoDay.split("-").map(Number);
  return [year, month, day];
}

export function addDays(isoDay: string, days: number): string {
  const [year, month, day] = parts(isoDay);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** Whole days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = parts(from);
  const [ty, tm, td] = parts(to);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** The Monday on or before the given day. */
export function startOfWeek(isoDay: string): string {
  const [year, month, day] = parts(isoDay);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDays(isoDay, -((weekday + 6) % 7));
}

/** The first day of the month containing the given day. */
export function startOfMonth(isoDay: string): string {
  return `${isoDay.slice(0, 7)}-01`;
}

/** The first of the month, `months` away from the one containing the given day. */
export function addMonths(isoDay: string, months: number): string {
  const [year, month] = parts(isoDay);
  return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 10);
}

/** Whole weeks (Monday to Sunday) that cover the month starting at `monthStart`. */
export function monthWeeks(monthStart: string): string[][] {
  const next = addMonths(monthStart, 1);
  const weeks: string[][] = [];
  let first = startOfWeek(monthStart);
  while (first < next) {
    weeks.push(Array.from({ length: 7 }, (_, step) => addDays(first, step)));
    first = addDays(first, 7);
  }
  return weeks;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthHeading(isoDay: string): string {
  const [year, month] = parts(isoDay);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** "17:30" as "5:30 pm". */
export function formatTime(hhmm: string): string {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayShort(isoDay: string): string {
  const [year, month, day] = parts(isoDay);
  return WEEKDAY_SHORT[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** Saturday on or after today; on a Sunday, today. */
export function thisWeekend(today: string): string {
  const [year, month, day] = parts(today);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday === 6 || weekday === 0 ? today : addDays(today, 6 - weekday);
}

/** The Monday after today. */
export function nextMonday(today: string): string {
  const [year, month, day] = parts(today);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return addDays(today, ((8 - weekday) % 7) || 7);
}

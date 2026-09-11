import { addMonths, format, parseISO, startOfMonth } from "date-fns";

export function formatPeriod(period: string): string {
  return format(parseISO(period), "MMM yyyy");
}

export function monthInputValue(period: string): string {
  return format(parseISO(period), "yyyy-MM");
}

export function periodFromMonthInput(value: string): string {
  const [year, month] = value.split("-");
  return `${year}-${month}-01`;
}

export function defaultNewPeriod(existingPeriods: string[]): string {
  const taken = new Set(existingPeriods);
  let cursor = startOfMonth(new Date());
  for (let i = 0; i < 120; i += 1) {
    const period = format(cursor, "yyyy-MM-dd");
    if (!taken.has(period)) {
      return period;
    }
    cursor = addMonths(cursor, 1);
  }
  return format(startOfMonth(new Date()), "yyyy-MM-dd");
}

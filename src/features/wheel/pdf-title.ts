import { format, parseISO } from "date-fns";
import type { WheelKind } from "./types";

export function wheelPdfTitle(name: string, kind: WheelKind) {
  const wheel = kind === "WOL" ? "Wheel of Life" : "Wheel of Business";
  const trimmed = name.trim();
  if (!trimmed) {
    return wheel;
  }
  const suffix = /s$/i.test(trimmed) ? "'" : "'s";
  return `${trimmed}${suffix} ${wheel}`;
}

export function wheelPdfSubtitle(period: string | null, printedOn: Date) {
  const cycle = period ? format(parseISO(period), "MMM yyyy") : "No cycle";
  return `${cycle} | Dt: ${format(printedOn, "d MMM yyyy")}`;
}

export function wheelPdfFilename(kind: WheelKind, period: string | null) {
  const wheel = kind === "WOL" ? "wheel-of-life" : "wheel-of-business";
  const when = period ? format(parseISO(period), "yyyy-MM") : "draft";
  return `${wheel}-${when}.pdf`;
}

export function wheelPdfPageLabel(page: number, total: number) {
  return `${page} / ${total}`;
}

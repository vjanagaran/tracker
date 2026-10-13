import type { TaskPriority } from "./types";

export type PriorityStyle = {
  label: string;
  /** Flag colour, on its own. */
  text: string;
  /** Tinted pill: selected state and the chip on a row. */
  pill: string;
};

/**
 * High is red, Medium amber, Low blue, Flexi grey. Every place that shows a
 * priority also writes its name, so colour is never the only signal.
 */
export const PRIORITY: Record<TaskPriority, PriorityStyle> = {
  high: {
    label: "High",
    text: "text-red-600 dark:text-red-400",
    pill: "border-red-600/40 bg-red-600/10 text-red-700 dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-300",
  },
  medium: {
    label: "Medium",
    text: "text-amber-600 dark:text-amber-400",
    pill: "border-amber-600/40 bg-amber-500/10 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300",
  },
  low: {
    label: "Low",
    text: "text-sky-600 dark:text-sky-400",
    pill: "border-sky-600/40 bg-sky-600/10 text-sky-700 dark:border-sky-400/40 dark:bg-sky-400/10 dark:text-sky-300",
  },
  flexi: {
    label: "Flexi",
    text: "text-muted-foreground",
    pill: "border-foreground/30 bg-muted text-foreground",
  },
};

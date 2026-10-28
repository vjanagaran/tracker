import { cn } from "cn";
import type { TaskStatus } from "./types";

const fill: Partial<Record<TaskStatus, string>> = {
  "Work in Progress": "bg-primary",
  "Hold Now": "bg-status-warn",
  Postponed: "bg-status-warn",
};

/**
 * A thin bar with the number beside it. The number carries the meaning and the
 * bar is the glance, so colour is never the only signal.
 */
export function ProgressBar({
  value,
  status,
  label,
  large = false,
  className,
}: {
  value: number;
  status: TaskStatus;
  /** Names the task for screen readers. */
  label: string;
  large?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        role="progressbar"
        aria-label={`Progress for ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={`${value}%`}
        className={cn(
          "relative overflow-hidden rounded-full bg-muted",
          large ? "h-2 w-20" : "h-1.5 w-14",
        )}
      >
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full", fill[status] ?? "bg-primary")}
          style={{ width: `${value}%` }}
        />
      </span>
      <span
        className={cn(
          "w-9 text-right text-muted-foreground tabular-nums",
          large ? "text-sm" : "text-xs",
        )}
      >
        {value}%
      </span>
    </span>
  );
}

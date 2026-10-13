"use client";

import { AlignLeft, Check, Flag, StickyNote } from "lucide-react";
import { cn } from "cn";
import { Dot, type BadgeTone } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { planDescriptions, taskChips, type TaskChip } from "./chips";
import { formatTime } from "./dates";
import { startTaskDrag } from "./drag";
import { relativeDay, startLabel } from "./grouping";
import { repeatLabel } from "./labels";
import { PRIORITY } from "./priority";
import { TASK_STATUSES, isOpenStatus, type PlanOption, type TaskItem, type TaskStatus } from "./types";

export const statusTone: Record<TaskStatus, BadgeTone> = {
  "Not Started": "neutral",
  "Work in Progress": "accent",
  Postponed: "warn",
  "Hold Now": "warn",
  Completed: "positive",
  Cancelled: "neutral",
};

/** What every row needs to draw itself and report what the member did. */
export type RowContext = {
  planById: ReadonlyMap<string, PlanOption>;
  today: string;
  /** Meeting mode: larger type and more room. */
  large: boolean;
  /** The task open in the detail pane, if any. */
  selectedId: string | null;
  onEdit: (taskId: string) => void;
  onNotes: (taskId: string) => void;
  onStatus: (taskId: string, status: TaskStatus) => void;
  onToggleDone: (task: TaskItem) => void;
};

const chipClasses = {
  WOL: "bg-status-positive/10 text-status-positive",
  WOB: "bg-primary/10 text-primary",
  none: "bg-muted text-muted-foreground",
} as const;

function WheelChip({ chip, large }: { chip: TaskChip; large: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-medium whitespace-nowrap",
        large ? "text-sm" : "text-xs",
        chipClasses[chip.wheel ?? "none"],
      )}
    >
      {chip.label}
    </span>
  );
}

function PriorityChip({ task, large }: { task: TaskItem; large: boolean }) {
  const style = PRIORITY[task.priority] ?? PRIORITY.flexi;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium whitespace-nowrap",
        large ? "text-sm" : "text-xs",
        style.pill,
      )}
    >
      <Flag className="size-3" fill="currentColor" aria-hidden="true" />
      {style.label}
    </span>
  );
}

function DoneBox({ task, onToggle }: { task: TaskItem; onToggle: () => void }) {
  const done = task.status === "Completed";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
      className="-my-0.5 -ml-3 flex size-11 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      onClick={onToggle}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border-2 transition-colors",
          done
            ? "border-status-positive bg-status-positive text-white"
            : "border-muted-foreground/50 hover:border-foreground",
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden="true" /> : null}
      </span>
    </button>
  );
}

export function StatusSelect({
  title,
  value,
  onChange,
}: {
  title: string;
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}) {
  return (
    <Select value={value} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger
        className="w-auto border-transparent bg-transparent px-2 text-[13px] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
        aria-label={`Status for ${title}`}
      >
        <Dot tone={statusTone[value]} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="end" className="min-w-44">
        {TASK_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type TaskRowProps = {
  task: TaskItem;
  context: RowContext;
  /** Hide the date where the surrounding heading already says it. */
  showDate?: boolean;
  /** Cards sit in board columns and have no divider. */
  variant?: "row" | "card";
  draggable?: boolean;
};

export function TaskRow({
  task,
  context,
  showDate = true,
  variant = "row",
  draggable = false,
}: TaskRowProps) {
  const { planById, today, large, selectedId } = context;
  const open = isOpenStatus(task.status);
  const closed = task.status === "Completed" || task.status === "Cancelled";
  const chips = taskChips(task, planById);
  const visibleChips = chips.slice(0, 2);
  const extraChips = chips.length - visibleChips.length;
  const descriptions = planDescriptions(task, planById);
  const repeat = repeatLabel(task.repeatEvery);
  const day = relativeDay(task.targetOn, today, open);
  const start = startLabel(task.plannedStartOn, today, open, task.plannedStartTime);
  // A task cached before priority existed has none; it reads as Flexi.
  const flagged = Boolean(task.priority) && task.priority !== "flexi";
  // A time on an overdue day would only muddy "3 days overdue".
  const timeText = task.targetTime && !day.overdue ? formatTime(task.targetTime) : null;
  const selected = selectedId === task.id;

  return (
    <li
      draggable={draggable}
      onDragStart={draggable ? (event) => startTaskDrag(event, task.id) : undefined}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "grid grid-cols-[auto_1fr] items-start gap-x-3",
        // A card is narrow, so its actions always sit under the title.
        variant === "card"
          ? "rounded-lg border border-border bg-background px-3 py-2 shadow-xs"
          : "border-b border-border py-2 last:border-b-0 md:grid-cols-[auto_1fr_auto]",
        large && variant === "row" ? "py-4" : null,
        draggable ? "cursor-grab active:cursor-grabbing" : null,
        selected ? "bg-accent/60" : null,
        task.status === "Cancelled" ? "opacity-70" : null,
      )}
    >
      <DoneBox task={task} onToggle={() => context.onToggleDone(task)} />

      <div className="min-w-0 pt-1.5">
        <button
          type="button"
          className={cn(
            "w-full text-left leading-snug break-words whitespace-normal",
            large ? "text-xl" : "text-[15px]",
            closed ? "text-muted-foreground" : null,
            task.status === "Completed" ? "line-through" : null,
          )}
          onClick={() => context.onEdit(task.id)}
        >
          {task.title}
        </button>
        {visibleChips.length > 0 || flagged || repeat !== "—" || start ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {visibleChips.map((chip) => (
              <WheelChip key={chip.key} chip={chip} large={large} />
            ))}
            {extraChips > 0 ? (
              <span className={cn("text-muted-foreground", large ? "text-sm" : "text-xs")}>
                +{extraChips}
              </span>
            ) : null}
            {flagged ? <PriorityChip task={task} large={large} /> : null}
            {repeat !== "—" ? (
              <span className={cn("text-muted-foreground", large ? "text-sm" : "text-xs")}>
                Repeats {repeat.toLowerCase()}
              </span>
            ) : null}
            {start ? (
              <span className={cn("text-muted-foreground", large ? "text-sm" : "text-xs")}>
                {start}
              </span>
            ) : null}
          </div>
        ) : null}
        {descriptions.length > 0 ? (
          <p
            className={cn(
              "mt-1 break-words text-muted-foreground",
              large ? "text-base" : "text-[13px]",
            )}
          >
            {descriptions.join(" · ")}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "col-start-2 flex min-h-11 flex-wrap items-center gap-x-3",
          variant === "row" ? "md:col-start-3 md:justify-end" : null,
        )}
      >
        {task.description ? (
          <span
            className="inline-flex min-h-11 items-center text-muted-foreground"
            title="Has a description"
          >
            <AlignLeft className="size-3.5" aria-hidden="true" />
            <span className="sr-only">Has a description</span>
          </span>
        ) : null}
        {task.notes.length > 0 ? (
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
            aria-label={`${task.notes.length} notes`}
            onClick={() => context.onNotes(task.id)}
          >
            <StickyNote className="size-3.5" aria-hidden="true" />
            {task.notes.length}
          </button>
        ) : null}
        {(showDate && task.targetOn) || (!showDate && timeText) ? (
          <span
            className={cn(
              "whitespace-nowrap",
              large ? "text-base" : "text-[13px]",
              day.overdue ? "font-medium text-status-warn" : "text-muted-foreground",
            )}
          >
            {showDate ? day.text : null}
            {showDate && timeText ? " · " : null}
            {timeText}
          </span>
        ) : null}
        <StatusSelect
          title={task.title}
          value={task.status}
          onChange={(status) => context.onStatus(task.id, status)}
        />
      </div>
    </li>
  );
}

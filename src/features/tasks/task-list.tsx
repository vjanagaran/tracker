"use client";

import { Calendar, Plus, StickyNote } from "lucide-react";
import { Dot, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatTarget,
  openCounts,
  sortClosed,
  sortOpen,
  tagLabel,
  workingToward,
} from "./labels";
import { TASK_STATUSES, isOpenStatus, type PlanOption, type TaskItem, type TaskStatus } from "./types";

const statusTone: Record<TaskStatus, BadgeTone> = {
  "Not Started": "neutral",
  "Work in Progress": "accent",
  Postponed: "warn",
  "Hold Now": "warn",
  Completed: "positive",
  Cancelled: "neutral",
};

type TaskListProps = {
  tasks: TaskItem[];
  plans: PlanOption[];
  closedOpen: boolean;
  statusError: string | null;
  onAdd: () => void;
  onEdit: (taskId: string) => void;
  onNotes: (taskId: string) => void;
  onStatus: (taskId: string, status: TaskStatus) => void;
  onToggleClosed: () => void;
};

export function TaskList({
  tasks,
  plans,
  closedOpen,
  statusError,
  onAdd,
  onEdit,
  onNotes,
  onStatus,
  onToggleClosed,
}: TaskListProps) {
  const open = sortOpen(tasks.filter((task) => isOpenStatus(task.status)));
  const closed = sortClosed(tasks.filter((task) => !isOpenStatus(task.status)));
  const counts = openCounts(tasks);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {counts.open} open
          {counts.life || counts.business || counts.openItem
            ? ` · ${counts.life} life · ${counts.business} business · ${counts.openItem} untagged`
            : null}
        </p>
        <Button type="button" variant="ghost" className="min-h-11 px-3" onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add a task
        </Button>
      </div>

      {open.length === 0 ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          No open tasks. Add one when you have something to finish this fortnight.
        </p>
      ) : (
        <ul>
          {open.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              plans={plans}
              onEdit={onEdit}
              onNotes={onNotes}
              onStatus={onStatus}
            />
          ))}
        </ul>
      )}

      <button
        type="button"
        className="mt-1 flex min-h-11 w-full items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        onClick={onAdd}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add a task
      </button>

      {statusError ? <p className="mt-4 text-sm text-destructive">{statusError}</p> : null}

      {closed.length > 0 ? (
        <div className="mt-8">
          <button
            type="button"
            className="min-h-11 text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={onToggleClosed}
          >
            {closedOpen
              ? "Hide completed and cancelled"
              : `Show ${closed.length} completed and cancelled`}
          </button>
          {closedOpen ? (
            <ul className="mt-1">
              {closed.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  plans={plans}
                  dimmed
                  onEdit={onEdit}
                  onNotes={onNotes}
                  onStatus={onStatus}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TaskRow({
  task,
  plans,
  dimmed = false,
  onEdit,
  onNotes,
  onStatus,
}: {
  task: TaskItem;
  plans: PlanOption[];
  dimmed?: boolean;
  onEdit: (taskId: string) => void;
  onNotes: (taskId: string) => void;
  onStatus: (taskId: string, status: TaskStatus) => void;
}) {
  const meta = [tagLabel(task.tag), workingToward(task, plans)].filter(
    (part) => part !== "—",
  );

  return (
    <li
      className={`border-b border-border py-3 last:border-b-0 ${dimmed ? "opacity-70" : ""}`}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:gap-5">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className="mt-2.5 shrink-0">
            <Dot tone={statusTone[task.status]} />
          </span>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              className="min-h-11 w-full text-left text-[15px] leading-snug break-words whitespace-normal"
              onClick={() => onEdit(task.id)}
            >
              {task.title}
            </button>
            {meta.length > 0 ? (
              <p className="text-[13px] break-words text-muted-foreground">
                {meta.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex min-h-11 shrink-0 items-center gap-3 pl-6 md:pl-0">
          {task.notes.length > 0 ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
              aria-label={`${task.notes.length} notes`}
              onClick={() => onNotes(task.id)}
            >
              <StickyNote className="size-3.5" aria-hidden="true" />
              {task.notes.length}
            </button>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-[13px] whitespace-nowrap text-muted-foreground">
            <Calendar className="size-3.5" aria-hidden="true" />
            {formatTarget(task.targetOn)}
          </span>
          <StatusSelect
            title={task.title}
            value={task.status}
            onChange={(status) => onStatus(task.id, status)}
          />
        </div>
      </div>
    </li>
  );
}

function StatusSelect({
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
        className="min-h-11 w-[168px] border-transparent bg-transparent px-2 hover:bg-foreground/[0.04]"
        aria-label={`Status for ${title}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TASK_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

"use client";

import { Calendar, Plus } from "lucide-react";
import { Badge, Dot, type BadgeTone } from "@/components/ui/badge";
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
  onStatus,
  onToggleClosed,
}: TaskListProps) {
  const open = sortOpen(tasks.filter((task) => isOpenStatus(task.status)));
  const closed = sortClosed(tasks.filter((task) => !isOpenStatus(task.status)));
  const counts = openCounts(tasks);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Badge tone="accent">Open · {counts.open}</Badge>
        <Badge>Life · {counts.life}</Badge>
        <Badge>Business · {counts.business}</Badge>
        <Badge>Open item · {counts.openItem}</Badge>
        <Button type="button" className="min-h-11 px-4 md:ml-auto" onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add a task
        </Button>
      </div>

      {open.length === 0 ? (
        <p className="max-w-prose text-sm text-muted-foreground">
          No open tasks. Add one when you have something to finish this fortnight.
        </p>
      ) : (
        <>
          <div className="pb-card hidden overflow-hidden md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="w-[34%] px-3 py-3">Task</th>
                  <th className="w-[110px] px-3 py-3">Tag</th>
                  <th className="px-3 py-3">Working toward</th>
                  <th className="w-[88px] px-3 py-3">Target</th>
                  <th className="w-[168px] px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {open.map((task) => (
                  <tr key={task.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-4 align-middle">
                      <button
                        type="button"
                        className="min-h-11 text-left text-base break-words whitespace-normal"
                        onClick={() => onEdit(task.id)}
                      >
                        {task.title}
                      </button>
                    </td>
                    <td className="px-3 py-4 align-middle text-sm text-muted-foreground">
                      {tagLabel(task.tag)}
                    </td>
                    <td className="px-3 py-4 align-middle text-sm break-words text-muted-foreground">
                      {workingToward(task, plans)}
                    </td>
                    <td className="px-3 py-4 align-middle text-sm whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" aria-hidden="true" />
                        {formatTarget(task.targetOn)}
                      </span>
                    </td>
                    <td className="px-3 py-4 align-middle">
                      <StatusSelect
                        title={task.title}
                        value={task.status}
                        onChange={(status) => onStatus(task.id, status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-4 md:hidden">
            {open.map((task) => (
              <li key={task.id} className="pb-card p-3">
                <button
                  type="button"
                  className="min-h-11 w-full text-left text-base break-words whitespace-normal"
                  onClick={() => onEdit(task.id)}
                >
                  {task.title}
                </button>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {tagLabel(task.tag)} ·
                  <Calendar className="size-3.5" aria-hidden="true" />
                  {formatTarget(task.targetOn)}
                </p>
                <p className="mt-1 text-sm break-words text-muted-foreground">
                  {workingToward(task, plans)}
                </p>
                <div className="mt-3">
                  <StatusSelect
                    title={task.title}
                    value={task.status}
                    onChange={(status) => onStatus(task.id, status)}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {statusError ? <p className="mt-4 text-sm text-destructive">{statusError}</p> : null}

      {closed.length > 0 ? (
        <div className="mt-6">
          <button
            type="button"
            className="min-h-11 text-left text-sm text-primary underline-offset-4 hover:underline"
            onClick={onToggleClosed}
          >
            {closedOpen
              ? "Hide completed and cancelled"
              : `Show ${closed.length} completed and cancelled`}
          </button>
          {closedOpen ? (
            <ul className="mt-3 flex flex-col gap-3">
              {closed.map((task) => (
                <li
                  key={task.id}
                  className="pb-card flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="min-h-11 text-left text-base break-words whitespace-normal"
                      onClick={() => onEdit(task.id)}
                    >
                      {task.title}
                    </button>
                    <p className="flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground">
                      {tagLabel(task.tag)} · {workingToward(task, plans)} ·
                      <Calendar className="size-3.5" aria-hidden="true" />
                      {formatTarget(task.targetOn)}
                    </p>
                  </div>
                  <StatusSelect
                    title={task.title}
                    value={task.status}
                    onChange={(status) => onStatus(task.id, status)}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
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
    <div className="flex max-w-[168px] items-center gap-2">
      <Dot tone={statusTone[value]} />
      <Select value={value} onValueChange={(next) => next && onChange(next)}>
        <SelectTrigger className="w-full" aria-label={`Status for ${title}`}>
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
    </div>
  );
}

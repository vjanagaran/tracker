"use client";

import { Plus } from "lucide-react";
import { cn } from "cn";
import { groupByDate } from "./grouping";
import { sortClosed, sortOpen } from "./labels";
import type { TaskView } from "./scope";
import { TaskRow, type RowContext } from "./task-row";
import type { TaskItem } from "./types";

type TaskListProps = {
  tasks: TaskItem[];
  view: TaskView;
  /** Open tasks under Overdue, Today and so on. Off when a date view is chosen. */
  grouped: boolean;
  context: RowContext;
  emptyText: string;
  onAdd: () => void;
};

export function TaskList({ tasks, view, grouped, context, emptyText, onAdd }: TaskListProps) {
  const { large } = context;

  let body;
  if (tasks.length === 0) {
    body = <p className="max-w-prose text-sm text-muted-foreground">{emptyText}</p>;
  } else if (view === "open" && grouped) {
    body = groupByDate(tasks, context.today).map((group, position) => (
      <section key={group.key} aria-labelledby={`group-${group.key}`}>
        <h3
          id={`group-${group.key}`}
          className={cn(
            "flex items-baseline gap-2 font-medium",
            large ? "mt-10 mb-2 text-base" : "mt-7 mb-1 text-[13px]",
            position === 0 ? "mt-0" : null,
            group.key === "overdue" ? "text-status-warn" : "text-muted-foreground",
          )}
        >
          {group.label}
          <span className="font-normal text-muted-foreground">{group.tasks.length}</span>
        </h3>
        <ul>
          {group.tasks.map((task) => (
            <TaskRow key={task.id} task={task} context={context} />
          ))}
        </ul>
      </section>
    ));
  } else {
    const rows = view === "open" ? sortOpen(tasks) : sortClosed(tasks);
    body = (
      <ul>
        {rows.map((task) => (
          <TaskRow key={task.id} task={task} context={context} />
        ))}
      </ul>
    );
  }

  return (
    <div>
      {body}
      {view === "open" ? (
        <button
          type="button"
          className={cn(
            "mt-2 flex min-h-11 w-full items-center gap-2 text-muted-foreground transition-colors hover:text-foreground",
            large ? "text-base" : "text-sm",
          )}
          onClick={onAdd}
        >
          <Plus className="size-4" aria-hidden="true" />
          Add a task
        </button>
      ) : null}
    </div>
  );
}

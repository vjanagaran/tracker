"use client";

import { useState } from "react";
import { cn } from "cn";
import { Dot } from "@/components/ui/badge";
import { isTaskDrag, readTaskDrag } from "./drag";
import { sortOpen } from "./labels";
import { statusTone, TaskRow, type RowContext } from "./task-row";
import { OPEN_STATUSES, type TaskItem, type TaskStatus } from "./types";

/** One column per open status. Drag a card to another column to change its status. */
export function TaskBoard({
  tasks,
  context,
  emptyText,
}: {
  tasks: TaskItem[];
  context: RowContext;
  emptyText: string;
}) {
  const [over, setOver] = useState<TaskStatus | null>(null);
  const { large } = context;

  if (tasks.length === 0) {
    return <p className="max-w-prose text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-4">
      {OPEN_STATUSES.map((status) => {
        const column = sortOpen(tasks.filter((task) => task.status === status));
        return (
          <section
            key={status}
            aria-labelledby={`column-${status}`}
            onDragOver={(event) => {
              if (isTaskDrag(event)) {
                event.preventDefault();
                setOver(status);
              }
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setOver((current) => (current === status ? null : current));
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setOver(null);
              const id = readTaskDrag(event);
              const task = id ? tasks.find((row) => row.id === id) : undefined;
              if (task && task.status !== status) {
                context.onStatus(task.id, status);
              }
            }}
            className={cn(
              "min-h-32 rounded-xl bg-muted/60 p-2.5 transition-colors",
              over === status ? "bg-accent ring-2 ring-primary/30" : null,
            )}
          >
            <h3
              id={`column-${status}`}
              className={cn(
                "mb-2 flex items-center gap-2 px-1 font-medium",
                large ? "text-base" : "text-[13px]",
              )}
            >
              <Dot tone={statusTone[status]} />
              {status}
              <span className="font-normal text-muted-foreground">{column.length}</span>
            </h3>
            <ul className="flex flex-col gap-2">
              {column.map((task) => (
                <TaskRow key={task.id} task={task} context={context} variant="card" draggable />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

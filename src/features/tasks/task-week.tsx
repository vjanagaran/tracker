"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek } from "./dates";
import { isTaskDrag, readTaskDrag } from "./drag";
import { weekdayHeading } from "./grouping";
import { sortOpen } from "./labels";
import { TaskRow, type RowContext } from "./task-row";
import type { TaskItem } from "./types";

/**
 * Seven days, Monday to Sunday. Drag a task onto a day to change its
 * finish-by date; tasks with no date wait at the bottom to be scheduled.
 */
export function TaskWeek({
  tasks,
  context,
  emptyText,
  onMove,
}: {
  tasks: TaskItem[];
  context: RowContext;
  emptyText: string;
  onMove: (taskId: string, targetOn: string) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [over, setOver] = useState<string | null>(null);
  const { today, large } = context;

  const first = addDays(startOfWeek(today), offset * 7);
  const days = Array.from({ length: 7 }, (_, step) => addDays(first, step));
  const overdue = offset === 0 ? sortOpen(tasks.filter((task) => task.targetOn && task.targetOn < today)) : [];
  const undated = sortOpen(tasks.filter((task) => !task.targetOn));

  if (tasks.length === 0) {
    return <p className="max-w-prose text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Previous week"
          onClick={() => setOffset(offset - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={offset === 0}
          onClick={() => setOffset(0)}
        >
          This week
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Next week"
          onClick={() => setOffset(offset + 1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
        <p className={cn("ml-1 text-muted-foreground", large ? "text-base" : "text-sm")}>
          {weekdayHeading(first)} to {weekdayHeading(days[6])}
        </p>
      </div>

      {overdue.length > 0 ? (
        <section aria-labelledby="week-overdue" className="mb-5">
          <h3
            id="week-overdue"
            className={cn("mb-1 font-medium text-status-warn", large ? "text-base" : "text-[13px]")}
          >
            Overdue <span className="font-normal text-muted-foreground">{overdue.length}</span>
          </h3>
          <ul>
            {overdue.map((task) => (
              <TaskRow key={task.id} task={task} context={context} draggable />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const list = sortOpen(tasks.filter((task) => task.targetOn === day));
          const isToday = day === today;
          return (
            <section
              key={day}
              aria-labelledby={`day-${day}`}
              onDragOver={(event) => {
                if (isTaskDrag(event)) {
                  event.preventDefault();
                  setOver(day);
                }
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setOver((current) => (current === day ? null : current));
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setOver(null);
                const id = readTaskDrag(event);
                const task = id ? tasks.find((row) => row.id === id) : undefined;
                if (task && task.targetOn !== day) {
                  onMove(task.id, day);
                }
              }}
              className={cn(
                "rounded-xl border border-border px-3 py-2 transition-colors",
                isToday ? "bg-accent/40" : null,
                over === day ? "border-primary/40 bg-accent ring-2 ring-primary/30" : null,
              )}
            >
              <h3
                id={`day-${day}`}
                className={cn("font-medium", large ? "text-base" : "text-[13px]")}
              >
                {weekdayHeading(day)}
                {isToday ? <span className="font-normal text-muted-foreground"> · Today</span> : null}
              </h3>
              {list.length > 0 ? (
                <ul>
                  {list.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      context={context}
                      showDate={false}
                      draggable
                    />
                  ))}
                </ul>
              ) : (
                <p className={cn("py-1 text-muted-foreground", large ? "text-base" : "text-[13px]")}>
                  Nothing due.
                </p>
              )}
            </section>
          );
        })}
      </div>

      {undated.length > 0 ? (
        <section aria-labelledby="week-undated" className="mt-6">
          <h3
            id="week-undated"
            className={cn("font-medium text-muted-foreground", large ? "text-base" : "text-[13px]")}
          >
            No date <span className="font-normal">{undated.length}</span>
          </h3>
          <p className={cn("mb-1 text-muted-foreground", large ? "text-sm" : "text-xs")}>
            Drag a task onto a day to give it a finish-by date.
          </p>
          <ul>
            {undated.map((task) => (
              <TaskRow key={task.id} task={task} context={context} draggable />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

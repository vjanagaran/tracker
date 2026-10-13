"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { taskChips } from "./chips";
import { addMonths, monthHeading, monthWeeks, startOfMonth } from "./dates";
import { isTaskDrag, readTaskDrag, startTaskDrag } from "./drag";
import { weekdayHeading } from "./grouping";
import { sortOpen } from "./labels";
import { TaskRow, type RowContext } from "./task-row";
import type { TaskItem } from "./types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Tasks a day cell names before it says "+n more". */
const CELL_LIMIT = 3;

const chipTone = {
  WOL: "bg-status-positive/10 text-status-positive",
  WOB: "bg-primary/10 text-primary",
  none: "bg-muted text-muted-foreground",
} as const;

/**
 * A month of days. Drag a task onto a day to change its finish-by date; choose
 * a day to read its tasks underneath. Tasks with no date wait below the month.
 */
export function TaskCalendar({
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
  const [picked, setPicked] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const { today, large, planById } = context;

  const month = addMonths(startOfMonth(today), offset);
  const weeks = monthWeeks(month);
  const inMonth = (day: string) => day.slice(0, 7) === month.slice(0, 7);

  const byDay = new Map<string, TaskItem[]>();
  for (const task of sortOpen(tasks)) {
    if (task.targetOn) {
      byDay.set(task.targetOn, [...(byDay.get(task.targetOn) ?? []), task]);
    }
  }

  // The day under the grid: the one chosen, else today while looking at this month.
  const selected = picked && inMonth(picked) ? picked : offset === 0 ? today : null;
  const selectedTasks = selected ? (byDay.get(selected) ?? []) : [];
  const earlier =
    offset >= 0
      ? tasks.filter((task) => task.targetOn && task.targetOn < month && task.targetOn < today)
      : [];
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
          aria-label="Previous month"
          onClick={() => setOffset(offset - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={offset === 0}
          onClick={() => {
            setOffset(0);
            setPicked(null);
          }}
        >
          This month
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-11 min-w-11"
          aria-label="Next month"
          onClick={() => setOffset(offset + 1)}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
        <h3 className={cn("ml-1 font-semibold", large ? "text-xl" : "text-base")}>
          {monthHeading(month)}
        </h3>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-border" role="grid" aria-label={monthHeading(month)}>
        {WEEKDAYS.map((name) => (
          <div
            key={name}
            role="columnheader"
            className="border-r border-b border-border bg-muted/60 px-2 py-1.5 text-xs font-medium text-muted-foreground"
          >
            {name}
          </div>
        ))}
        {weeks.flat().map((day) => {
          const list = byDay.get(day) ?? [];
          const isToday = day === today;
          const isSelected = day === selected;
          const dayNumber = Number(day.slice(8));
          return (
            <div
              key={day}
              role="gridcell"
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
                "min-w-0 border-r border-b border-border p-1 transition-colors md:min-h-28 md:p-1.5",
                inMonth(day) ? null : "bg-muted/40",
                isSelected ? "bg-accent/50" : null,
                over === day ? "bg-accent ring-2 ring-primary/30 ring-inset" : null,
              )}
            >
              <button
                type="button"
                aria-label={`${weekdayHeading(day)}, ${list.length} ${list.length === 1 ? "task" : "tasks"}`}
                aria-pressed={isSelected}
                className={cn(
                  "flex min-h-11 w-full flex-col items-center gap-0.5 rounded-md text-sm md:min-h-7 md:flex-row md:items-start md:gap-1.5 md:py-0.5",
                  inMonth(day) ? null : "text-muted-foreground",
                )}
                onClick={() => setPicked(day)}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[13px]",
                    isToday ? "bg-primary font-medium text-primary-foreground" : null,
                  )}
                >
                  {dayNumber}
                </span>
                {list.length > 0 ? (
                  <span className="text-xs text-muted-foreground md:hidden">{list.length}</span>
                ) : null}
              </button>

              <ul className="hidden flex-col gap-1 md:flex">
                {list.slice(0, CELL_LIMIT).map((task) => {
                  const wheel = taskChips(task, planById)[0]?.wheel ?? null;
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        draggable
                        onDragStart={(event) => startTaskDrag(event, task.id)}
                        title={task.title}
                        className={cn(
                          "block w-full cursor-grab truncate rounded px-1.5 py-0.5 text-left active:cursor-grabbing",
                          large ? "text-sm" : "text-xs",
                          chipTone[wheel ?? "none"],
                          task.targetOn && task.targetOn < today ? "font-medium" : null,
                        )}
                        onClick={() => context.onEdit(task.id)}
                      >
                        {task.title}
                      </button>
                    </li>
                  );
                })}
                {list.length > CELL_LIMIT ? (
                  <li>
                    <button
                      type="button"
                      className="px-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setPicked(day)}
                    >
                      +{list.length - CELL_LIMIT} more
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>

      {selected ? (
        <section aria-labelledby="calendar-day" className="mt-6">
          <h3 id="calendar-day" className={cn("font-medium", large ? "text-base" : "text-[13px]")}>
            {weekdayHeading(selected)}
            {selected === today ? (
              <span className="font-normal text-muted-foreground"> · Today</span>
            ) : null}
          </h3>
          {selectedTasks.length > 0 ? (
            <ul>
              {selectedTasks.map((task) => (
                <TaskRow key={task.id} task={task} context={context} showDate={false} />
              ))}
            </ul>
          ) : (
            <p className={cn("py-1 text-muted-foreground", large ? "text-base" : "text-[13px]")}>
              Nothing due.
            </p>
          )}
        </section>
      ) : null}

      {earlier.length > 0 ? (
        <section aria-labelledby="calendar-earlier" className="mt-6">
          <h3
            id="calendar-earlier"
            className={cn("font-medium text-status-warn", large ? "text-base" : "text-[13px]")}
          >
            Overdue <span className="font-normal text-muted-foreground">{earlier.length}</span>
          </h3>
          <ul>
            {sortOpen(earlier).map((task) => (
              <TaskRow key={task.id} task={task} context={context} draggable />
            ))}
          </ul>
        </section>
      ) : null}

      {undated.length > 0 ? (
        <section aria-labelledby="calendar-undated" className="mt-6">
          <h3
            id="calendar-undated"
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

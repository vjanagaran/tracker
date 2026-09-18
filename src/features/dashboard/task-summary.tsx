"use client";

import { useSyncExternalStore } from "react";
import { Dot } from "@/components/ui/badge";
import { formatTarget, repeatLabel, tagLabel } from "@/features/tasks/labels";
import { bucketTasks } from "./bucket";
import { DashboardCard } from "./dashboard-card";
import { CARD_ROW_LIMIT, overdueLabel } from "./labels";
import { todayStore } from "./today";
import type { DashboardTask, DashboardTasks } from "./types";

export function TaskSummary({ tasks }: { tasks: DashboardTasks }) {
  // The server rendered its own day. Re-bucket against the member's.
  const today = useSyncExternalStore(
    todayStore.subscribe,
    todayStore.getSnapshot,
    () => tasks.serverDay,
  );
  const buckets = bucketTasks(tasks.rows, today);

  return (
    <DashboardCard title="Tasks" action={{ href: "/tasks", label: "All tasks" }}>
      {buckets.open === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open tasks. Add one when you have something to finish this fortnight.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {buckets.dueToday.length > 0 ? (
            <TaskGroup heading="Due today" tone="accent" rows={buckets.dueToday} />
          ) : null}
          {buckets.overdue.length > 0 ? (
            <TaskGroup
              heading={overdueLabel(buckets.overdue.length)}
              tone="warn"
              rows={buckets.overdue}
            />
          ) : null}
          <p className="text-sm text-muted-foreground">
            {buckets.dueThisWeek} due in the next seven days · {buckets.open} open in all
          </p>
        </div>
      )}
    </DashboardCard>
  );
}

function TaskGroup({
  heading,
  tone,
  rows,
}: {
  heading: string;
  tone: "warn" | "accent";
  rows: DashboardTask[];
}) {
  const shown = rows.slice(0, CARD_ROW_LIMIT);
  const hidden = rows.length - shown.length;

  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{heading}</p>
      <ul className="divide-y divide-border">
        {shown.map((task) => (
          <li key={task.id} className="flex items-start gap-3 py-2.5">
            <Dot tone={tone} className="mt-2" />
            <span className="min-w-0 flex-1 text-[15px] leading-snug break-words">
              {task.title}
            </span>
            <span className="shrink-0 text-[13px] whitespace-nowrap text-muted-foreground">
              {[
                task.tag ? tagLabel(task.tag) : null,
                task.repeatEvery ? repeatLabel(task.repeatEvery) : null,
                formatTarget(task.targetOn),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <p className="mt-1.5 text-xs text-muted-foreground">and {hidden} more</p>
      ) : null}
    </div>
  );
}

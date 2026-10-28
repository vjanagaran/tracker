import Link from "next/link";
import { format, parseISO } from "date-fns";
import { cn } from "cn";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { Enums } from "@/lib/database.types";
import { ProgressBar } from "@/features/tasks/progress-bar";
import { boardHref } from "./tabs";
import type { GoalsMember, SharedGoal } from "./types";

const statusTone: Record<Enums<"task_status">, BadgeTone> = {
  "Not Started": "neutral",
  "Work in Progress": "accent",
  Postponed: "warn",
  "Hold Now": "warn",
  Completed: "positive",
  Cancelled: "neutral",
};

function memberName(member: GoalsMember) {
  return member.fullName || "Unnamed";
}

function day(value: string | null) {
  return value ? format(parseISO(value), "d MMM yyyy") : "—";
}

type GoalsTabProps = {
  boardId: string;
  members: GoalsMember[];
  selectedUserId: string | null;
};

export function GoalsTab({ boardId, members, selectedUserId }: GoalsTabProps) {
  const selected =
    members.find((member) => member.userId === selectedUserId) ??
    members.find((member) => member.isYou) ??
    members[0] ??
    null;

  if (!selected) {
    return (
      <p className="max-w-prose text-sm text-muted-foreground">
        Goals appear once the board has members.
      </p>
    );
  }

  return (
    <section>
      <nav
        aria-label="Members"
        className="mb-6 flex flex-wrap gap-x-1 gap-y-1 border-b border-border"
      >
        {members.map((member) => {
          const isSelected = member.userId === selected.userId;
          return (
            <Link
              key={member.userId}
              href={boardHref(boardId, {
                tab: "goals",
                memberId: member.userId,
              })}
              aria-current={isSelected ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex min-h-11 items-center rounded-t-md border border-b-0 px-4 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                isSelected
                  ? "border-border bg-background font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {memberName(member)}
              {member.isYou ? (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">You</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <GoalsTable member={selected} />

      <p className="mt-3 text-xs text-muted-foreground">
        Each member chooses what appears here when they edit a task. Notes stay private.
      </p>
    </section>
  );
}

function GoalsTable({ member }: { member: GoalsMember }) {
  if (member.goals.length === 0) {
    return (
      <p className="max-w-prose py-6 text-sm text-muted-foreground">
        {member.isYou ? (
          <>
            You have not shared a task with this board yet. Open a task in{" "}
            <Link href="/tasks" className="text-primary underline-offset-4 hover:underline">
              Tasks
            </Link>{" "}
            and tick this board under Sharing with board.
          </>
        ) : (
          <>{memberName(member)} has not shared a task with this board yet.</>
        )}
      </p>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-3">Task</th>
              <th className="w-[160px] px-3 py-3">Spoke</th>
              <th className="px-3 py-3">Description</th>
              <th className="w-[120px] px-3 py-3">Start date</th>
              <th className="w-[120px] px-3 py-3">Target date</th>
              <th className="w-[150px] px-3 py-3">Status</th>
              <th className="w-[140px] px-3 py-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {member.goals.map((goal) => (
              <tr key={goal.taskId} className="border-b border-border align-top last:border-b-0">
                <td className="px-3 py-4 text-sm font-medium break-words">{goal.title}</td>
                <td className="px-3 py-4 text-sm break-words text-muted-foreground">
                  {goal.spokeNames || "—"}
                </td>
                <td className="px-3 py-4 text-sm break-words whitespace-pre-line text-muted-foreground">
                  {goal.description || "—"}
                </td>
                <td className="px-3 py-4 text-sm whitespace-nowrap">{day(goal.plannedStartOn)}</td>
                <td className="px-3 py-4 text-sm whitespace-nowrap">{day(goal.targetOn)}</td>
                <td className="px-3 py-4">
                  <StatusChip status={goal.status} />
                </td>
                <td className="px-3 py-4">
                  <GoalProgress goal={goal} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {member.goals.map((goal) => (
          <li key={goal.taskId} className="flex flex-col gap-2 px-4 py-4">
            <p className="text-sm font-medium break-words">{goal.title}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StatusChip status={goal.status} />
              {goal.progress != null ? <GoalProgress goal={goal} /> : null}
            </div>
            <GoalMeta goal={goal} />
          </li>
        ))}
      </ul>
    </>
  );
}

function GoalMeta({ goal }: { goal: SharedGoal }) {
  return (
    <dl className="flex flex-col gap-1 text-sm text-muted-foreground">
      {goal.spokeNames ? (
        <div>
          <dt className="inline text-foreground">Spoke</dt> · <dd className="inline">{goal.spokeNames}</dd>
        </div>
      ) : null}
      {goal.description ? (
        <div className="break-words whitespace-pre-line">
          <dt className="inline text-foreground">Description</dt> ·{" "}
          <dd className="inline">{goal.description}</dd>
        </div>
      ) : null}
      <div>
        <dt className="inline text-foreground">Start date</dt> ·{" "}
        <dd className="inline">{day(goal.plannedStartOn)}</dd>
      </div>
      <div>
        <dt className="inline text-foreground">Target date</dt> ·{" "}
        <dd className="inline">{day(goal.targetOn)}</dd>
      </div>
    </dl>
  );
}

/** Progress is shown only where the member sets it; other statuses leave it blank. */
function GoalProgress({ goal }: { goal: SharedGoal }) {
  if (goal.progress == null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <ProgressBar
      value={goal.progress}
      status={goal.status}
      label={goal.title}
    />
  );
}

function StatusChip({ status }: { status: Enums<"task_status"> }) {
  return (
    <Badge tone={statusTone[status]} dot>
      {status}
    </Badge>
  );
}

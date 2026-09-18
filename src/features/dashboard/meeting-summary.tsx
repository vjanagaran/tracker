import Link from "next/link";
import { formatMeetingWhen } from "@/features/boards/labels";
import { daysAwayLabel } from "./labels";
import type { DashboardMeeting } from "./types";

export function MeetingSummary({
  meeting,
  boardCount,
}: {
  meeting: DashboardMeeting | null;
  boardCount: number;
}) {
  if (!meeting) {
    // A member with no board is using this as a personal tool. Do not open
    // their day on the absence of a review group.
    if (boardCount === 0) {
      return null;
    }
    return (
      <section className="pb-card p-4 md:p-5">
        <p className="text-sm text-muted-foreground">
          No meeting on the calendar yet. The chairman schedules the next one.
        </p>
      </section>
    );
  }

  const counts =
    meeting.completedCount == null || meeting.openCount == null
      ? "Counts start once a meeting is on the calendar."
      : [
          meeting.since ? `Since ${meeting.since}` : "So far",
          `${meeting.completedCount} finished`,
          `${meeting.openCount} open now`,
        ].join(" · ");

  return (
    <section className="pb-card p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-medium tracking-tight">
          {meeting.boardName} · {formatMeetingWhen(meeting.scheduledAt)}
        </h2>
        <p className="text-sm text-muted-foreground">{daysAwayLabel(meeting.daysAway)}</p>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{counts}</p>
      <Link
        href={`/boards/${meeting.boardId}`}
        className="mt-2 inline-flex min-h-11 items-center text-xs text-primary underline-offset-4 hover:underline"
      >
        Open the board
      </Link>
    </section>
  );
}

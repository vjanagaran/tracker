import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { AddMeetingForm } from "./add-meeting-form";
import { EditAgendaForm } from "./edit-agenda-form";
import { formatMeetingWhen, meetingTone } from "./labels";
import { MoveMeetingForm } from "./move-meeting-form";
import type { BoardMeeting } from "./types";

const meetingStatusTone: Record<"Next" | "Scheduled" | "Held" | "Cancelled", BadgeTone> = {
  Next: "accent",
  Scheduled: "neutral",
  Held: "positive",
  Cancelled: "neutral",
};

type MeetingCalendarProps = {
  boardId: string;
  meetings: BoardMeeting[];
  nextMeetingId: string | null;
  selectedMeetingId: string | null;
  canSchedule: boolean;
};

export function MeetingCalendar({
  boardId,
  meetings,
  nextMeetingId,
  selectedMeetingId,
  canSchedule,
}: MeetingCalendarProps) {
  const next =
    meetings.find((meeting) => meeting.id === nextMeetingId) ?? null;

  return (
    <section>
      <h2 className="mb-3 text-lg font-normal tracking-tight">Meetings</h2>
      {meetings.length === 0 ? (
        <p className="mb-4 max-w-prose text-sm text-muted-foreground">
          No meetings yet. Add one to set the counting window.
        </p>
      ) : (
        <>
          <div className="pb-card mb-4 hidden overflow-hidden md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <th className="px-3 py-3">Date</th>
                  <th className="w-[120px] px-3 py-3">Status</th>
                  <th className="px-3 py-3">Agenda</th>
                  <th className="px-3 py-3">Notes</th>
                  <th className="w-[160px] px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {meetings.map((meeting) => {
                  const tone = meetingTone(meeting, next);
                  const selected = meeting.id === selectedMeetingId;
                  return (
                    <tr
                      key={meeting.id}
                      className="border-b border-border last:border-b-0"
                    >
                      <td className="px-3 py-4 text-sm">
                        <Link
                          href={`/boards/${boardId}?meeting=${meeting.id}`}
                          className={
                            selected
                              ? "font-medium text-foreground"
                              : "text-primary"
                          }
                        >
                          {formatMeetingWhen(meeting.scheduledAt)}
                        </Link>
                      </td>
                      <td className="px-3 py-4">
                        <StatusChip tone={tone} />
                      </td>
                      <td className="px-3 py-4 text-sm break-words whitespace-pre-line text-muted-foreground">
                        {meeting.agenda || "—"}
                      </td>
                      <td className="px-3 py-4 text-sm break-words text-muted-foreground">
                        {meeting.notes || "—"}
                      </td>
                      <td className="px-3 py-4">
                        {canSchedule && meeting.status !== "Cancelled" ? (
                          <div className="flex flex-wrap gap-1">
                            <MoveMeetingForm
                              boardId={boardId}
                              meetingId={meeting.id}
                              scheduledAt={meeting.scheduledAt}
                            />
                            <EditAgendaForm
                              boardId={boardId}
                              meetingId={meeting.id}
                              agenda={meeting.agenda}
                            />
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="pb-card mb-4 divide-y divide-border md:hidden">
            {meetings.map((meeting) => {
              const tone = meetingTone(meeting, next);
              const selected = meeting.id === selectedMeetingId;
              return (
                <li key={meeting.id} className="flex flex-col gap-2 px-4 py-4">
                  <Link
                    href={`/boards/${boardId}?meeting=${meeting.id}`}
                    className={`min-h-11 text-sm ${selected ? "font-medium" : "text-primary"}`}
                  >
                    {formatMeetingWhen(meeting.scheduledAt)}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone={tone} />
                  </div>
                  {meeting.agenda ? (
                    <p className="text-sm break-words whitespace-pre-line text-muted-foreground">
                      <span className="text-foreground">Agenda</span> · {meeting.agenda}
                    </p>
                  ) : null}
                  {meeting.notes ? (
                    <p className="text-sm break-words text-muted-foreground">
                      <span className="text-foreground">Notes</span> · {meeting.notes}
                    </p>
                  ) : null}
                  {canSchedule && meeting.status !== "Cancelled" ? (
                    <div className="flex flex-wrap gap-1">
                      <MoveMeetingForm
                        boardId={boardId}
                        meetingId={meeting.id}
                        scheduledAt={meeting.scheduledAt}
                      />
                      <EditAgendaForm
                        boardId={boardId}
                        meetingId={meeting.id}
                        agenda={meeting.agenda}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {canSchedule ? <AddMeetingForm boardId={boardId} /> : null}
    </section>
  );
}

function StatusChip({
  tone,
}: {
  tone: "Next" | "Scheduled" | "Held" | "Cancelled";
}) {
  return (
    <Badge tone={meetingStatusTone[tone]} dot>
      {tone}
    </Badge>
  );
}

import { MeetingSummary } from "./meeting-summary";
import { PlanGaps } from "./plan-gaps";
import { RecentNotes } from "./recent-notes";
import { TaskSummary } from "./task-summary";
import { WheelSummary } from "./wheel-summary";
import type { DashboardView } from "./types";

export function Dashboard({ view }: { view: DashboardView }) {
  return (
    <div className="flex flex-col gap-4">
      <MeetingSummary meeting={view.meeting} boardCount={view.boardCount} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <TaskSummary tasks={view.tasks} />
          <PlanGaps gaps={view.planGaps} />
        </div>
        <div className="flex flex-col gap-4">
          <WheelSummary wheels={view.wheels} />
          <RecentNotes notes={view.notes} />
        </div>
      </div>
    </div>
  );
}

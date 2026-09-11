import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { MeetingCalendar } from "@/features/boards/meeting-calendar";
import { loadBoardDashboard } from "@/features/boards/load";
import { VelocityTable } from "@/features/boards/velocity-table";
import { requireUser } from "@/lib/auth/require-user";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ meeting?: string }>;
};

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { boardId } = await params;
  const { meeting } = await searchParams;
  const { supabase, user } = await requireUser();
  const view = await loadBoardDashboard(supabase, user.id, boardId, meeting);

  if (!view) {
    notFound();
  }

  return (
    <>
      <PageHeader title={view.board.name} description={view.windowLabel} />
      <VelocityTable rows={view.velocity} />
      <MeetingCalendar
        boardId={view.board.id}
        meetings={view.meetings}
        nextMeetingId={view.nextMeetingId}
        selectedMeetingId={view.selectedMeeting?.id ?? null}
        canSchedule={view.canSchedule}
      />
    </>
  );
}

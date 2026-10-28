import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { BoardTabs } from "@/features/boards/board-tabs";
import { GoalsTab } from "@/features/boards/goals-tab";
import { MeetingCalendar } from "@/features/boards/meeting-calendar";
import { loadBoardDashboard, loadBoardGoals } from "@/features/boards/load";
import { MembersTable } from "@/features/boards/members-table";
import { parseBoardTab } from "@/features/boards/tabs";
import { requireUser } from "@/lib/auth/require-user";

type BoardPageProps = {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ tab?: string; member?: string }>;
};

export default async function BoardPage({ params, searchParams }: BoardPageProps) {
  const { boardId } = await params;
  const { tab: tabParam, member } = await searchParams;
  const tab = parseBoardTab(tabParam);
  const { supabase, user } = await requireUser();
  const view = await loadBoardDashboard(supabase, user.id, boardId);

  if (!view) {
    notFound();
  }

  const goals = tab === "goals" ? await loadBoardGoals(supabase, user.id, boardId) : null;
  if (tab === "goals" && !goals) {
    notFound();
  }

  return (
    <>
      <PageHeader title={view.board.name} />
      <BoardTabs boardId={view.board.id} active={tab} />
      {tab === "members" ? <MembersTable rows={view.members} /> : null}
      {tab === "meetings" ? (
        <MeetingCalendar
          boardId={view.board.id}
          meetings={view.meetings}
          nextMeetingId={view.nextMeetingId}
          canSchedule={view.canSchedule}
        />
      ) : null}
      {tab === "goals" && goals ? (
        <GoalsTab
          boardId={view.board.id}
          members={goals.members}
          selectedUserId={member ?? null}
        />
      ) : null}
    </>
  );
}

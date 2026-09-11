import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AddMemberForm } from "@/features/admin/add-member-form";
import { InviteForm } from "@/features/admin/invite-form";
import { inviteMember } from "@/features/admin/invite-actions";
import { loadAdminBoard } from "@/features/admin/load";
import { RosterTable } from "@/features/admin/roster-table";
import { cadenceLabel } from "@/features/boards/labels";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";

type AdminBoardPageProps = {
  params: Promise<{ boardId: string }>;
};

export default async function AdminBoardPage({ params }: AdminBoardPageProps) {
  const { boardId } = await params;
  const { supabase } = await requireSuperadmin();
  const view = await loadAdminBoard(supabase, boardId);

  if (!view) {
    notFound();
  }

  return (
    <>
      <p className="mb-3 text-sm">
        <Link href="/admin/boards" className="text-primary">
          Boards
        </Link>
      </p>
      <PageHeader
        title={view.board.name}
        description={`${cadenceLabel(view.board.cadenceDays, view.board.meetingWeekday)}. Members, meetings and counts stay on this board.`}
      />
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-normal tracking-tight">Members</h2>
        <RosterTable boardId={view.board.id} members={view.members} />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <InviteForm boardId={view.board.id} inviteMember={inviteMember} />
        <AddMemberForm boardId={view.board.id} people={view.availablePeople} />
      </div>
    </>
  );
}

import { PageHeader } from "@/components/page-header";
import { BoardsList } from "@/features/boards/boards-list";
import { loadMemberBoards } from "@/features/boards/load";
import { requireUser } from "@/lib/auth/require-user";

export default async function BoardsPage() {
  const { supabase, user } = await requireUser();
  const boards = await loadMemberBoards(supabase, user.id);

  return (
    <>
      <PageHeader
        title="Board"
        description="Boards you belong to. Open one to see finished and open counts."
      />
      <BoardsList boards={boards} />
    </>
  );
}

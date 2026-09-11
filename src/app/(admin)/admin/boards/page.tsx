import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CreateBoardForm } from "@/features/admin/create-board-form";
import { loadAdminBoards } from "@/features/admin/load";
import { cadenceLabel } from "@/features/boards/labels";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";

export default async function AdminBoardsPage() {
  const { supabase } = await requireSuperadmin();
  const boards = await loadAdminBoards(supabase);

  return (
    <>
      <PageHeader
        title="Boards"
        description="Create boards and open one to manage its roster. This role cannot read wheels, plans or tasks."
      />
      {boards.length === 0 ? (
        <p className="mb-6 max-w-prose text-sm text-muted-foreground">
          No boards yet. Create one to invite the first members.
        </p>
      ) : (
        <div className="pb-card mb-6 overflow-hidden">
          <table className="hidden w-full border-collapse md:table">
            <thead>
              <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-3">Board</th>
                <th className="w-[100px] px-3 py-3">Members</th>
                <th className="w-[180px] px-3 py-3">Meets</th>
                <th className="w-[80px] px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => (
                <tr key={board.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-4 text-sm font-medium">{board.name}</td>
                  <td className="px-3 py-4 text-sm">{board.memberCount}</td>
                  <td className="px-3 py-4 text-sm text-muted-foreground">
                    {cadenceLabel(board.cadenceDays, board.meetingWeekday)}
                  </td>
                  <td className="px-3 py-4 text-sm">
                    <Link
                      href={`/admin/boards/${board.id}`}
                      className="inline-flex items-center gap-1 text-primary"
                    >
                      Open
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y md:hidden">
            {boards.map((board) => (
              <li key={board.id}>
                <Link
                  href={`/admin/boards/${board.id}`}
                  className="flex min-h-14 flex-col justify-center px-4 py-3"
                >
                  <span className="text-sm font-medium">{board.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {board.memberCount} members · {cadenceLabel(board.cadenceDays, board.meetingWeekday)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <CreateBoardForm />
    </>
  );
}

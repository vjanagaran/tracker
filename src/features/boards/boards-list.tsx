import Link from "next/link";
import { cadenceLabel, roleLabel } from "./labels";
import type { MemberBoard } from "./types";

export function BoardsList({ boards }: { boards: MemberBoard[] }) {
  if (boards.length === 0) {
    return (
      <p className="max-w-prose text-sm text-muted-foreground">
        You will see a board here once you have been added to one.
      </p>
    );
  }

  return (
    <ul className="max-w-xl divide-y divide-border">
      {boards.map((board) => (
        <li key={board.id}>
          <Link
            href={`/boards/${board.id}`}
            className="flex min-h-14 flex-col justify-center py-3 hover:bg-foreground/[0.025]"
          >
            <span className="text-sm font-medium">{board.name}</span>
            <span className="text-xs text-muted-foreground">
              {roleLabel(board.role)} · {cadenceLabel(board.cadenceDays, board.meetingWeekday)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

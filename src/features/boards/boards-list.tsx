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
    <ul className="pb-card max-w-xl divide-y divide-border overflow-hidden">
      {boards.map((board) => (
        <li key={board.id}>
          <Link
            href={`/boards/${board.id}`}
            className="flex min-h-14 flex-col justify-center px-4 py-3 hover:bg-accent"
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

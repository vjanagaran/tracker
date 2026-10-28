import Link from "next/link";
import { cn } from "cn";
import { boardHref, BOARD_TABS, type BoardTab } from "./tabs";

export function BoardTabs({
  boardId,
  active,
}: {
  boardId: string;
  active: BoardTab;
}) {
  return (
    <nav aria-label="Board sections" className="mb-8 flex gap-1 border-b border-border">
      {BOARD_TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={boardHref(boardId, { tab: tab.id })}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              selected
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

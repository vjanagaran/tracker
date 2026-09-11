import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPeriod } from "@/features/wheel/period";
import type { WheelCycle, WheelSlug } from "@/features/wheel/types";

type CycleListProps = {
  slug: WheelSlug;
  cycles: WheelCycle[];
  earlierId?: string;
  laterId?: string;
};

export function CycleList({ slug, cycles, earlierId, laterId }: CycleListProps) {
  if (cycles.length === 0) {
    return (
      <p className="max-w-prose text-sm text-muted-foreground">
        No cycles yet. Start one from the wheel, then come back to overlay two
        ratings.
      </p>
    );
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-normal tracking-tight">Cycles</h2>
      <p className="mb-3 max-w-prose text-sm text-muted-foreground">
        Latest first. Open a cycle to edit its rating.
      </p>
      <ul className="pb-card max-w-xl divide-y divide-border overflow-hidden">
        {cycles.map((cycle, index) => {
          const selected = cycle.id === earlierId || cycle.id === laterId;
          return (
            <li
              key={cycle.id}
              className={`flex min-h-14 items-center justify-between gap-3 px-4 ${
                selected ? "bg-accent" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-sm">{formatPeriod(cycle.period)}</span>
                {index === 0 ? <Badge tone="accent">Latest</Badge> : null}
              </div>
              <Link
                href={`/wheel/${slug}?cycle=${cycle.id}`}
                className="inline-flex min-h-11 items-center gap-1 text-sm text-primary"
              >
                Open
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

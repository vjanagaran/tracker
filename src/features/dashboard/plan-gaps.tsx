import Link from "next/link";
import { DashboardCard } from "./dashboard-card";
import type { PlanGap } from "./types";

export function PlanGaps({ gaps }: { gaps: PlanGap[] }) {
  if (gaps.length === 0) {
    return null;
  }

  return (
    <DashboardCard title="Needs a plan">
      <ul className="divide-y divide-border">
        {gaps.map((gap) => (
          <li key={gap.spokeId} className="flex items-baseline justify-between gap-3 py-2.5">
            <Link
              href={`/spoke/${gap.spokeId}`}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              {gap.spokeName}
            </Link>
            <span className="shrink-0 text-[13px] whitespace-nowrap text-muted-foreground">
              {gap.wheelLabel} · you rated {gap.score}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Latest cycle. No action plan still active.
      </p>
    </DashboardCard>
  );
}

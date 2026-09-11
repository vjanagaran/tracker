import { ComparisonRadar } from "@/features/wheel/comparison-radar";
import { MovementTable } from "@/features/wheel/movement-table";
import { formatPeriod } from "@/features/wheel/period";
import type { CycleComparison } from "@/features/wheel/types";

type CycleMovementProps = {
  wheelLabel: string;
  comparison: CycleComparison;
};

export function CycleMovement({ wheelLabel, comparison }: CycleMovementProps) {
  const earlierLabel = formatPeriod(comparison.earlier.period);
  const laterLabel = formatPeriod(comparison.later.period);

  return (
    <section className="pb-card mb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
        <span>
          {wheelLabel} · movement
        </span>
        <span>
          {earlierLabel} → {laterLabel}
        </span>
      </div>
      <div className="flex flex-col gap-8 p-5 lg:flex-row lg:items-start">
        <div className="w-full lg:max-w-[360px] lg:flex-none">
          <ComparisonRadar
            axes={comparison.axes}
            earlierLabel={earlierLabel}
            laterLabel={laterLabel}
          />
        </div>
        <div className="min-w-0 flex-1">
          <MovementTable
            axes={comparison.axes}
            earlierLabel={earlierLabel}
            laterLabel={laterLabel}
          />
          <p className="mt-4 max-w-prose text-xs text-muted-foreground">
            The wheel getting rounder is the outcome. Not a completion
            percentage — a shape.
          </p>
        </div>
      </div>
    </section>
  );
}

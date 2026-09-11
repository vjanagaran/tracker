"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPeriod } from "@/features/wheel/period";
import type { WheelCycle, WheelSlug } from "@/features/wheel/types";

type CycleCompareControlsProps = {
  slug: WheelSlug;
  cycles: WheelCycle[];
  earlierId: string;
  laterId: string;
};

export function CycleCompareControls({
  slug,
  cycles,
  earlierId,
  laterId,
}: CycleCompareControlsProps) {
  const router = useRouter();

  function go(nextEarlier: string, nextLater: string) {
    const params = new URLSearchParams({
      earlier: nextEarlier,
      later: nextLater,
    });
    router.push(`/wheel/${slug}/cycles?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Earlier
        <Select value={earlierId} onValueChange={(value) => value && go(value, laterId)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id} disabled={cycle.id === laterId}>
                {formatPeriod(cycle.period)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Later
        <Select value={laterId} onValueChange={(value) => value && go(earlierId, value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {cycles.map((cycle) => (
              <SelectItem key={cycle.id} value={cycle.id} disabled={cycle.id === earlierId}>
                {formatPeriod(cycle.period)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}

import Link from "next/link";
import { WheelRadar } from "@/features/wheel/radar";
import { DashboardCard } from "./dashboard-card";
import { formatPeriod } from "./labels";
import type { DashboardWheel } from "./types";

export function WheelSummary({ wheels }: { wheels: DashboardWheel[] }) {
  if (wheels.length === 0) {
    return (
      <DashboardCard title="Wheels">
        <p className="text-sm text-muted-foreground">
          Your wheels are missing. Sign out and open your invite link again.
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard title="Wheels">
      <ul className="grid grid-cols-2 gap-4">
        {wheels.map((wheel) => (
          <li key={wheel.slug}>
            <WheelBlock wheel={wheel} />
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

function WheelBlock({ wheel }: { wheel: DashboardWheel }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-[160px]">
        {wheel.axes.length > 0 ? (
          <WheelRadar axes={wheel.axes} variant="mini" />
        ) : (
          <div
            className="aspect-square rounded-full border border-dashed border-border"
            aria-hidden="true"
          />
        )}
      </div>
      <Link
        href={`/wheel/${wheel.slug}`}
        className="mt-2 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
      >
        {wheel.title}
      </Link>
      <p className="text-xs text-muted-foreground">{status(wheel)}</p>
    </div>
  );
}

function status(wheel: DashboardWheel) {
  if (wheel.spokeCount === 0) {
    return "No spokes yet. Name the functions you run.";
  }
  if (!wheel.latestPeriod) {
    return "No rating yet. Start a cycle to score your spokes.";
  }
  if (wheel.ratedThisMonth) {
    return `Rated ${formatPeriod(wheel.latestPeriod)}`;
  }
  return `Last rated ${formatPeriod(wheel.latestPeriod)}`;
}

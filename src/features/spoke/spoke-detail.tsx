import Link from "next/link";
import { AddFocusArea } from "./add-focus-area";
import { FocusAreaCard } from "./focus-area-card";
import type { SpokeDetail } from "./types";

function wheelHref(type: SpokeDetail["wheelType"]) {
  return type === "WOL" ? "/wheel/life" : "/wheel/business";
}

function wheelLabel(type: SpokeDetail["wheelType"]) {
  return type === "WOL" ? "Life wheel" : "Business wheel";
}

function scoreCaption(spoke: SpokeDetail) {
  const today = spoke.scoreNow == null ? "—" : String(spoke.scoreNow);
  const year = spoke.target1y == null ? "—" : String(spoke.target1y);
  return `${wheelLabel(spoke.wheelType)} · ${today} today, ${year} in a year`;
}

export function SpokeDetailView({ spoke }: { spoke: SpokeDetail }) {
  return (
    <div>
      <p className="mb-3">
        <Link
          href={wheelHref(spoke.wheelType)}
          className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          {wheelLabel(spoke.wheelType)}
        </Link>
      </p>
      <header className="mb-6 border-b border-border pb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{spoke.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{scoreCaption(spoke)}</p>
      </header>

      {spoke.focusAreas.length === 0 ? (
        <p className="mb-4 max-w-prose text-sm text-muted-foreground">
          This spoke has no focus areas yet. Name the issue as it stands today.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {spoke.focusAreas.map((area) => (
            <FocusAreaCard key={area.id} area={area} />
          ))}
        </div>
      )}

      <div className={spoke.focusAreas.length === 0 ? "" : "mt-6"}>
        <AddFocusArea spokeId={spoke.id} />
      </div>
    </div>
  );
}

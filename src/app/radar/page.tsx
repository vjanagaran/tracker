import { CycleMovement } from "@/features/wheel/cycle-movement";
import { WheelRadar, type WheelRadarAxis } from "@/features/wheel/radar";
import type { ComparisonAxis } from "@/features/wheel/types";

const DEMO_AXES: WheelRadarAxis[] = [
  { id: "health", name: "Health", today: 3, oneYear: 5, fiveYears: 8 },
  { id: "family", name: "Family", today: 2, oneYear: 4, fiveYears: 8 },
  { id: "business", name: "Business", today: 5, oneYear: 7, fiveYears: 8 },
  { id: "finance", name: "Personal Finance", today: 2, oneYear: 5, fiveYears: 8 },
  { id: "growth", name: "Personal Growth", today: 4, oneYear: 6, fiveYears: 8 },
  { id: "fun", name: "Fun & Hobby", today: 3, oneYear: 5, fiveYears: 8 },
  { id: "spiritual", name: "Spiritual pursuits", today: 4, oneYear: 6, fiveYears: 8 },
  { id: "giving", name: "Giving back", today: 3, oneYear: 6, fiveYears: 8 },
];

const MOVEMENT_AXES: ComparisonAxis[] = [
  { id: "health", name: "Health", earlier: 3, later: 5 },
  { id: "family", name: "Family", earlier: 2, later: 4 },
  { id: "business", name: "Business", earlier: 5, later: 6 },
  { id: "finance", name: "Personal Finance", earlier: 2, later: 4 },
  { id: "growth", name: "Personal Growth", earlier: 4, later: 6 },
  { id: "fun", name: "Fun & Hobby", earlier: 3, later: 5 },
  { id: "spiritual", name: "Spiritual pursuits", earlier: 4, later: 6 },
  { id: "giving", name: "Giving back", earlier: 3, later: 5 },
];

export default function RadarPreviewPage() {
  return (
    <main id="main" className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight">Life wheel</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Hardcoded scores from the agreed wireframe. Same component at 375px and at desktop width.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm text-muted-foreground">375px</h2>
          <div className="pb-card w-[375px] max-w-full p-4">
            <WheelRadar axes={DEMO_AXES} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm text-muted-foreground">April → September</h2>
          <CycleMovement
            wheelLabel="Life wheel"
            comparison={{
              earlier: { id: "apr", period: "2026-04-01" },
              later: { id: "sep", period: "2026-09-01" },
              axes: MOVEMENT_AXES,
            }}
          />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-sm text-muted-foreground">Desktop</h2>
          <div className="pb-card p-8">
            <div className="w-full max-w-[520px]">
              <WheelRadar axes={DEMO_AXES} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

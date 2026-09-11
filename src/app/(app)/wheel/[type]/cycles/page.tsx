import { notFound } from "next/navigation";
import { CycleCompareControls } from "@/features/wheel/cycle-compare-controls";
import { CycleList } from "@/features/wheel/cycle-list";
import { CycleMovement } from "@/features/wheel/cycle-movement";
import { loadCycleComparison } from "@/features/wheel/load";
import { requireUser } from "@/lib/auth/require-user";
import type { Enums } from "@/lib/database.types";

const wheelBySlug = {
  life: { type: "WOL" as const, label: "Life wheel" },
  business: { type: "WOB" as const, label: "Business wheel" },
};

type CyclesPageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ earlier?: string; later?: string }>;
};

export default async function CyclesPage({ params, searchParams }: CyclesPageProps) {
  const { type } = await params;
  const { earlier, later } = await searchParams;
  const config = wheelBySlug[type as keyof typeof wheelBySlug];
  if (!config) {
    notFound();
  }

  const { supabase, user } = await requireUser();
  const { data: wheel } = await supabase
    .from("wheels")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", config.type satisfies Enums<"wheel_type">)
    .maybeSingle();

  if (!wheel) {
    notFound();
  }

  const { cycles, comparison } = await loadCycleComparison(
    supabase,
    wheel.id,
    earlier,
    later,
  );

  return (
    <div>
      <header className="mb-6 border-b border-border pb-4">
        <p className="mb-1 text-xs text-muted-foreground">
          {config.label} · movement
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">A year of scores</h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Because every rating is kept with its date, the wheel can be laid over
          its earlier self.
        </p>
      </header>

      {comparison ? (
        <>
          <CycleCompareControls
            slug={type as "life" | "business"}
            cycles={cycles}
            earlierId={comparison.earlier.id}
            laterId={comparison.later.id}
          />
          <CycleMovement wheelLabel={config.label} comparison={comparison} />
        </>
      ) : cycles.length === 1 ? (
        <p className="mb-8 max-w-prose text-sm text-muted-foreground">
          One cycle is on record. Start another from the wheel to overlay two
          ratings.
        </p>
      ) : null}

      <CycleList
        slug={type as "life" | "business"}
        cycles={cycles}
        earlierId={comparison?.earlier.id}
        laterId={comparison?.later.id}
      />
    </div>
  );
}

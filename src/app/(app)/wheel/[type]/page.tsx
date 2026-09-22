import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { WheelWorkspace } from "@/features/wheel/wheel-workspace";
import { loadWheelWorkspace } from "@/features/wheel/load";
import { requireUser } from "@/lib/auth/require-user";
import type { Enums } from "@/lib/database.types";

const wheelBySlug = {
  life: { type: "WOL" as const, title: "Life wheel" },
  business: { type: "WOB" as const, title: "Business wheel" },
};

type WheelPageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ cycle?: string }>;
};

export default async function WheelPage({ params, searchParams }: WheelPageProps) {
  const { type } = await params;
  const { cycle } = await searchParams;
  const config = wheelBySlug[type as keyof typeof wheelBySlug];
  if (!config) {
    notFound();
  }

  const { supabase, user } = await requireUser();
  const [{ data: wheel }, { data: profile }] = await Promise.all([
    supabase
      .from("wheels")
      .select("id, type")
      .eq("user_id", user.id)
      .eq("type", config.type satisfies Enums<"wheel_type">)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  if (!wheel) {
    return (
      <EmptyState>
        This wheel is missing. Sign out and open your invite link again.
      </EmptyState>
    );
  }

  const view = await loadWheelWorkspace(supabase, wheel.id, cycle);

  return (
    <WheelWorkspace
      key={view.selectedCycle?.id ?? "none"}
      slug={type as "life" | "business"}
      kind={config.type}
      title={config.title}
      ownerName={profile?.full_name ?? ""}
      wheelId={wheel.id}
      allSpokes={view.allSpokes}
      visibleSpokes={view.visibleSpokes}
      sheetSpokes={view.sheetSpokes}
      cycles={view.cycles}
      selectedCycle={view.selectedCycle}
      scores={view.scores}
      previousScores={view.previousScores}
    />
  );
}

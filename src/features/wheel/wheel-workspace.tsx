"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Settings } from "lucide-react";
import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCycle } from "./actions";
import { defaultNewPeriod, formatPeriod, monthInputValue, periodFromMonthInput } from "./period";
import { ScoreGrid } from "./score-grid";
import { SpokeManager } from "./spoke-manager";
import { useScoreGrid } from "./use-score-grid";
import { WheelKindSwitch } from "./wheel-kind-switch";
import { WheelPdfButton } from "./wheel-pdf-button";
import { WheelRadar } from "./radar";
import { WheelSheet } from "./wheel-sheet";
import type {
  ScoreTriple,
  WheelCycle,
  WheelKind,
  WheelSheetSpoke,
  WheelSlug,
  WheelSpoke,
} from "./types";

type WheelWorkspaceProps = {
  slug: WheelSlug;
  kind: WheelKind;
  title: string;
  ownerName: string;
  wheelId: string;
  allSpokes: WheelSpoke[];
  visibleSpokes: WheelSpoke[];
  sheetSpokes: WheelSheetSpoke[];
  cycles: WheelCycle[];
  selectedCycle: WheelCycle | null;
  scores: Record<string, ScoreTriple>;
  previousScores: Record<string, ScoreTriple>;
};

export function WheelWorkspace({
  slug,
  kind,
  title,
  ownerName,
  wheelId,
  allSpokes,
  visibleSpokes,
  sheetSpokes,
  cycles,
  selectedCycle,
  scores,
  previousScores,
}: WheelWorkspaceProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [spokesOpen, setSpokesOpen] = useState(
    () => kind === "WOB" && !allSpokes.some((spoke) => spoke.isActive),
  );
  const [view, setView] = useState<"table" | "chart">("chart");
  const [newPeriod, setNewPeriod] = useState(() =>
    monthInputValue(defaultNewPeriod(cycles.map((cycle) => cycle.period))),
  );
  const {
    scores: draft,
    updateScore,
    saveAll,
    isTouched,
    isSaving,
    saveError,
    saved,
  } = useScoreGrid(
    selectedCycle?.id ?? null,
    scores,
    visibleSpokes.map((spoke) => spoke.id),
  );

  const activeSpokes = allSpokes.filter((spoke) => spoke.isActive);
  const radarAxes = useMemo(
    () =>
      visibleSpokes.map((spoke) => {
        const score = draft[spoke.id] ?? {
          scoreNow: null,
          target1y: null,
          target5y: null,
        };
        return {
          id: spoke.id,
          name: spoke.name,
          today: score.scoreNow,
          oneYear: score.target1y,
          fiveYears: score.target5y,
        };
      }),
    [draft, visibleSpokes],
  );

  const startCycle = useMutation({
    mutationFn: async () =>
      createCycle({
        wheelId,
        period: periodFromMonthInput(newPeriod),
        slug,
      }),
    onSuccess: (result) => {
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      if (result.cycleId) {
        router.push(`/wheel/${slug}?cycle=${result.cycleId}`);
        router.refresh();
      }
    },
  });

  const emptyBusiness = kind === "WOB" && activeSpokes.length === 0;

  return (
    <div>
      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <WheelKindSwitch slug={slug} />
          <h1 className="text-[1.75rem] font-semibold tracking-tight md:text-[2rem]">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cycles.length > 0 ? (
            <Select
              value={selectedCycle?.id ?? null}
              items={cycles.map((cycle) => ({
                value: cycle.id,
                label: formatPeriod(cycle.period),
              }))}
              onValueChange={(value) => {
                if (value) {
                  router.push(`/wheel/${slug}?cycle=${value}`);
                }
              }}
            >
              <SelectTrigger className="w-40" aria-label="Cycle">
                <SelectValue placeholder="Select a cycle">
                  {selectedCycle ? formatPeriod(selectedCycle.period) : null}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {cycles.map((cycle) => (
                  <SelectItem key={cycle.id} value={cycle.id}>
                    {formatPeriod(cycle.period)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No rating yet. Start a cycle to score your spokes.
            </p>
          )}
          <input
            type="month"
            value={newPeriod}
            aria-label="Month for new cycle"
            onChange={(event) => setNewPeriod(event.target.value)}
            className="min-h-11 w-40 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
          />
          <Button
            type="button"
            className="min-h-11 px-4"
            disabled={startCycle.isPending}
            onClick={() => startCycle.mutate()}
          >
            <Plus className="size-4" aria-hidden="true" />
            {startCycle.isPending ? "Starting cycle" : "New cycle"}
          </Button>
          <Link
            href={`/wheel/${slug}/cycles`}
            className={cn(buttonVariants({ variant: "outline" }), "min-h-11 px-4")}
          >
            Compare
            <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
          <WheelPdfButton
            ownerName={ownerName}
            kind={kind}
            period={selectedCycle?.period ?? null}
            spokes={sheetSpokes}
            scores={draft}
            axes={radarAxes}
            disabled={emptyBusiness || visibleSpokes.length === 0}
          />
          {kind === "WOB" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label="Configure spokes"
              onClick={() => setSpokesOpen(true)}
            >
              <Settings className="size-5" />
            </Button>
          ) : null}
        </div>
      </header>

      {!emptyBusiness ? (
        <div className="mb-6 flex gap-1" role="tablist" aria-label="Wheel view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "table"}
            className={cn(
              "min-h-11 px-3 text-sm",
              view === "table"
                ? "border-b-2 border-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setView("table")}
          >
            Table
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "chart"}
            className={cn(
              "min-h-11 px-3 text-sm",
              view === "chart"
                ? "border-b-2 border-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setView("chart")}
          >
            Chart
          </button>
        </div>
      ) : null}

      {emptyBusiness ? (
        <div className="mb-4 max-w-prose">
          <p className="text-sm text-muted-foreground">
            Your business wheel has no spokes yet. Name the functions you run, then rate each one.
          </p>
          <Button
            type="button"
            className="mt-3 min-h-11 px-4"
            onClick={() => setSpokesOpen(true)}
          >
            Add spokes
          </Button>
        </div>
      ) : (
        view === "table" ? (
          <WheelSheet spokes={sheetSpokes} scores={draft} />
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-2">
            <WheelRadar axes={radarAxes} />
            <div>
              {visibleSpokes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No spokes to score in this cycle.
                </p>
              ) : (
                <ScoreGrid
                  spokes={visibleSpokes}
                  scores={draft}
                  previousScores={previousScores}
                  disabled={!selectedCycle}
                  isTouched={isTouched}
                  onChange={updateScore}
                />
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  className="min-h-11 px-4"
                  disabled={!selectedCycle || isSaving}
                  onClick={() => saveAll()}
                >
                  {isSaving ? "Saving this rating" : "Save this rating"}
                </Button>
                {saved ? <p className="text-sm text-muted-foreground">Rating saved</p> : null}
              </div>
            </div>
          </div>
        )
      )}

      {error || saveError ? (
        <p className="mt-4 text-sm text-destructive">{error ?? saveError}</p>
      ) : null}

      {kind === "WOB" ? (
        <SpokeManager
          wheelId={wheelId}
          spokes={allSpokes}
          open={spokesOpen}
          onOpenChange={setSpokesOpen}
        />
      ) : null}
    </div>
  );
}

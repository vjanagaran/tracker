"use client";

import Link from "next/link";
import { ScoreStepper } from "@/features/wheel/score-stepper";
import { isPrefill } from "@/features/wheel/labels";
import type { ScoreTriple, WheelSpoke } from "@/features/wheel/types";

type ScoreGridProps = {
  spokes: WheelSpoke[];
  scores: Record<string, ScoreTriple>;
  previousScores: Record<string, ScoreTriple>;
  disabled?: boolean;
  isTouched: (spokeId: string, field: keyof ScoreTriple) => boolean;
  onChange: (spokeId: string, field: keyof ScoreTriple, value: number | null) => void;
};

export function ScoreGrid({
  spokes,
  scores,
  previousScores,
  disabled = false,
  isTouched,
  onChange,
}: ScoreGridProps) {
  return (
    <>
      <p className="mb-3 text-xs text-muted-foreground">
        Italic dashed numbers are carried from the last cycle. Change a value to keep it.
      </p>
      <table className="hidden w-full border-collapse md:table">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
            <th className="py-2 pr-3 font-semibold">Spoke</th>
            <th className="py-2 px-2 text-center font-semibold">Today</th>
            <th className="py-2 px-2 text-center font-semibold">1 yr</th>
            <th className="py-2 pl-2 text-center font-semibold">5 yr</th>
          </tr>
        </thead>
        <tbody>
          {spokes.map((spoke) => {
            const score = scores[spoke.id] ?? emptyScore();
            const previous = previousScores[spoke.id] ?? emptyScore();
            return (
              <tr key={spoke.id} className="border-b border-border/70">
                <td className="py-3 pr-3 text-sm">
                  <Link
                    href={`/spoke/${spoke.id}`}
                    className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline"
                  >
                    {spoke.name}
                  </Link>
                </td>
                <td className="py-3 px-2 text-center">
                  <ScoreStepper
                    label={`${spoke.name} today`}
                    value={score.scoreNow}
                    prefill={
                      !isTouched(spoke.id, "scoreNow") &&
                      isPrefill(score.scoreNow, previous.scoreNow)
                    }
                    disabled={disabled}
                    onChange={(value) => onChange(spoke.id, "scoreNow", value)}
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <ScoreStepper
                    label={`${spoke.name} one year`}
                    value={score.target1y}
                    prefill={
                      !isTouched(spoke.id, "target1y") &&
                      isPrefill(score.target1y, previous.target1y)
                    }
                    disabled={disabled}
                    onChange={(value) => onChange(spoke.id, "target1y", value)}
                  />
                </td>
                <td className="py-3 pl-2 text-center">
                  <ScoreStepper
                    label={`${spoke.name} five years`}
                    value={score.target5y}
                    prefill={
                      !isTouched(spoke.id, "target5y") &&
                      isPrefill(score.target5y, previous.target5y)
                    }
                    disabled={disabled}
                    onChange={(value) => onChange(spoke.id, "target5y", value)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ul className="divide-y divide-border md:hidden">
        {spokes.map((spoke) => {
          const score = scores[spoke.id] ?? emptyScore();
          const previous = previousScores[spoke.id] ?? emptyScore();
          return (
            <li key={spoke.id} className="py-4">
              <p className="mb-3 text-sm font-medium">
                <Link
                  href={`/spoke/${spoke.id}`}
                  className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline"
                >
                  {spoke.name}
                </Link>
              </p>
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  Today
                  <ScoreStepper
                    label={`${spoke.name} today`}
                    value={score.scoreNow}
                    prefill={
                      !isTouched(spoke.id, "scoreNow") &&
                      isPrefill(score.scoreNow, previous.scoreNow)
                    }
                    disabled={disabled}
                    onChange={(value) => onChange(spoke.id, "scoreNow", value)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  1 yr
                  <ScoreStepper
                    label={`${spoke.name} one year`}
                    value={score.target1y}
                    prefill={
                      !isTouched(spoke.id, "target1y") &&
                      isPrefill(score.target1y, previous.target1y)
                    }
                    disabled={disabled}
                    onChange={(value) => onChange(spoke.id, "target1y", value)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  5 yr
                  <ScoreStepper
                    label={`${spoke.name} five years`}
                    value={score.target5y}
                    prefill={
                      !isTouched(spoke.id, "target5y") &&
                      isPrefill(score.target5y, previous.target5y)
                    }
                    disabled={disabled}
                    onChange={(value) => onChange(spoke.id, "target5y", value)}
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function emptyScore(): ScoreTriple {
  return { scoreNow: null, target1y: null, target5y: null };
}

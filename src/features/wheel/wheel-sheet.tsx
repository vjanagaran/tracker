import Link from "next/link";
import { formatPlanTaskCount } from "./labels";
import type { ScoreTriple, WheelSheetFocus, WheelSheetPlan, WheelSheetSpoke } from "./types";

type WheelSheetProps = {
  spokes: WheelSheetSpoke[];
  scores: Record<string, ScoreTriple>;
};

function scoreText(value: number | null) {
  return value == null ? "—" : String(value);
}

function text(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function spokeRowCount(spoke: WheelSheetSpoke) {
  if (spoke.focusAreas.length === 0) {
    return 1;
  }
  return spoke.focusAreas.reduce(
    (count, focus) => count + Math.max(focus.plans.length, 1),
    0,
  );
}

type SheetRow = {
  key: string;
  index: number;
  spoke: WheelSheetSpoke;
  spokeSpan: number;
  showSpoke: boolean;
  focus: WheelSheetFocus | null;
  focusSpan: number;
  showFocus: boolean;
  plan: WheelSheetPlan | null;
};

function buildRows(spokes: WheelSheetSpoke[]): SheetRow[] {
  const rows: SheetRow[] = [];

  spokes.forEach((spoke, index) => {
    const spokeSpan = spokeRowCount(spoke);
    if (spoke.focusAreas.length === 0) {
      rows.push({
        key: spoke.id,
        index,
        spoke,
        spokeSpan,
        showSpoke: true,
        focus: null,
        focusSpan: 1,
        showFocus: true,
        plan: null,
      });
      return;
    }

    spoke.focusAreas.forEach((focus, focusIndex) => {
      const plans = focus.plans.length > 0 ? focus.plans : [null];
      plans.forEach((plan, planIndex) => {
        rows.push({
          key: `${spoke.id}-${focus.id}-${plan?.id ?? "empty"}`,
          index,
          spoke,
          spokeSpan,
          showSpoke: focusIndex === 0 && planIndex === 0,
          focus,
          focusSpan: plans.length,
          showFocus: planIndex === 0,
          plan,
        });
      });
    });
  });

  return rows;
}

export function WheelSheet({ spokes, scores }: WheelSheetProps) {
  if (spokes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No spokes to show in this cycle.
      </p>
    );
  }

  const rows = buildRows(spokes);

  return (
    <>
      <div className="hidden md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th className="w-10 py-2 pr-3">No.</th>
              <th className="py-2 pr-3">Area</th>
              <th className="w-14 py-2 pr-3 text-center">Now</th>
              <th className="w-16 py-2 pr-3 text-center">1 year</th>
              <th className="w-16 py-2 pr-3 text-center">5 years</th>
              <th className="py-2 pr-3">Current state</th>
              <th className="py-2 pr-3">1 year goal</th>
              <th className="py-2 pr-3">5 year goal</th>
              <th className="py-2 pr-3">Action plan</th>
              <th className="py-2 pr-3">Challenge</th>
              <th className="w-16 py-2 text-right">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const score = scores[row.spoke.id];
              return (
                <tr key={row.key} className="align-top">
                  {row.showSpoke ? (
                    <>
                      <td
                        rowSpan={row.spokeSpan}
                        className="border-b border-border py-3 pr-3 text-muted-foreground"
                      >
                        {row.index + 1}
                      </td>
                      <td rowSpan={row.spokeSpan} className="border-b border-border py-3 pr-3">
                        <Link
                          href={`/spoke/${row.spoke.id}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {row.spoke.name}
                        </Link>
                      </td>
                      <td
                        rowSpan={row.spokeSpan}
                        className="border-b border-border py-3 pr-3 text-center"
                      >
                        {scoreText(score?.scoreNow ?? null)}
                      </td>
                      <td
                        rowSpan={row.spokeSpan}
                        className="border-b border-border py-3 pr-3 text-center"
                      >
                        {scoreText(score?.target1y ?? null)}
                      </td>
                      <td
                        rowSpan={row.spokeSpan}
                        className="border-b border-border py-3 pr-3 text-center"
                      >
                        {scoreText(score?.target5y ?? null)}
                      </td>
                    </>
                  ) : null}
                  {row.showFocus ? (
                    <>
                      <td
                        rowSpan={row.focusSpan}
                        className="border-b border-border py-3 pr-3 break-words"
                      >
                        {text(row.focus?.currentIssue)}
                      </td>
                      <td
                        rowSpan={row.focusSpan}
                        className="border-b border-border py-3 pr-3 break-words"
                      >
                        {text(row.focus?.goal1y)}
                      </td>
                      <td
                        rowSpan={row.focusSpan}
                        className="border-b border-border py-3 pr-3 break-words"
                      >
                        {text(row.focus?.goal5y)}
                      </td>
                    </>
                  ) : null}
                  <td className="border-b border-border py-3 pr-3 break-words">
                    {text(row.plan?.description)}
                  </td>
                  <td className="border-b border-border py-3 pr-3 break-words">
                    {text(row.plan?.challenge)}
                  </td>
                  <td className="border-b border-border py-3 text-right tabular-nums">
                    {formatPlanTaskCount(
                      row.plan?.completedTasks ?? 0,
                      row.plan?.totalTasks ?? 0,
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {spokes.map((spoke, index) => {
          const score = scores[spoke.id];
          return (
            <li key={spoke.id} className="py-4">
              <p className="text-xs text-muted-foreground">{index + 1}</p>
              <Link
                href={`/spoke/${spoke.id}`}
                className="inline-flex min-h-11 items-center text-base font-medium text-primary underline-offset-4 hover:underline"
              >
                {spoke.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                Now {scoreText(score?.scoreNow ?? null)} · 1 year{" "}
                {scoreText(score?.target1y ?? null)} · 5 years{" "}
                {scoreText(score?.target5y ?? null)}
              </p>
              {spoke.focusAreas.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  No focus areas yet.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-4">
                  {spoke.focusAreas.map((focus) => (
                    <li key={focus.id}>
                      <p className="text-sm">{focus.currentIssue}</p>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        1 year {text(focus.goal1y)} · 5 years {text(focus.goal5y)}
                      </p>
                      {focus.plans.length > 0 ? (
                        <ul className="mt-2 flex flex-col gap-1.5">
                          {focus.plans.map((plan) => (
                            <li key={plan.id} className="text-[13px]">
                              {plan.description}
                              {plan.challenge ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {plan.challenge}
                                </span>
                              ) : null}
                              <span className="text-muted-foreground">
                                {" "}
                                · {formatPlanTaskCount(plan.completedTasks, plan.totalTasks)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

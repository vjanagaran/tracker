"use client";

import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { planLabel } from "./labels";
import { wheelName } from "./scope";
import type { PlanOption, TaskTreeWheel } from "./types";

type PlanPickerProps = {
  catalog: PlanOption[];
  tree: TaskTreeWheel[];
  value: string[];
  onChange: (planIds: string[]) => void;
};

/** A plan's place on the wheels, for the line under a search result. */
function planPath(plan: PlanOption) {
  return `${wheelName(plan.wheelType)} / ${plan.spokeName} / ${plan.focusIssue}`;
}

export function PlanPicker({ catalog, tree, value, onChange }: PlanPickerProps) {
  const [query, setQuery] = useState("");
  const [browsing, setBrowsing] = useState(false);
  const selected = catalog.filter((plan) => value.includes(plan.id));
  const available = useMemo(
    () => catalog.filter((plan) => !value.includes(plan.id)),
    [catalog, value],
  );
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return [];
    }
    return available
      .filter(
        (plan) =>
          plan.description.toLowerCase().includes(needle) ||
          plan.spokeName.toLowerCase().includes(needle) ||
          plan.focusIssue.toLowerCase().includes(needle),
      )
      .slice(0, 20);
  }, [available, query]);

  function add(plan: PlanOption) {
    onChange([...value, plan.id]);
    setQuery("");
    setBrowsing(false);
  }

  const searching = query.trim() !== "";

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {selected.map((plan) => (
            <li
              key={plan.id}
              className="pb-card flex items-start justify-between gap-3 px-3 py-2"
            >
              <span className="min-w-0 text-sm break-words">{planLabel(plan)}</span>
              <button
                type="button"
                className="min-h-11 shrink-0 text-sm text-primary underline-offset-4 hover:underline"
                onClick={() => onChange(value.filter((id) => id !== plan.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-11 min-w-0 flex-1"
          placeholder="Search action plans"
          aria-label="Search action plans on either wheel"
        />
        {catalog.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 px-3"
            aria-expanded={browsing}
            onClick={() => setBrowsing(!browsing)}
          >
            {browsing ? "Hide list" : "Browse"}
          </Button>
        ) : null}
      </div>

      {catalog.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No action plans yet. A task can stand on its own.
        </p>
      ) : searching ? (
        matches.length === 0 ? (
          <p className="text-xs text-muted-foreground">No action plans match that search.</p>
        ) : (
          <ul className="pb-card overflow-hidden">
            {matches.map((plan) => (
              <li key={plan.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  className="flex min-h-11 w-full flex-col items-start justify-center px-3 py-2 text-left"
                  onClick={() => add(plan)}
                >
                  <span className="text-sm break-words">{plan.description}</span>
                  <span className="text-xs text-muted-foreground">{planPath(plan)}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : !browsing ? null : available.length === 0 ? (
        <p className="text-xs text-muted-foreground">Every action plan is already linked.</p>
      ) : (
        <div className="pb-card max-h-72 overflow-y-auto">
          {tree.map((wheel) => {
            const spokes = wheel.spokes.flatMap((spoke) => {
              const focusAreas = spoke.focusAreas.flatMap((focus) => {
                const plans = available.filter((plan) => plan.focusAreaId === focus.id);
                return plans.length > 0 ? [{ focus, plans }] : [];
              });
              return focusAreas.length > 0 ? [{ spoke, focusAreas }] : [];
            });
            if (spokes.length === 0) {
              return null;
            }
            return (
              <section key={wheel.type} aria-label={wheelName(wheel.type)}>
                <h4 className="bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {wheelName(wheel.type)}
                </h4>
                {spokes.map(({ spoke, focusAreas }) => (
                  <details key={spoke.id} className="group border-b border-border last:border-b-0">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm [&::-webkit-details-marker]:hidden">
                      <ChevronRight
                        className="size-4 text-muted-foreground transition-transform group-open:rotate-90"
                        aria-hidden="true"
                      />
                      {spoke.name}
                      {!spoke.isActive ? (
                        <span className="text-xs text-muted-foreground">(inactive)</span>
                      ) : null}
                    </summary>
                    <div className="pb-2 pl-9 pr-3">
                      {focusAreas.map(({ focus, plans }) => (
                        <div key={focus.id}>
                          <p className="pt-1 text-xs text-muted-foreground">{focus.issue}</p>
                          <ul>
                            {plans.map((plan) => (
                              <li key={plan.id}>
                                <button
                                  type="button"
                                  className="min-h-11 w-full py-2 text-left text-sm break-words hover:text-primary"
                                  onClick={() => add(plan)}
                                >
                                  {plan.description}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { planLabel } from "./labels";
import type { PlanOption } from "./types";

type PlanPickerProps = {
  catalog: PlanOption[];
  value: string[];
  onChange: (planIds: string[]) => void;
};

export function PlanPicker({ catalog, value, onChange }: PlanPickerProps) {
  const [query, setQuery] = useState("");
  const selected = catalog.filter((plan) => value.includes(plan.id));
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog
      .filter((plan) => !value.includes(plan.id))
      .filter((plan) => {
        if (!needle) {
          return false;
        }
        return (
          plan.description.toLowerCase().includes(needle) ||
          plan.spokeName.toLowerCase().includes(needle) ||
          plan.focusIssue.toLowerCase().includes(needle)
        );
      })
      .slice(0, 20);
  }, [catalog, query, value]);

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
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-h-11"
        placeholder="Search action plans on either wheel"
        aria-label="Search action plans"
      />
      {catalog.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No action plans yet. A task can stand on its own.
        </p>
      ) : query.trim() === "" ? (
        <p className="text-xs text-muted-foreground">
          Type to find an action plan on either wheel.
        </p>
      ) : matches.length === 0 ? (
        <p className="text-xs text-muted-foreground">No action plans match that search.</p>
      ) : (
        <ul className="pb-card overflow-hidden">
          {matches.map((plan) => (
            <li key={plan.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                className="flex min-h-11 w-full flex-col items-start justify-center px-3 py-2 text-left"
                onClick={() => {
                  onChange([...value, plan.id]);
                  setQuery("");
                }}
              >
                <span className="text-sm break-words">{planLabel(plan)}</span>
                <span className="text-xs text-muted-foreground">{plan.focusIssue}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

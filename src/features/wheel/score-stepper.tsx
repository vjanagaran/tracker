"use client";

import { cn } from "cn";

type ScoreStepperProps = {
  label: string;
  value: number | null;
  prefill?: boolean;
  disabled?: boolean;
  onChange: (value: number | null) => void;
};

export function ScoreStepper({
  label,
  value,
  prefill = false,
  disabled = false,
  onChange,
}: ScoreStepperProps) {
  function decrease() {
    if (value == null) {
      return;
    }
    onChange(value <= 0 ? null : value - 1);
  }

  function increase() {
    if (value == null) {
      onChange(0);
      return;
    }
    if (value < 10) {
      onChange(value + 1);
    }
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-base disabled:opacity-40"
        aria-label={`Decrease ${label}`}
        disabled={disabled || value == null}
        onClick={decrease}
      >
        −
      </button>
      <span
        className={cn(
          "flex h-11 min-w-11 items-center justify-center rounded-full border text-sm font-medium",
          prefill
            ? "border-dashed border-[#3d6588] bg-accent text-[#3d6588] italic"
            : "border-solid border-[#1f4e79] bg-card font-semibold text-[#1f4e79]",
          value == null &&
            "border-solid border-border bg-card font-normal not-italic text-muted-foreground",
        )}
        aria-live="polite"
        aria-label={
          prefill
            ? `${label}: ${value}, carried from last cycle`
            : `${label}: ${value ?? "not scored"}`
        }
      >
        {value ?? "—"}
      </span>
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-full border border-border bg-card text-base disabled:opacity-40"
        aria-label={`Increase ${label}`}
        disabled={disabled || value === 10}
        onClick={increase}
      >
        +
      </button>
    </div>
  );
}

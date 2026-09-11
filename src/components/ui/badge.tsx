import type { HTMLAttributes } from "react";
import { cn } from "cn";

export type BadgeTone = "neutral" | "accent" | "positive" | "warn";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-card text-muted-foreground",
  accent: "border-primary/25 bg-accent text-primary",
  positive: "border-status-positive/25 bg-card text-status-positive",
  warn: "border-status-warn/25 bg-card text-status-warn",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted-foreground/50",
  accent: "bg-primary",
  positive: "bg-status-positive",
  warn: "bg-status-warn",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  dot?: boolean;
};

export function Badge({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {dot ? <Dot className={dotClasses[tone]} /> : null}
      {children}
    </span>
  );
}

export type DotProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Dot({ tone, className, ...props }: DotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        tone ? dotClasses[tone] : "bg-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

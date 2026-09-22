const WOL_SHORT: Record<string, string> = {
  Health: "Health",
  Family: "Family",
  Business: "Business",
  "Personal Finance": "Finance",
  "Personal Growth": "Growth",
  "Fun & Hobby": "Fun",
  "Giving back": "Giving",
  "Spiritual pursuits": "Spiritual",
};

/** Shorten in the data. The SVG must never clip a label. */
export function radarLabel(name: string): string {
  if (WOL_SHORT[name]) {
    return WOL_SHORT[name];
  }
  if (name.length <= 12) {
    return name;
  }
  const firstWord = name.split(/\s+/)[0] ?? name;
  if (firstWord.length <= 12) {
    return firstWord;
  }
  return firstWord.slice(0, 12);
}

export function isPrefill(
  current: number | null,
  previous: number | null,
): boolean {
  return previous != null && current != null && current === previous;
}

export function formatMove(earlier: number | null, later: number | null) {
  if (earlier == null || later == null) {
    return { label: "—", tone: "none" as const };
  }
  const delta = later - earlier;
  if (delta > 0) {
    return { label: `+${delta}`, tone: "up" as const };
  }
  if (delta < 0) {
    return { label: `−${Math.abs(delta)}`, tone: "down" as const };
  }
  return { label: "0", tone: "flat" as const };
}

export type PlanTaskTally = {
  completed: number;
  total: number;
};

/** Completed / remaining-relevant tasks working toward a plan. Cancelled is out. */
export function tallyPlanTaskCounts(
  rows: { actionPlanId: string; status: string }[],
): Map<string, PlanTaskTally> {
  const counts = new Map<string, PlanTaskTally>();
  for (const row of rows) {
    if (row.status === "Cancelled") {
      continue;
    }
    const current = counts.get(row.actionPlanId) ?? { completed: 0, total: 0 };
    current.total += 1;
    if (row.status === "Completed") {
      current.completed += 1;
    }
    counts.set(row.actionPlanId, current);
  }
  return counts;
}

export function formatPlanTaskCount(completed: number, total: number) {
  if (total === 0) {
    return "—";
  }
  return `${completed}/${total}`;
}

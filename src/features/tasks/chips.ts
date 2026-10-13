import type { PlanOption, TaskItem, WheelType } from "./types";

export type TaskChip = {
  key: string;
  label: string;
  /** Null for an open item, which belongs to neither wheel. */
  wheel: WheelType | null;
};

function wheelShort(wheel: WheelType) {
  return wheel === "WOL" ? "Life" : "Business";
}

/**
 * Where a task sits on the wheels, as short labels. Plans decide first, one
 * chip per spoke; a task with no plan falls back to its tag.
 */
export function taskChips(
  task: Pick<TaskItem, "planIds" | "tag">,
  planById: ReadonlyMap<string, PlanOption>,
): TaskChip[] {
  const seen = new Set<string>();
  const chips: TaskChip[] = [];

  for (const planId of task.planIds) {
    const plan = planById.get(planId);
    if (!plan) {
      continue;
    }
    const key = `${plan.wheelType}:${plan.spokeName}`;
    if (!seen.has(key)) {
      seen.add(key);
      chips.push({
        key,
        label: `${wheelShort(plan.wheelType)} · ${plan.spokeName}`,
        wheel: plan.wheelType,
      });
    }
  }

  if (chips.length > 0) {
    return chips;
  }
  if (task.tag === "WOL" || task.tag === "WOB") {
    return [{ key: task.tag, label: wheelShort(task.tag), wheel: task.tag }];
  }
  if (task.tag === "OPEN") {
    return [{ key: "OPEN", label: "Open item", wheel: null }];
  }
  return [];
}

/** The plan descriptions a task works toward, for the quiet line under the chips. */
export function planDescriptions(
  task: Pick<TaskItem, "planIds">,
  planById: ReadonlyMap<string, PlanOption>,
): string[] {
  return task.planIds.flatMap((id) => {
    const plan = planById.get(id);
    return plan ? [plan.description] : [];
  });
}

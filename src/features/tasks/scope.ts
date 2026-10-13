import { addDays } from "./dates.ts";
import type { PlanOption, TaskItem, TaskTreeWheel, WheelType } from "./types";

/** Which tasks the list shows. Open tasks can also be narrowed by date. */
export type TaskView = "open" | "completed" | "cancelled";

export type TaskWhen = "all" | "overdue" | "today" | "tomorrow" | "next7" | "month";

export const TASK_WHEN: TaskWhen[] = ["all", "overdue", "today", "tomorrow", "next7", "month"];

export type TaskNode =
  | { kind: "wheel"; wheel: WheelType }
  | { kind: "spoke"; id: string }
  | { kind: "focus"; id: string }
  | { kind: "unlinked"; wheel: WheelType };

export type TaskScope = {
  view: TaskView;
  when: TaskWhen;
  node: TaskNode | null;
};

export const INITIAL_SCOPE: TaskScope = { view: "open", when: "all", node: null };

export function whenLabel(when: TaskWhen) {
  if (when === "overdue") return "Overdue";
  if (when === "today") return "Today";
  if (when === "tomorrow") return "Tomorrow";
  if (when === "next7") return "Next 7 days";
  if (when === "month") return "This month";
  return "All";
}

export function wheelName(wheel: WheelType) {
  return wheel === "WOL" ? "Wheel of Life" : "Wheel of Business";
}

export const UNLINKED_LABEL = "No focus area";

/** Names from the wheel down to the chosen row, for headings. */
export function nodePath(node: TaskNode, tree: readonly TaskTreeWheel[]): string[] {
  if (node.kind === "wheel") {
    return [wheelName(node.wheel)];
  }
  if (node.kind === "unlinked") {
    return [wheelName(node.wheel), UNLINKED_LABEL];
  }
  for (const wheel of tree) {
    for (const spoke of wheel.spokes) {
      if (node.kind === "spoke" && spoke.id === node.id) {
        return [wheelName(wheel.type), spoke.name];
      }
      if (node.kind === "focus") {
        const focus = spoke.focusAreas.find((row) => row.id === node.id);
        if (focus) {
          return [wheelName(wheel.type), spoke.name, focus.issue];
        }
      }
    }
  }
  return [];
}

export function nodeKey(node: TaskNode): string {
  if (node.kind === "wheel") return `wheel:${node.wheel}`;
  if (node.kind === "unlinked") return `unlinked:${node.wheel}`;
  return `${node.kind}:${node.id}`;
}

export function sameNode(a: TaskNode | null, b: TaskNode | null) {
  if (!a || !b) {
    return a === b;
  }
  return nodeKey(a) === nodeKey(b);
}

/** Lookups from a plan up to its focus area, spoke and wheel. */
export type ScopeIndex = {
  planToFocus: Map<string, string>;
  focusToSpoke: Map<string, string>;
  spokeToWheel: Map<string, WheelType>;
};

export function buildScopeIndex(
  tree: readonly TaskTreeWheel[],
  plans: readonly Pick<PlanOption, "id" | "focusAreaId">[],
): ScopeIndex {
  const planToFocus = new Map<string, string>();
  const focusToSpoke = new Map<string, string>();
  const spokeToWheel = new Map<string, WheelType>();

  for (const plan of plans) {
    planToFocus.set(plan.id, plan.focusAreaId);
  }
  for (const wheel of tree) {
    for (const spoke of wheel.spokes) {
      spokeToWheel.set(spoke.id, wheel.type);
      for (const focus of spoke.focusAreas) {
        focusToSpoke.set(focus.id, spoke.id);
      }
    }
  }
  return { planToFocus, focusToSpoke, spokeToWheel };
}

/**
 * Every tree row a task belongs to. A task reaches a focus area through the
 * plans it works toward, and it may reach several. With no plan, a task
 * tagged Life or Business sits under that wheel's "no focus area" row.
 */
export function nodeKeysForTask(
  task: Pick<TaskItem, "planIds" | "tag">,
  index: ScopeIndex,
): Set<string> {
  const keys = new Set<string>();
  for (const planId of task.planIds) {
    const focusId = index.planToFocus.get(planId);
    const spokeId = focusId ? index.focusToSpoke.get(focusId) : undefined;
    const wheel = spokeId ? index.spokeToWheel.get(spokeId) : undefined;
    if (focusId && spokeId && wheel) {
      keys.add(`focus:${focusId}`);
      keys.add(`spoke:${spokeId}`);
      keys.add(`wheel:${wheel}`);
    }
  }
  if (keys.size === 0 && (task.tag === "WOL" || task.tag === "WOB")) {
    keys.add(`unlinked:${task.tag}`);
    keys.add(`wheel:${task.tag}`);
  }
  return keys;
}

export { addDays };

export function matchesWhen(targetOn: string | null, when: TaskWhen, today: string): boolean {
  if (when === "all") {
    return true;
  }
  if (!targetOn) {
    return false;
  }
  if (when === "overdue") return targetOn < today;
  if (when === "today") return targetOn === today;
  if (when === "tomorrow") return targetOn === addDays(today, 1);
  if (when === "next7") return targetOn >= today && targetOn <= addDays(today, 6);
  return targetOn.slice(0, 7) === today.slice(0, 7);
}

function matchesView(task: Pick<TaskItem, "status">, view: TaskView) {
  if (view === "completed") return task.status === "Completed";
  if (view === "cancelled") return task.status === "Cancelled";
  return task.status !== "Completed" && task.status !== "Cancelled";
}

function matchesBase(task: TaskItem, view: TaskView, when: TaskWhen, today: string) {
  if (!matchesView(task, view)) {
    return false;
  }
  return view === "open" ? matchesWhen(task.targetOn, when, today) : true;
}

export function filterTasks(
  tasks: readonly TaskItem[],
  scope: TaskScope,
  today: string,
  index: ScopeIndex,
): TaskItem[] {
  const key = scope.node ? nodeKey(scope.node) : null;
  return tasks.filter(
    (task) =>
      matchesBase(task, scope.view, scope.when, today) &&
      (key == null || nodeKeysForTask(task, index).has(key)),
  );
}

/** How many tasks sit on each tree row under the chosen view and date. */
export function countByNode(
  tasks: readonly TaskItem[],
  scope: Pick<TaskScope, "view" | "when">,
  today: string,
  index: ScopeIndex,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const task of tasks) {
    if (!matchesBase(task, scope.view, scope.when, today)) {
      continue;
    }
    for (const key of nodeKeysForTask(task, index)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}

/** Tree rows that have at least one task in any status. */
export function nodesWithTasks(tasks: readonly TaskItem[], index: ScopeIndex): Set<string> {
  const keys = new Set<string>();
  for (const task of tasks) {
    for (const key of nodeKeysForTask(task, index)) {
      keys.add(key);
    }
  }
  return keys;
}

/** Counts for the date rows, the Completed row and the Cancelled row, within the chosen tree row. */
export function countByView(
  tasks: readonly TaskItem[],
  node: TaskNode | null,
  today: string,
  index: ScopeIndex,
): {
  when: Record<TaskWhen, number>;
  completed: number;
  cancelled: number;
} {
  const key = node ? nodeKey(node) : null;
  const inNode = tasks.filter((task) => key == null || nodeKeysForTask(task, index).has(key));

  const when = {} as Record<TaskWhen, number>;
  for (const option of TASK_WHEN) {
    when[option] = inNode.filter((task) => matchesBase(task, "open", option, today)).length;
  }

  return {
    when,
    completed: inNode.filter((task) => matchesView(task, "completed")).length,
    cancelled: inNode.filter((task) => matchesView(task, "cancelled")).length,
  };
}

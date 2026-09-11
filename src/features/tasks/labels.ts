import { format, parseISO } from "date-fns";
import type { PlanOption, TaskItem, TaskTag } from "./types";
import { isOpenStatus } from "./types";

export function tagLabel(tag: TaskTag | null) {
  if (tag === "WOL") return "Life";
  if (tag === "WOB") return "Business";
  if (tag === "OPEN") return "Open item";
  return "—";
}

export function formatTarget(value: string | null) {
  if (!value) {
    return "—";
  }
  return format(parseISO(value), "d MMM");
}

export function formatNoteTime(value: string) {
  return format(parseISO(value), "d MMM yyyy");
}

export function planLabel(plan: PlanOption) {
  return `${plan.spokeName} → ${plan.description}`;
}

export function workingToward(task: TaskItem, catalog: PlanOption[]) {
  const byId = new Map(catalog.map((plan) => [plan.id, plan]));
  const labels = task.planIds
    .map((id) => {
      const plan = byId.get(id);
      return plan ? planLabel(plan) : null;
    })
    .filter((label): label is string => Boolean(label));
  return labels.length > 0 ? labels.join(" · ") : "—";
}

export function openCounts(tasks: TaskItem[]) {
  const open = tasks.filter((task) => isOpenStatus(task.status));
  return {
    open: open.length,
    life: open.filter((task) => task.tag === "WOL").length,
    business: open.filter((task) => task.tag === "WOB").length,
    openItem: open.filter((task) => task.tag === "OPEN").length,
  };
}

export function sortOpen(tasks: TaskItem[]) {
  return [...tasks].sort((a, b) => {
    if (a.targetOn && b.targetOn) {
      const byDate = a.targetOn.localeCompare(b.targetOn);
      if (byDate !== 0) return byDate;
    } else if (a.targetOn) {
      return -1;
    } else if (b.targetOn) {
      return 1;
    }
    return a.title.localeCompare(b.title);
  });
}

export function sortClosed(tasks: TaskItem[]) {
  return [...tasks].sort((a, b) => {
    if (a.completedOn && b.completedOn) {
      return b.completedOn.localeCompare(a.completedOn);
    }
    if (a.completedOn) return -1;
    if (b.completedOn) return 1;
    return a.title.localeCompare(b.title);
  });
}

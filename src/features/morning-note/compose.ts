import type { MorningNote, MorningTask } from "./types";

export const TODAY_LIMIT = 4;

export function shouldSend(note: Pick<MorningNote, "dueToday" | "overdue" | "meeting">) {
  return note.dueToday.length > 0 || note.overdue.length > 0 || note.meeting != null;
}

/**
 * Spoke names from today's tasks. If nothing is linked to a spoke, Life or
 * Business from the tag. Open item never appears here — that is not a wheel.
 */
export function towardSpokes(dueToday: MorningTask[]) {
  const names: string[] = [];
  const seen = new Set<string>();

  function add(name: string) {
    if (!name || seen.has(name)) {
      return;
    }
    seen.add(name);
    names.push(name);
  }

  for (const task of dueToday) {
    for (const spoke of task.spokes) {
      add(spoke);
    }
  }

  if (names.length === 0) {
    for (const task of dueToday) {
      if (task.tagLabel === "Life" || task.tagLabel === "Business") {
        add(task.tagLabel);
      }
    }
  }

  return names;
}

export function subjectLine(
  dayShort: string,
  toward: string[],
  hasDue: boolean,
  hasMeeting: boolean,
  hasOverdue: boolean,
) {
  if (toward.length > 0) {
    return `${dayShort} · ${toward.slice(0, 3).join(", ")}`;
  }
  if (hasMeeting && !hasDue) {
    return `${dayShort} · board`;
  }
  if (hasOverdue && !hasDue) {
    return `${dayShort} · overdue`;
  }
  return dayShort;
}

export function taskLine(task: MorningTask) {
  const meta = [task.tagLabel, ...task.spokes, task.repeatLabel].filter(
    (part): part is string => Boolean(part),
  );
  return { title: task.title, meta: meta.join(" · ") };
}

export function overdueLine(task: MorningTask) {
  const meta = [task.tagLabel, task.targetLabel].filter((part): part is string => Boolean(part));
  return { title: task.title, meta: meta.join(" · ") };
}

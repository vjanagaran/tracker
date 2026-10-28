import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDays,
  buildScopeIndex,
  countByNode,
  countByView,
  filterTasks,
  INITIAL_SCOPE,
  matchesWhen,
  nodeKeysForTask,
  nodesWithTasks,
  type TaskScope,
} from "./scope.ts";
import type { TaskItem, TaskTreeWheel } from "./types.ts";

const tree: TaskTreeWheel[] = [
  {
    type: "WOL",
    spokes: [
      {
        id: "health",
        name: "Health",
        isActive: true,
        focusAreas: [
          { id: "sleep", issue: "Sleep" },
          { id: "walk", issue: "Walking" },
        ],
      },
      {
        id: "family",
        name: "Family",
        isActive: true,
        focusAreas: [{ id: "amma", issue: "Time with Amma" }],
      },
    ],
  },
  {
    type: "WOB",
    spokes: [
      {
        id: "sales",
        name: "Sales",
        isActive: true,
        focusAreas: [{ id: "leads", issue: "Leads" }],
      },
    ],
  },
];

const plans = [
  { id: "p-sleep", focusAreaId: "sleep" },
  { id: "p-walk", focusAreaId: "walk" },
  { id: "p-amma", focusAreaId: "amma" },
  { id: "p-leads", focusAreaId: "leads" },
];

const index = buildScopeIndex(tree, plans);
const today = "2026-10-13";

function task(partial: Partial<TaskItem> & Pick<TaskItem, "id">): TaskItem {
  return {
    title: partial.id,
    description: null,
    tag: null,
    status: "Not Started",
    priority: "flexi",
    progress: 0,
    plannedStartOn: null,
    plannedStartTime: null,
    targetOn: null,
    targetTime: null,
    completedOn: null,
    repeatEvery: null,
    repeatUntil: null,
    seriesId: partial.id,
    planIds: [],
    boardIds: [],
    notes: [],
    ...partial,
  };
}

const tasks = [
  task({ id: "a", targetOn: "2026-10-13", planIds: ["p-sleep"] }),
  task({ id: "b", targetOn: "2026-10-14", planIds: ["p-sleep", "p-walk"] }),
  task({ id: "c", targetOn: "2026-10-05", planIds: ["p-amma"], status: "Work in Progress" }),
  task({ id: "d", targetOn: "2026-10-30", tag: "WOL" }),
  task({ id: "e", targetOn: "2026-10-13", tag: "WOB", planIds: ["p-leads"] }),
  task({ id: "f", tag: "WOB" }),
  task({ id: "g", targetOn: "2026-10-13", status: "Completed", planIds: ["p-sleep"] }),
  task({ id: "h", status: "Cancelled", planIds: ["p-walk"] }),
  task({ id: "i", targetOn: "2026-11-02" }),
];

function ids(list: TaskItem[]) {
  return list.map((row) => row.id).sort();
}

function scope(partial: Partial<TaskScope>): TaskScope {
  return { ...INITIAL_SCOPE, ...partial };
}

describe("date views", () => {
  it("adds days across a month end", () => {
    assert.equal(addDays("2026-10-30", 3), "2026-11-02");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  });

  it("matches each view on the finish-by date", () => {
    assert.equal(matchesWhen("2026-10-13", "today", today), true);
    assert.equal(matchesWhen("2026-10-14", "today", today), false);
    assert.equal(matchesWhen("2026-10-14", "tomorrow", today), true);
    assert.equal(matchesWhen("2026-10-12", "overdue", today), true);
    assert.equal(matchesWhen("2026-10-13", "overdue", today), false);
    assert.equal(matchesWhen("2026-10-19", "next7", today), true);
    assert.equal(matchesWhen("2026-10-20", "next7", today), false);
    assert.equal(matchesWhen("2026-10-31", "month", today), true);
    assert.equal(matchesWhen("2026-11-01", "month", today), false);
  });

  it("leaves a task with no date to the all view", () => {
    assert.equal(matchesWhen(null, "all", today), true);
    for (const when of ["overdue", "today", "tomorrow", "next7", "month"] as const) {
      assert.equal(matchesWhen(null, when, today), false);
    }
  });
});

describe("where a task sits in the tree", () => {
  it("follows the plans it works toward, once per row", () => {
    const keys = nodeKeysForTask(tasks[1] as TaskItem, index);
    assert.deepEqual([...keys].sort(), [
      "focus:sleep",
      "focus:walk",
      "spoke:health",
      "wheel:WOL",
    ]);
  });

  it("puts a tagged task with no plan under its wheel's no-focus-area row", () => {
    assert.deepEqual([...nodeKeysForTask(tasks[3] as TaskItem, index)].sort(), [
      "unlinked:WOL",
      "wheel:WOL",
    ]);
  });

  it("leaves an untagged task with no plan off the tree", () => {
    assert.equal(nodeKeysForTask(tasks[8] as TaskItem, index).size, 0);
  });

  it("lets a plan decide over the tag", () => {
    const keys = nodeKeysForTask(
      task({ id: "x", tag: "WOB", planIds: ["p-sleep"] }),
      index,
    );
    assert.equal(keys.has("wheel:WOL"), true);
    assert.equal(keys.has("wheel:WOB"), false);
  });
});

describe("filtering", () => {
  it("shows every open task by default, and none that are closed", () => {
    assert.deepEqual(ids(filterTasks(tasks, INITIAL_SCOPE, today, index)), [
      "a", "b", "c", "d", "e", "f", "i",
    ]);
  });

  it("narrows by date", () => {
    assert.deepEqual(ids(filterTasks(tasks, scope({ when: "today" }), today, index)), ["a", "e"]);
    assert.deepEqual(ids(filterTasks(tasks, scope({ when: "overdue" }), today, index)), ["c"]);
  });

  it("narrows by tree row, and a date and a row can combine", () => {
    assert.deepEqual(
      ids(filterTasks(tasks, scope({ node: { kind: "spoke", id: "health" } }), today, index)),
      ["a", "b"],
    );
    assert.deepEqual(
      ids(
        filterTasks(
          tasks,
          scope({ when: "today", node: { kind: "wheel", wheel: "WOL" } }),
          today,
          index,
        ),
      ),
      ["a"],
    );
    assert.deepEqual(
      ids(
        filterTasks(tasks, scope({ node: { kind: "unlinked", wheel: "WOB" } }), today, index),
      ),
      ["f"],
    );
  });

  it("lists completed and cancelled tasks within a tree row", () => {
    assert.deepEqual(ids(filterTasks(tasks, scope({ view: "completed" }), today, index)), ["g"]);
    assert.deepEqual(
      ids(
        filterTasks(
          tasks,
          scope({ view: "cancelled", node: { kind: "focus", id: "walk" } }),
          today,
          index,
        ),
      ),
      ["h"],
    );
  });
});

describe("counts", () => {
  it("counts a task once on a spoke even when two of its plans sit under it", () => {
    const counts = countByNode(tasks, INITIAL_SCOPE, today, index);
    assert.equal(counts.get("spoke:health"), 2);
    assert.equal(counts.get("focus:sleep"), 2);
    assert.equal(counts.get("focus:walk"), 1);
    assert.equal(counts.get("wheel:WOL"), 4);
    assert.equal(counts.get("wheel:WOB"), 2);
    assert.equal(counts.get("unlinked:WOL"), 1);
  });

  it("follows the chosen view and date", () => {
    const today_ = countByNode(tasks, { view: "open", when: "today" }, today, index);
    assert.equal(today_.get("wheel:WOL"), 1);
    const done = countByNode(tasks, { view: "completed", when: "all" }, today, index);
    assert.equal(done.get("wheel:WOL"), 1);
    assert.equal(done.get("wheel:WOB"), undefined);
  });

  it("counts the date rows, Completed and Cancelled within the chosen tree row", () => {
    const all = countByView(tasks, null, today, index);
    assert.equal(all.when.all, 7);
    assert.equal(all.when.today, 2);
    assert.equal(all.when.tomorrow, 1);
    assert.equal(all.when.overdue, 1);
    assert.equal(all.completed, 1);
    assert.equal(all.cancelled, 1);

    const health = countByView(tasks, { kind: "spoke", id: "health" }, today, index);
    assert.equal(health.when.all, 2);
    assert.equal(health.completed, 1);
    assert.equal(health.cancelled, 1);
  });

  it("knows which rows have had any task", () => {
    const rows = nodesWithTasks(tasks, index);
    assert.equal(rows.has("spoke:family"), true);
    assert.equal(rows.has("unlinked:WOB"), true);
    assert.equal(rows.has("unlinked:WOL"), true);
  });
});

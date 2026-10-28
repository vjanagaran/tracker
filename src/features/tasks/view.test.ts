import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { taskChips } from "./chips.ts";
import {
  addDays,
  addMonths,
  daysBetween,
  formatTime,
  monthHeading,
  monthWeeks,
  nextMonday,
  startOfMonth,
  startOfWeek,
  thisWeekend,
  weekdayShort,
} from "./dates.ts";
import { compareOpen } from "./order.ts";
import { dateGroupKey, groupByDate, relativeDay, startLabel, weekdayHeading } from "./grouping.ts";
import { INITIAL_SCOPE } from "./scope.ts";
import { INITIAL_VIEW, nodeFromKey, parseViewState, viewStateSearch } from "./url.ts";
import type { PlanOption, TaskItem, TaskTreeWheel } from "./types.ts";

// Wednesday
const TODAY = "2026-10-14";

function task(partial: Partial<TaskItem> & { id: string }): TaskItem {
  return {
    title: partial.id,
    description: null,
    priority: "flexi",
    progress: 0,
    plannedStartTime: null,
    targetTime: null,
    tag: null,
    status: "Not Started",
    plannedStartOn: null,
    targetOn: null,
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

const tree: TaskTreeWheel[] = [
  { type: "WOL", spokes: [{ id: "s1", name: "Health", isActive: true, focusAreas: [{ id: "f1", issue: "Sleep" }] }] },
  { type: "WOB", spokes: [{ id: "s2", name: "Sales", isActive: true, focusAreas: [{ id: "f2", issue: "Pipeline" }] }] },
];

function plan(id: string, wheelType: "WOL" | "WOB", spokeName: string): PlanOption {
  return { id, description: `Plan ${id}`, spokeName, focusIssue: "x", wheelType, focusAreaId: "f1" };
}

describe("dates", () => {
  it("adds days across month and year ends", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });

  it("counts days between two dates", () => {
    assert.equal(daysBetween("2026-10-14", "2026-10-17"), 3);
    assert.equal(daysBetween("2026-10-14", "2026-10-11"), -3);
    assert.equal(daysBetween("2026-10-14", "2026-10-14"), 0);
  });

  it("starts the week on Monday", () => {
    assert.equal(startOfWeek("2026-10-14"), "2026-10-12");
    assert.equal(startOfWeek("2026-10-12"), "2026-10-12");
    assert.equal(startOfWeek("2026-10-18"), "2026-10-12");
  });
});

describe("times and shortcut days", () => {
  it("writes a time the way people say it", () => {
    assert.equal(formatTime("17:30"), "5:30 pm");
    assert.equal(formatTime("09:05"), "9:05 am");
    assert.equal(formatTime("00:00"), "12:00 am");
    assert.equal(formatTime("12:15"), "12:15 pm");
  });

  it("finds the coming weekend and next Monday", () => {
    // Wednesday
    assert.equal(thisWeekend("2026-10-14"), "2026-10-17");
    assert.equal(nextMonday("2026-10-14"), "2026-10-19");
    // Tuesday, as in the reference screen: Mon 19 Oct
    assert.equal(nextMonday("2026-10-13"), "2026-10-19");
    // On the weekend itself, this weekend is today
    assert.equal(thisWeekend("2026-10-17"), "2026-10-17");
    assert.equal(thisWeekend("2026-10-18"), "2026-10-18");
    // From a Sunday or a Monday, next Monday is a day or a week away
    assert.equal(nextMonday("2026-10-18"), "2026-10-19");
    assert.equal(nextMonday("2026-10-12"), "2026-10-19");
    assert.equal(weekdayShort("2026-10-19"), "Mon");
  });
});

describe("compareOpen", () => {
  const base = { targetOn: "2026-10-20", targetTime: null, priority: "flexi" as const, title: "x" };

  it("puts the earlier day first, and dated before undated", () => {
    assert.ok(compareOpen(base, { ...base, targetOn: "2026-10-21" }) < 0);
    assert.ok(compareOpen(base, { ...base, targetOn: null }) < 0);
  });

  it("orders a day by time, with untimed tasks first", () => {
    assert.ok(compareOpen(base, { ...base, targetTime: "09:00" }) < 0);
    assert.ok(compareOpen({ ...base, targetTime: "09:00" }, { ...base, targetTime: "17:30" }) < 0);
  });

  it("uses priority only to break a tie", () => {
    assert.ok(compareOpen({ ...base, priority: "high" }, base) < 0);
    assert.ok(compareOpen({ ...base, priority: "low" }, { ...base, priority: "medium" }) > 0);
    // A flexi task due earlier still comes before a high one due later.
    assert.ok(compareOpen(base, { ...base, targetOn: "2026-10-21", priority: "high" }) < 0);
  });
});

describe("months", () => {
  it("finds and moves between months", () => {
    assert.equal(startOfMonth("2026-10-14"), "2026-10-01");
    assert.equal(addMonths("2026-10-14", 1), "2026-11-01");
    assert.equal(addMonths("2026-12-20", 1), "2027-01-01");
    assert.equal(addMonths("2026-01-31", -1), "2025-12-01");
    assert.equal(monthHeading("2026-10-14"), "October 2026");
  });

  it("covers a month with whole Monday-to-Sunday weeks", () => {
    const weeks = monthWeeks("2026-10-01");
    assert.equal(weeks.length, 5);
    assert.equal(weeks[0][0], "2026-09-28");
    assert.equal(weeks[4][6], "2026-11-01");
    assert.ok(weeks.every((week) => week.length === 7));
  });

  it("adds a sixth week only when the month needs it", () => {
    // 1 Mar 2026 is a Sunday: six rows.
    assert.equal(monthWeeks("2026-03-01").length, 6);
    // 1 Feb 2027 is a Monday and the month has 28 days: four rows.
    assert.equal(monthWeeks("2027-02-01").length, 4);
  });
});

describe("relativeDay", () => {
  it("names today and tomorrow", () => {
    assert.deepEqual(relativeDay(TODAY, TODAY, true), { text: "Today", overdue: false });
    assert.deepEqual(relativeDay("2026-10-15", TODAY, true), { text: "Tomorrow", overdue: false });
  });

  it("counts overdue days in words", () => {
    assert.deepEqual(relativeDay("2026-10-13", TODAY, true), { text: "1 day overdue", overdue: true });
    assert.deepEqual(relativeDay("2026-10-11", TODAY, true), { text: "3 days overdue", overdue: true });
  });

  it("shows the weekday within a week and the plain date beyond it", () => {
    assert.equal(relativeDay("2026-10-16", TODAY, true).text, "Fri 16 Oct");
    assert.equal(relativeDay("2026-10-30", TODAY, true).text, "30 Oct");
    assert.equal(relativeDay("2027-01-05", TODAY, true).text, "5 Jan 2027");
  });

  it("never calls a closed task overdue", () => {
    assert.deepEqual(relativeDay("2026-10-01", TODAY, false), { text: "1 Oct", overdue: false });
  });

  it("reads a missing date", () => {
    assert.equal(relativeDay(null, TODAY, true).text, "No date");
  });

  it("writes weekday headings", () => {
    assert.equal(weekdayHeading("2026-10-12"), "Mon 12 Oct");
  });
});

describe("startLabel", () => {
  it("looks ahead to a start that has not come", () => {
    assert.equal(startLabel(TODAY, TODAY, true), "Starts today");
    assert.equal(startLabel("2026-10-15", TODAY, true), "Starts tomorrow");
    assert.equal(startLabel("2026-10-16", TODAY, true), "Starts Fri 16 Oct");
    assert.equal(startLabel("2026-11-02", TODAY, true), "Starts 2 Nov");
  });

  it("looks back at a start that has passed", () => {
    assert.equal(startLabel("2026-10-13", TODAY, true), "Started yesterday");
    assert.equal(startLabel("2026-10-01", TODAY, true), "Started 1 Oct");
  });

  it("adds the start time while the start is ahead", () => {
    assert.equal(startLabel("2026-10-15", TODAY, true, "09:00"), "Starts tomorrow at 9:00 am");
    assert.equal(startLabel(TODAY, TODAY, true, "17:30"), "Starts today at 5:30 pm");
    assert.equal(startLabel("2026-10-13", TODAY, true, "09:00"), "Started yesterday");
  });

  it("says nothing without a start or once the task is closed", () => {
    assert.equal(startLabel(null, TODAY, true), null);
    assert.equal(startLabel("2026-10-16", TODAY, false), null);
  });
});

describe("groupByDate", () => {
  it("groups open tasks in reading order and drops empty groups", () => {
    const groups = groupByDate(
      [
        task({ id: "none" }),
        task({ id: "later", targetOn: "2026-11-01" }),
        task({ id: "late", targetOn: "2026-10-01" }),
        task({ id: "tmrw", targetOn: "2026-10-15" }),
        task({ id: "now", targetOn: TODAY }),
      ],
      TODAY,
    );
    assert.deepEqual(
      groups.map((group) => [group.key, group.tasks.map((t) => t.id)]),
      [
        ["overdue", ["late"]],
        ["today", ["now"]],
        ["tomorrow", ["tmrw"]],
        ["upcoming", ["later"]],
        ["none", ["none"]],
      ],
    );
    assert.deepEqual(groupByDate([], TODAY), []);
  });

  it("sorts inside a group by date, then title", () => {
    const groups = groupByDate(
      [
        task({ id: "b", title: "b", targetOn: "2026-10-20" }),
        task({ id: "a2", title: "a", targetOn: "2026-10-22" }),
        task({ id: "a1", title: "a", targetOn: "2026-10-20" }),
      ],
      TODAY,
    );
    assert.deepEqual(groups[0].tasks.map((t) => t.id), ["a1", "b", "a2"]);
  });

  it("keys a date", () => {
    assert.equal(dateGroupKey("2026-10-13", TODAY), "overdue");
    assert.equal(dateGroupKey(null, TODAY), "none");
  });
});

describe("taskChips", () => {
  const planById = new Map([
    ["p1", plan("p1", "WOL", "Health")],
    ["p2", plan("p2", "WOL", "Health")],
    ["p3", plan("p3", "WOB", "Sales")],
  ]);

  it("gives one chip per spoke, labelled with its wheel", () => {
    const chips = taskChips(task({ id: "t", planIds: ["p1", "p2", "p3"] }), planById);
    assert.deepEqual(
      chips.map((chip) => [chip.label, chip.wheel]),
      [
        ["Life · Health", "WOL"],
        ["Business · Sales", "WOB"],
      ],
    );
  });

  it("falls back to the tag when there is no plan", () => {
    assert.deepEqual(taskChips(task({ id: "t", tag: "WOB" }), planById).map((c) => c.label), ["Business"]);
    assert.deepEqual(taskChips(task({ id: "t", tag: "WOL" }), planById).map((c) => c.label), ["Life"]);
    assert.deepEqual(taskChips(task({ id: "t", tag: "OPEN" }), planById).map((c) => c.label), ["Open item"]);
    assert.deepEqual(taskChips(task({ id: "t" }), planById), []);
  });
});

describe("view state in the address", () => {
  it("reads a full address", () => {
    const params = new URLSearchParams("node=spoke:s1&layout=week&present=1");
    assert.deepEqual(parseViewState(params, tree), {
      scope: { view: "open", when: "all", node: { kind: "spoke", id: "s1" } },
      layout: "week",
      present: true,
    });
  });

  it("falls back on anything it does not recognise", () => {
    const params = new URLSearchParams("view=nope&when=never&node=spoke:gone&layout=grid");
    assert.deepEqual(parseViewState(params, tree), INITIAL_VIEW);
  });

  it("ignores date and layout choices on the closed views", () => {
    const state = parseViewState(new URLSearchParams("view=completed&when=today&layout=board"), tree);
    assert.deepEqual(state.scope, { view: "completed", when: "all", node: null });
    assert.equal(state.layout, "list");
  });

  it("lets a date view win over the week layout", () => {
    const state = parseViewState(new URLSearchParams("when=today&layout=week"), tree);
    assert.equal(state.scope.when, "today");
    assert.equal(state.layout, "list");
  });

  it("treats the calendar like the week", () => {
    const state = parseViewState(new URLSearchParams("layout=calendar&when=today"), tree);
    assert.equal(state.layout, "list");
    assert.equal(parseViewState(new URLSearchParams("layout=calendar"), tree).layout, "calendar");
  });

  it("round-trips through the query string", () => {
    const state = {
      scope: { view: "open" as const, when: "next7" as const, node: { kind: "focus" as const, id: "f2" } },
      layout: "board" as const,
      present: false,
    };
    const search = viewStateSearch(state);
    assert.equal(search, "?when=next7&node=focus%3Af2&layout=board");
    assert.deepEqual(parseViewState(new URLSearchParams(search), tree), state);
  });

  it("writes nothing for the default view", () => {
    assert.equal(viewStateSearch(INITIAL_VIEW), "");
    assert.deepEqual(INITIAL_VIEW.scope, INITIAL_SCOPE);
  });

  it("finds tree rows by key", () => {
    assert.deepEqual(nodeFromKey("wheel:WOB", tree), { kind: "wheel", wheel: "WOB" });
    assert.deepEqual(nodeFromKey("unlinked:WOL", tree), { kind: "unlinked", wheel: "WOL" });
    assert.deepEqual(nodeFromKey("focus:f1", tree), { kind: "focus", id: "f1" });
    assert.equal(nodeFromKey("focus:zzz", tree), null);
    assert.equal(nodeFromKey(null, tree), null);
  });
});

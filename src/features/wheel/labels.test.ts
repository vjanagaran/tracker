import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPlanTaskCount, tallyPlanTaskCounts } from "./labels.ts";

describe("plan task counts", () => {
  it("counts completed against every non-cancelled task working toward a plan", () => {
    const counts = tallyPlanTaskCounts([
      { actionPlanId: "walk", status: "Completed" },
      { actionPlanId: "walk", status: "Completed" },
      { actionPlanId: "walk", status: "Not Started" },
      { actionPlanId: "walk", status: "Work in Progress" },
      { actionPlanId: "walk", status: "Cancelled" },
      { actionPlanId: "yoga", status: "Completed" },
    ]);

    assert.deepEqual(counts.get("walk"), { completed: 2, total: 4 });
    assert.deepEqual(counts.get("yoga"), { completed: 1, total: 1 });
    assert.equal(counts.has("missing"), false);
  });

  it("renders a count only when tasks are linked", () => {
    assert.equal(formatPlanTaskCount(3, 7), "3/7");
    assert.equal(formatPlanTaskCount(0, 2), "0/2");
    assert.equal(formatPlanTaskCount(0, 0), "—");
  });
});

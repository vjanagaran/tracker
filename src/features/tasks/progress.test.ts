import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canSetProgress, effectiveProgress } from "./progress.ts";

describe("task progress", () => {
  it("lets the member set it only while a task is moving, held or postponed", () => {
    assert.equal(canSetProgress("Work in Progress"), true);
    assert.equal(canSetProgress("Hold Now"), true);
    assert.equal(canSetProgress("Postponed"), true);
    assert.equal(canSetProgress("Not Started"), false);
    assert.equal(canSetProgress("Completed"), false);
    assert.equal(canSetProgress("Cancelled"), false);
  });

  it("reads not started as 0 and completed as 100, whatever was stored", () => {
    assert.equal(effectiveProgress("Not Started", 60), 0);
    assert.equal(effectiveProgress("Completed", 60), 100);
  });

  it("keeps the member's own number for the other statuses", () => {
    assert.equal(effectiveProgress("Work in Progress", 60), 60);
    assert.equal(effectiveProgress("Hold Now", 35), 35);
    assert.equal(effectiveProgress("Postponed", 0), 0);
  });
});

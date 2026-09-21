import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSendHour, isTimeZone, localNow } from "./clock.ts";
import { shouldSend, subjectLine, towardSpokes } from "./compose.ts";
import type { MorningTask } from "./types.ts";

function task(partial: Partial<MorningTask> & Pick<MorningTask, "title">): MorningTask {
  return {
    id: partial.id ?? partial.title,
    title: partial.title,
    tagLabel: partial.tagLabel ?? null,
    spokes: partial.spokes ?? [],
    repeatLabel: partial.repeatLabel ?? null,
    targetLabel: partial.targetLabel ?? null,
  };
}

describe("morning note clock", () => {
  it("accepts a real IANA zone and rejects junk", () => {
    assert.equal(isTimeZone("Asia/Kolkata"), true);
    assert.equal(isTimeZone("Not/AZone"), false);
    assert.equal(isTimeZone(""), false);
  });

  it("reads the hour in the member's zone, not UTC", () => {
    // 01:30 UTC on 19 Sep is 07:00 in Kolkata.
    const at = new Date("2026-09-19T01:30:00.000Z");
    assert.equal(localNow("Asia/Kolkata", at).hour, 7);
    assert.equal(localNow("Asia/Kolkata", at).isoDay, "2026-09-19");
    assert.equal(isSendHour("Asia/Kolkata", at), true);
    assert.equal(isSendHour("UTC", at), false);
  });
});

describe("morning note compose", () => {
  it("stays quiet when the day is empty", () => {
    assert.equal(shouldSend({ dueToday: [], overdue: [], meeting: null }), false);
  });

  it("sends when there is due work, overdue work, or a meeting today", () => {
    assert.equal(
      shouldSend({ dueToday: [task({ title: "Walk" })], overdue: [], meeting: null }),
      true,
    );
    assert.equal(
      shouldSend({ dueToday: [], overdue: [task({ title: "Call" })], meeting: null }),
      true,
    );
    assert.equal(
      shouldSend({
        dueToday: [],
        overdue: [],
        meeting: { boardName: "Founders", when: "7:00 pm" },
      }),
      true,
    );
  });

  it("names spokes first, then Life/Business tags, never Open item", () => {
    assert.deepEqual(
      towardSpokes([
        task({ title: "Walk", spokes: ["Health"], tagLabel: "Life" }),
        task({ title: "Meet", spokes: ["Sales", "Health"], tagLabel: "Business" }),
      ]),
      ["Health", "Sales"],
    );
    assert.deepEqual(
      towardSpokes([
        task({ title: "Ship", tagLabel: "Business" }),
        task({ title: "Errand", tagLabel: "Open item" }),
      ]),
      ["Business"],
    );
    assert.deepEqual(towardSpokes([task({ title: "Errand", tagLabel: "Open item" })]), []);
  });

  it("builds a subject from spokes, not from counts", () => {
    assert.equal(subjectLine("19 Sep", ["Health", "Business"], true, false, true), "19 Sep · Health, Business");
    assert.equal(subjectLine("19 Sep", [], false, true, false), "19 Sep · board");
    assert.equal(subjectLine("19 Sep", [], false, false, true), "19 Sep · overdue");
  });
});

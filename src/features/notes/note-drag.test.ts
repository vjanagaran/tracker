import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DragEvent } from "react";
import { isNoteDrag, readNoteDrag } from "./note-drag.ts";

function eventWith(data: Record<string, string>) {
  return {
    dataTransfer: {
      types: Object.keys(data),
      getData: (type: string) => data[type] ?? "",
    },
  } as unknown as DragEvent;
}

const TYPE = "application/x-note-move";

describe("note drag payload", () => {
  it("recognises a dragged note and reads it back", () => {
    const event = eventWith({
      [TYPE]: JSON.stringify({ id: "n1", title: "Call notes", categoryId: "c1" }),
    });
    assert.equal(isNoteDrag(event), true);
    assert.deepEqual(readNoteDrag(event), { id: "n1", title: "Call notes", categoryId: "c1" });
  });

  it("reads a note with no category as null", () => {
    const event = eventWith({ [TYPE]: JSON.stringify({ id: "n1", title: "x", categoryId: null }) });
    assert.equal(readNoteDrag(event)?.categoryId, null);
  });

  it("ignores other drags and malformed data", () => {
    assert.equal(isNoteDrag(eventWith({ "text/plain": "hello" })), false);
    assert.equal(readNoteDrag(eventWith({ "text/plain": "hello" })), null);
    assert.equal(readNoteDrag(eventWith({ [TYPE]: "not json" })), null);
    assert.equal(readNoteDrag(eventWith({ [TYPE]: JSON.stringify({ title: "no id" }) })), null);
  });
});

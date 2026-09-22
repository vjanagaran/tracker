import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { wheelPdfFilename, wheelPdfPageLabel, wheelPdfSubtitle, wheelPdfTitle } from "./pdf-title.ts";

describe("wheel pdf header", () => {
  it("uses a possessive name on the wheel title", () => {
    assert.equal(wheelPdfTitle("Janagaran", "WOL"), "Janagaran's Wheel of Life");
    assert.equal(wheelPdfTitle("James", "WOB"), "James' Wheel of Business");
    assert.equal(wheelPdfTitle("  ", "WOL"), "Wheel of Life");
  });

  it("puts the cycle month next to the print date", () => {
    assert.equal(
      wheelPdfSubtitle("2026-09-01", new Date(2026, 8, 22)),
      "Sep 2026 | Dt: 22 Sep 2026",
    );
  });

  it("names the file from the wheel and cycle", () => {
    assert.equal(wheelPdfFilename("WOL", "2026-09-01"), "wheel-of-life-2026-09.pdf");
    assert.equal(wheelPdfFilename("WOB", null), "wheel-of-business-draft.pdf");
  });

  it("puts the page number on the right as current / total", () => {
    assert.equal(wheelPdfPageLabel(1, 2), "1 / 2");
  });
});

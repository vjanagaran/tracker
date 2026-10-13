import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ancestorIds,
  buildCategoryTree,
  categoryOptions,
  categoryPath,
  descendantIds,
  notesInScope,
  normalizeCategoryName,
  parseScope,
  rollupCounts,
  siblingPosition,
  visibleCategories,
} from "./categories.ts";

const categories = [
  { id: "people", parentId: null, name: "People", sortOrder: 1 },
  { id: "company", parentId: null, name: "Company", sortOrder: 0 },
  { id: "pvt", parentId: "company", name: "Private limited", sortOrder: 1 },
  { id: "firm", parentId: "company", name: "Partnership", sortOrder: 0 },
  { id: "tax", parentId: "pvt", name: "Tax", sortOrder: 0 },
];

describe("category tree", () => {
  it("orders siblings by sort order at every level", () => {
    const tree = buildCategoryTree(categories);
    assert.deepEqual(
      tree.map((node) => node.id),
      ["company", "people"],
    );
    assert.deepEqual(
      tree[0]?.children.map((node) => node.id),
      ["firm", "pvt"],
    );
    assert.equal(tree[0]?.children[1]?.children[0]?.depth, 2);
  });

  it("breaks a sort-order tie by name", () => {
    const tree = buildCategoryTree([
      { id: "b", parentId: null, name: "Beta", sortOrder: 0 },
      { id: "a", parentId: null, name: "Alpha", sortOrder: 0 },
    ]);
    assert.deepEqual(
      tree.map((node) => node.id),
      ["a", "b"],
    );
  });

  it("hides the children of a collapsed category", () => {
    const tree = buildCategoryTree(categories);
    assert.deepEqual(
      visibleCategories(tree, new Set(["company"])).map((node) => node.id),
      ["company", "people"],
    );
    assert.deepEqual(
      visibleCategories(tree, new Set(["pvt"])).map((node) => node.id),
      ["company", "firm", "pvt", "people"],
    );
  });

  it("finds descendants, ancestors and the path", () => {
    assert.deepEqual([...descendantIds(categories, "company")].sort(), ["firm", "pvt", "tax"]);
    assert.deepEqual(ancestorIds(categories, "tax"), ["company", "pvt"]);
    assert.deepEqual(categoryPath(categories, "tax"), ["Company", "Private limited", "Tax"]);
    assert.deepEqual(categoryPath(categories, null), []);
  });

  it("offers every category except the ones excluded, indented by depth", () => {
    const options = categoryOptions(categories, new Set(["pvt", "tax"]));
    assert.deepEqual(
      options.map((option) => [option.label, option.depth]),
      [
        ["Company", 0],
        ["Company / Partnership", 1],
        ["People", 0],
      ],
    );
  });

  it("reports where a category sits among its siblings", () => {
    assert.deepEqual(siblingPosition(categories, "firm"), { index: 0, count: 2 });
    assert.deepEqual(siblingPosition(categories, "pvt"), { index: 1, count: 2 });
    assert.deepEqual(siblingPosition(categories, "missing"), { index: 0, count: 0 });
  });

  it("normalises a name", () => {
    assert.equal(normalizeCategoryName("  Private   limited "), "Private limited");
  });
});

describe("notes in a category", () => {
  const notes = [
    { id: "1", categoryId: "tax" },
    { id: "2", categoryId: "firm" },
    { id: "3", categoryId: null },
    { id: "4", categoryId: "people" },
  ];

  it("counts a category together with its subcategories", () => {
    const counts = rollupCounts(categories, notes);
    assert.equal(counts.get("company"), 2);
    assert.equal(counts.get("pvt"), 1);
    assert.equal(counts.get("people"), 1);
  });

  it("lists a category's notes with those of its subcategories", () => {
    assert.deepEqual(
      notesInScope(notes, { kind: "category", id: "company" }, categories).map((note) => note.id),
      ["1", "2"],
    );
    assert.deepEqual(
      notesInScope(notes, { kind: "none" }, categories).map((note) => note.id),
      ["3"],
    );
    assert.equal(notesInScope(notes, { kind: "all" }, categories).length, 4);
  });

  it("falls back to every note when the category is unknown", () => {
    assert.deepEqual(parseScope("gone", categories), { kind: "all" });
    assert.deepEqual(parseScope(null, categories), { kind: "all" });
    assert.deepEqual(parseScope("none", categories), { kind: "none" });
    assert.deepEqual(parseScope("tax", categories), { kind: "category", id: "tax" });
  });
});
